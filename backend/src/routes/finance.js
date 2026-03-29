const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission, applyScopeFilter } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

// ═══════════════════════════════════
// 1. 收款管理（應收帳款）
// ═══════════════════════════════════

// GET /api/finance/receivables — 應收總覽
router.get('/receivables', authenticate, requirePermission('finance', 'read'), async (req, res) => {
  try {
    let query = db('payment_nodes AS pn')
      .join('cases AS c', 'c.id', 'pn.case_id')
      .leftJoin('customers AS cu', 'cu.id', 'c.customer_id')
      .leftJoin('users AS d', 'd.id', 'c.designer_id')
      .leftJoin('stores AS s', 's.id', 'c.store_id')
      .select('pn.*', 'c.case_no', 'c.name AS case_name', 'cu.name AS client_name',
              'd.name AS designer_name', 's.name AS store_name');

    applyScopeFilter(query, req, 'c.designer_id', 'c.store_id');
    if (req.query.status === 'pending') query = query.where('pn.received', false);
    if (req.query.status === 'received') query = query.where('pn.received', true);
    if (req.query.overdue === 'true') query = query.where('pn.received', false).where('pn.due_date', '<', new Date());

    const data = await query.orderBy('pn.due_date', 'asc');

    // 統計
    const stats = {
      totalPending: data.filter(d => !d.received).reduce((s, d) => s + d.amount, 0),
      totalReceived: data.filter(d => d.received).reduce((s, d) => s + (d.received_amount || d.amount), 0),
      overdue: data.filter(d => !d.received && d.due_date && new Date(d.due_date) < new Date()).length,
      count: data.length,
    };

    res.json({ data, stats });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/finance/receivables/:id/confirm — 確認收款
router.put('/receivables/:id/confirm', authenticate, requirePermission('finance', 'update'), auditLog('確認收款'), async (req, res) => {
  try {
    const { received_amount, receipt_no } = req.body;
    const node = await db('payment_nodes').where('id', req.params.id).first();
    if (!node) return res.status(404).json({ error: '找不到此節點' });

    await db('payment_nodes').where('id', req.params.id).update({
      received: true,
      received_date: new Date(),
      received_amount: received_amount || node.amount,
      receipt_no,
      updated_at: new Date(),
    });

    // 更新案件已收/待收
    const caseNodes = await db('payment_nodes').where('case_id', node.case_id);
    const collected = caseNodes.filter(n => n.received || n.id === parseInt(req.params.id)).reduce((s, n) => s + (n.received_amount || n.amount), 0);
    const caseData = await db('cases').where('id', node.case_id).first();
    await db('cases').where('id', node.case_id).update({
      collected,
      pending: (caseData.final_amount || caseData.contract_amount || 0) - collected,
      updated_at: new Date(),
    });

    res.json({ message: '已確認收款 $' + (received_amount || node.amount).toLocaleString() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/finance/receivables/:id/remind — 催款
router.post('/receivables/:id/remind', authenticate, requirePermission('finance', 'update'), auditLog('催款'), async (req, res) => {
  try {
    await db('payment_nodes').where('id', req.params.id).update({
      remind_count: db.raw('remind_count + 1'),
      last_remind: new Date(),
    });
    // TODO: LINE 推播催款通知
    res.json({ message: '催款通知已發送' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════
// 2. 工班請款（應付帳款）
// ═══════════════════════════════════

// GET /api/finance/payables — 工班請款列表
router.get('/payables', authenticate, requirePermission('finance', 'read'), async (req, res) => {
  try {
    let query = db('vendor_claims AS vc')
      .leftJoin('cases AS c', 'c.id', 'vc.case_id')
      .leftJoin('vendors AS v', 'v.id', 'vc.vendor_id')
      .select('vc.*', 'c.case_no', 'c.name AS case_name', 'v.name AS vendor_name');

    if (req.query.status) query = query.where('vc.status', req.query.status);
    const data = await query.orderBy('vc.created_at', 'desc');

    const stats = {
      pendingReview: data.filter(d => d.status === '待審核').length,
      pendingAmount: data.filter(d => d.status === '待審核').reduce((s, d) => s + d.amount, 0),
      approved: data.filter(d => d.status === '已核准').reduce((s, d) => s + d.amount, 0),
      paid: data.filter(d => d.status === '已撥款').reduce((s, d) => s + d.amount, 0),
    };

    res.json({ data, stats });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/finance/payables/:id/review — 審核請款
router.put('/payables/:id/review', authenticate, requirePermission('finance', 'update'), auditLog('審核請款'), async (req, res) => {
  try {
    const { action, note } = req.body; // action: 'approve' | 'reject'
    const status = action === 'approve' ? '已核准' : '已拒絕';
    await db('vendor_claims').where('id', req.params.id).update({
      status,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      ...(action === 'approve' ? { approved_by: req.user.id, approved_at: new Date() } : {}),
      note: note || null,
      updated_at: new Date(),
    });
    res.json({ message: status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/finance/payables/:id/pay — 確認撥款
router.put('/payables/:id/pay', authenticate, requirePermission('finance', 'update'), auditLog('確認撥款'), async (req, res) => {
  try {
    const { payment_ref } = req.body;
    await db('vendor_claims').where('id', req.params.id).update({
      status: '已撥款',
      paid_date: new Date(),
      payment_ref,
      updated_at: new Date(),
    });

    // 更新案件成本
    const claim = await db('vendor_claims').where('id', req.params.id).first();
    if (claim?.case_id) {
      const totalCost = await db('vendor_claims').where('case_id', claim.case_id).where('status', '已撥款').sum('amount as total').first();
      const caseData = await db('cases').where('id', claim.case_id).first();
      const margin = caseData.contract_amount > 0 ? ((caseData.contract_amount - (totalCost.total || 0)) / caseData.contract_amount * 100).toFixed(1) : 0;
      await db('cases').where('id', claim.case_id).update({ cost: totalCost.total || 0, gross_margin: margin });
    }

    res.json({ message: '已撥款' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════
// 3. 案件損益
// ═══════════════════════════════════

// GET /api/finance/pnl — 案件損益列表
router.get('/pnl', authenticate, requirePermission('finance', 'read'), async (req, res) => {
  try {
    let query = db('cases AS c')
      .leftJoin('stores AS s', 's.id', 'c.store_id')
      .leftJoin('users AS d', 'd.id', 'c.designer_id')
      .select('c.id', 'c.case_no', 'c.name', 'c.contract_amount', 'c.addon_amount', 'c.final_amount',
              'c.collected', 'c.pending', 'c.cost', 'c.gross_margin', 'c.status', 'c.sign_date',
              's.name AS store_name', 'd.name AS designer_name')
      .where('c.contract_amount', '>', 0);

    applyScopeFilter(query, req, 'c.designer_id', 'c.store_id');
    if (req.query.store_id) query = query.where('c.store_id', req.query.store_id);

    const data = await query.orderBy('c.sign_date', 'desc');

    const stats = {
      totalContract: data.reduce((s, d) => s + (d.contract_amount || 0), 0),
      totalCost: data.reduce((s, d) => s + (d.cost || 0), 0),
      totalCollected: data.reduce((s, d) => s + (d.collected || 0), 0),
      avgMargin: data.length ? (data.reduce((s, d) => s + (parseFloat(d.gross_margin) || 0), 0) / data.length).toFixed(1) : 0,
    };

    res.json({ data, stats });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/finance/pnl/:caseId — 單案損益明細
router.get('/pnl/:caseId', authenticate, requirePermission('finance', 'read'), async (req, res) => {
  try {
    const c = await db('cases').where('id', req.params.caseId).first();
    if (!c) return res.status(404).json({ error: '案件不存在' });
    const payments = await db('payment_nodes').where('case_id', c.id).orderBy('period');
    const claims = await db('vendor_claims').where('case_id', c.id).orderBy('created_at');
    const addons = await db('addons').where('case_id', c.id);

    const revenue = (c.contract_amount || 0) + (c.addon_amount || 0);
    const cost = claims.filter(cl => cl.status === '已撥款').reduce((s, cl) => s + cl.amount, 0);
    const grossProfit = revenue - cost;
    const margin = revenue > 0 ? (grossProfit / revenue * 100).toFixed(1) : 0;

    res.json({
      case: c, payments, claims, addons,
      summary: { revenue, cost, grossProfit, margin },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════
// 4. 發票管理
// ═══════════════════════════════════

// GET /api/finance/invoices — 發票列表
router.get('/invoices', authenticate, requirePermission('finance', 'read'), async (req, res) => {
  try {
    let query = db('invoices AS i')
      .leftJoin('cases AS c', 'c.id', 'i.case_id')
      .select('i.*', 'c.case_no', 'c.name AS case_name');

    if (req.query.type) query = query.where('i.type', req.query.type);
    if (req.query.period) query = query.where('i.period', req.query.period);

    const data = await query.orderBy('i.created_at', 'desc');

    // 按期別統計
    const periods = {};
    data.forEach(inv => {
      const p = inv.period || '未分類';
      if (!periods[p]) periods[p] = { sales: 0, salesTax: 0, purchase: 0, purchaseTax: 0 };
      if (inv.type === 'sales') { periods[p].sales += inv.amount; periods[p].salesTax += inv.tax; }
      else { periods[p].purchase += inv.amount; periods[p].purchaseTax += inv.tax; }
    });

    res.json({ data, periods });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/finance/invoices — 開立發票
router.post('/invoices', authenticate, requirePermission('finance', 'create'), auditLog('開立發票'), async (req, res) => {
  try {
    const { type, case_id, payment_node_id, vendor_id, buyer_seller, tax_id, items, carrier } = req.body;
    const amount = (items || []).reduce((s, it) => s + (it.price * (it.qty || 1)), 0);
    const tax = Math.round(amount * 0.05);

    // 發票號碼
    const prefix = type === 'sales' ? 'AB' : 'CD';
    const seq = String(Math.floor(Math.random() * 90000000 + 10000000));
    const invoice_no = prefix + '-' + seq;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear() - 1911;
    const periodStart = month % 2 === 0 ? month - 1 : month;
    const period = `${year}年${String(periodStart).padStart(2, '0')}-${String(periodStart + 1).padStart(2, '0')}月`;

    const [inv] = await db('invoices').insert({
      invoice_no, type, case_id, payment_node_id, vendor_id, buyer_seller, tax_id,
      items: JSON.stringify(items || []), amount, tax, total: amount + tax,
      carrier, period,
    }).returning('*');

    res.status(201).json(inv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/finance/invoices/:id/void — 作廢
router.put('/invoices/:id/void', authenticate, requirePermission('finance', 'update'), auditLog('作廢發票'), async (req, res) => {
  try {
    await db('invoices').where('id', req.params.id).update({ voided: true, voided_at: new Date(), status: '已作廢' });
    res.json({ message: '發票已作廢' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════
// 5. 現金流看板
// ═══════════════════════════════════

// GET /api/finance/cashflow — 現金流預測
router.get('/cashflow', authenticate, requirePermission('finance', 'read'), async (req, res) => {
  try {
    // 未來 90 天應收
    const inflow = await db('payment_nodes')
      .where('received', false)
      .where('due_date', '>=', new Date())
      .where('due_date', '<=', db.raw("CURRENT_DATE + INTERVAL '90 days'"))
      .orderBy('due_date')
      .select('due_date', 'amount', 'case_id');

    // 未來 90 天應付（已核准未撥款）
    const outflow = await db('vendor_claims')
      .where('status', '已核准')
      .orderBy('created_at')
      .select('created_at AS due_date', 'amount', 'case_id');

    // 匯總
    const inflowTotal = inflow.reduce((s, r) => s + r.amount, 0);
    const outflowTotal = outflow.reduce((s, r) => s + r.amount, 0);

    // 目前餘額（已收 - 已付）
    const received = await db('payment_nodes').where('received', true).sum('received_amount as total').first();
    const paid = await db('vendor_claims').where('status', '已撥款').sum('amount as total').first();
    const currentBalance = (parseInt(received.total) || 0) - (parseInt(paid.total) || 0);

    // 安全天數（按月支出估算）
    const monthlyExpense = outflowTotal > 0 ? outflowTotal / 3 : 500000;
    const safeDays = monthlyExpense > 0 ? Math.round(currentBalance / (monthlyExpense / 30)) : 999;

    res.json({
      currentBalance,
      inflow: { total: inflowTotal, items: inflow },
      outflow: { total: outflowTotal, items: outflow },
      netFlow: inflowTotal - outflowTotal,
      safeDays,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════
// 6. 財務總覽
// ═══════════════════════════════════

// GET /api/finance/dashboard — 財務儀表板
router.get('/dashboard', authenticate, requirePermission('finance', 'read'), async (req, res) => {
  try {
    const totalContract = await db('cases').where('status', 'active').sum('contract_amount as n').first();
    const totalCollected = await db('cases').sum('collected as n').first();
    const totalPending = await db('cases').sum('pending as n').first();
    const totalCost = await db('cases').sum('cost as n').first();

    const overdueNodes = await db('payment_nodes')
      .where('received', false)
      .where('due_date', '<', new Date())
      .count('id as n').first();

    const pendingClaims = await db('vendor_claims')
      .where('status', '待審核')
      .count('id as n').first();

    const pendingClaimAmount = await db('vendor_claims')
      .where('status', '待審核')
      .sum('amount as n').first();

    // 門市營收
    const storeRevenue = await db('cases AS c')
      .join('stores AS s', 's.id', 'c.store_id')
      .where('c.status', 'active')
      .select('s.name AS store')
      .sum('c.contract_amount AS revenue')
      .sum('c.collected AS collected')
      .sum('c.pending AS pending')
      .count('c.id AS cases')
      .groupBy('s.name');

    res.json({
      totalContract: parseInt(totalContract.n) || 0,
      totalCollected: parseInt(totalCollected.n) || 0,
      totalPending: parseInt(totalPending.n) || 0,
      totalCost: parseInt(totalCost.n) || 0,
      grossMargin: (totalContract.n || 0) > 0 ? (((totalContract.n - (totalCost.n || 0)) / totalContract.n) * 100).toFixed(1) : 0,
      overdueCount: parseInt(overdueNodes.n) || 0,
      pendingClaims: parseInt(pendingClaims.n) || 0,
      pendingClaimAmount: parseInt(pendingClaimAmount.n) || 0,
      storeRevenue,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
