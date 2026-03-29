const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission, applyScopeFilter } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

// GET /api/cases — 列表
router.get('/', authenticate, requirePermission('cases', 'read'), async (req, res) => {
  try {
    let query = db('cases AS c')
      .leftJoin('customers AS cu', 'cu.id', 'c.customer_id')
      .leftJoin('users AS d', 'd.id', 'c.designer_id')
      .leftJoin('users AS w', 'w.id', 'c.worker_id')
      .leftJoin('stores AS s', 's.id', 'c.store_id')
      .select(
        'c.*',
        'cu.name AS client_name', 'cu.phone AS client_phone',
        'd.name AS designer_name',
        'w.name AS worker_name',
        's.name AS store_name'
      );

    applyScopeFilter(query, req, 'c.designer_id', 'c.store_id');

    // 篩選
    if (req.query.status) query = query.where('c.status', req.query.status);
    if (req.query.stage) query = query.where('c.stage', req.query.stage);
    if (req.query.health) query = query.where('c.health', req.query.health);
    if (req.query.store_id) query = query.where('c.store_id', req.query.store_id);
    if (req.query.designer_id) query = query.where('c.designer_id', req.query.designer_id);
    if (req.query.search) {
      query = query.where(function() {
        this.where('c.case_no', 'ilike', `%${req.query.search}%`)
          .orWhere('c.name', 'ilike', `%${req.query.search}%`)
          .orWhere('cu.name', 'ilike', `%${req.query.search}%`);
      });
    }

    query = query.orderBy('c.created_at', 'desc');

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const total = await db('cases').count('id as count').first();
    const data = await query.offset((page - 1) * limit).limit(limit);

    res.json({ data, total: parseInt(total.count), page, limit });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/cases/stats — 總覽統計
router.get('/stats', authenticate, requirePermission('cases', 'read'), async (req, res) => {
  try {
    let baseQuery = db('cases');
    if (req.permScope === 'store') baseQuery = baseQuery.where('store_id', req.user.store_id);
    if (req.permScope === 'own') baseQuery = baseQuery.where('designer_id', req.user.id);

    const total = await baseQuery.clone().count('id as n').first();
    const active = await baseQuery.clone().where('status', 'active').count('id as n').first();
    const contract = await baseQuery.clone().where('status', 'active').sum('contract_amount as n').first();
    const collected = await baseQuery.clone().sum('collected as n').first();
    const pending = await baseQuery.clone().sum('pending as n').first();
    const byStage = await baseQuery.clone().select('stage').count('id as n').groupBy('stage');
    const byHealth = await baseQuery.clone().where('status', 'active').select('health').count('id as n').groupBy('health');
    const byStore = await db('cases AS c')
      .join('stores AS s', 's.id', 'c.store_id')
      .where('c.status', 'active')
      .select('s.name AS store', db.raw('SUM(c.contract_amount) AS revenue'), db.raw('COUNT(c.id) AS cases'))
      .groupBy('s.name');

    res.json({
      total: parseInt(total.n), active: parseInt(active.n),
      contract: parseInt(contract.n) || 0, collected: parseInt(collected.n) || 0, pending: parseInt(pending.n) || 0,
      byStage, byHealth, byStore,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/cases/:id — 單筆詳情
router.get('/:id', authenticate, requirePermission('cases', 'read'), async (req, res) => {
  try {
    const c = await db('cases AS c')
      .leftJoin('customers AS cu', 'cu.id', 'c.customer_id')
      .leftJoin('users AS d', 'd.id', 'c.designer_id')
      .leftJoin('users AS w', 'w.id', 'c.worker_id')
      .leftJoin('users AS m', 'm.id', 'c.manager_id')
      .leftJoin('stores AS s', 's.id', 'c.store_id')
      .select('c.*', 'cu.name AS client_name', 'cu.phone AS client_phone', 'cu.email AS client_email',
              'd.name AS designer_name', 'w.name AS worker_name', 'm.name AS manager_name', 's.name AS store_name')
      .where('c.id', req.params.id)
      .first();
    if (!c) return res.status(404).json({ error: '找不到此案件' });

    // 關聯資料
    const payments = await db('payment_nodes').where('case_id', c.id).orderBy('period');
    const addons = await db('addons').where('case_id', c.id).orderBy('created_at', 'desc');
    const site = await db('sites').where('case_id', c.id).first();
    const contract = await db('contracts').where('case_id', c.id).first();
    const ratings = await db('client_ratings').where('case_id', c.id).orderBy('created_at');

    res.json({ ...c, payments, addons, site, contract, ratings });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/cases — 直接建案（非從填單轉換）
router.post('/', authenticate, requirePermission('cases', 'create'), auditLog('建立案件'), async (req, res) => {
  try {
    const {
      customer_name, customer_phone, customer_email, customer_line,
      store_id, designer_id, worker_id, manager_id,
      name, address, area, house_type, style,
      budget, est_sign_date, source, note
    } = req.body;

    if (!customer_name || !customer_phone || !name) {
      return res.status(400).json({ error: '客戶姓名、電話、案件名稱為必填' });
    }

    // 建立或關聯客戶
    let customer_id;
    const existing = await db('customers').where('phone', customer_phone).first();
    if (existing) {
      customer_id = existing.id;
    } else {
      const [nc] = await db('customers').insert({
        name: customer_name, phone: customer_phone, email: customer_email, line_id: customer_line, source,
      }).returning('id');
      customer_id = nc.id || nc;
    }

    // 案件編號
    const year = new Date().getFullYear();
    const caseCount = await db('cases').count('id as n').first();
    const seq = parseInt(caseCount.n) + 1;
    const case_no = `TM-${year}-${String(seq).padStart(3, '0')}`;

    const [newCase] = await db('cases').insert({
      case_no, customer_id, store_id, designer_id, worker_id, manager_id,
      name, address, area: parseFloat(area) || null, house_type, style,
      quote_amount: parseInt(budget) || 0,
      stage: '名單建立', status: 'active', health: 'green',
    }).returning('*');

    // 建立工地
    await db('sites').insert({
      site_no: `SITE-${String(seq).padStart(3, '0')}`,
      case_id: newCase.id,
      name, address,
    });

    // 建立對話群組
    const [group] = await db('chat_groups').insert({ name: `${name} 施工群組`, case_id: newCase.id, type: 'case' }).returning('id');
    const memberIds = [designer_id, worker_id, manager_id].filter(Boolean);
    for (const uid of memberIds) {
      await db('chat_members').insert({ group_id: group.id || group, user_id: uid }).catch(() => {});
    }

    res.status(201).json(newCase);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/cases/:id — 更新案件
router.put('/:id', authenticate, requirePermission('cases', 'update'), auditLog('更新案件'), async (req, res) => {
  try {
    const allowed = [
      'name','address','area','house_type','style','designer_id','worker_id','manager_id','store_id',
      'quote_amount','contract_amount','addon_amount','final_amount','collected','pending','cost','gross_margin',
      'quote_date','sign_date','start_date','est_end_date','actual_end_date','acceptance_date','close_date','warranty_end',
      'stage','status','health','health_reason','progress'
    ];
    const update = { updated_at: new Date() };
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    // 自動算 pending
    if (update.contract_amount !== undefined || update.collected !== undefined) {
      const c = await db('cases').where('id', req.params.id).first();
      const total = update.final_amount || update.contract_amount || c.contract_amount || 0;
      const col = update.collected !== undefined ? update.collected : c.collected;
      update.pending = total - col;
    }

    await db('cases').where('id', req.params.id).update(update);
    res.json({ message: '已更新' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/cases/:id/stage — 推進階段
router.put('/:id/stage', authenticate, requirePermission('cases', 'update'), auditLog('推進階段'), async (req, res) => {
  try {
    const { stage } = req.body;
    const stages = ['名單建立','丈量完成','提案報價','成功簽約','設計深化','發包施工','驗收請款','結案評分'];
    if (!stages.includes(stage)) return res.status(400).json({ error: '無效的階段' });

    const stageIndex = stages.indexOf(stage);
    const progress = Math.round((stageIndex + 1) / stages.length * 100);
    const status = stage === '結案評分' ? 'completed' : 'active';

    await db('cases').where('id', req.params.id).update({
      stage, progress, status, updated_at: new Date(),
      ...(stage === '成功簽約' ? { sign_date: new Date() } : {}),
      ...(stage === '發包施工' ? { start_date: new Date() } : {}),
      ...(stage === '結案評分' ? { close_date: new Date() } : {}),
    });

    res.json({ message: `已推進至「${stage}」`, progress });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/cases/:id/payments — 建立付款節點
router.post('/:id/payments', authenticate, requirePermission('finance', 'create'), auditLog('建立付款節點'), async (req, res) => {
  try {
    const { nodes } = req.body; // [{period:1,name:'簽約款30%',percentage:30,amount:398400,due_date:'2026-04-05'}]
    const caseId = parseInt(req.params.id);
    const contract = await db('contracts').where('case_id', caseId).first();

    for (const node of nodes) {
      await db('payment_nodes').insert({
        case_id: caseId,
        contract_id: contract?.id || null,
        period: node.period,
        name: node.name,
        percentage: node.percentage,
        amount: node.amount,
        due_date: node.due_date,
      });
    }
    res.status(201).json({ message: `已建立 ${nodes.length} 個付款節點` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/cases/:id/addons — 新增追加減
router.post('/:id/addons', authenticate, requirePermission('cases', 'update'), auditLog('新增追加減'), async (req, res) => {
  try {
    const caseId = parseInt(req.params.id);
    const { type, item, reason, amount } = req.body;
    if (!type || !item || !amount) return res.status(400).json({ error: '類型/項目/金額為必填' });

    const lastAddon = await db('addons').where('case_id', caseId).orderBy('id', 'desc').first();
    const seq = lastAddon ? parseInt(lastAddon.addon_no.split('-')[2]) + 1 : 1;
    const addon_no = `ADD-${String(caseId).padStart(3, '0')}-${String(seq).padStart(2, '0')}`;

    const [addon] = await db('addons').insert({
      case_id: caseId, addon_no, type, item, reason,
      amount: type === '追加' ? Math.abs(amount) : -Math.abs(amount),
      designer_id: req.user.id,
    }).returning('*');

    // 更新案件追加減累計
    const totalAddons = await db('addons').where('case_id', caseId).where('status', '已確認').sum('amount as total').first();
    await db('cases').where('id', caseId).update({
      addon_amount: parseInt(totalAddons.total) || 0,
      updated_at: new Date(),
    });

    res.status(201).json(addon);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
