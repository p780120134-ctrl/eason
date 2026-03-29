const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission, applyScopeFilter } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

// 產生填單編號
async function nextLeadNo() {
  const year = new Date().getFullYear();
  const last = await db('leads').where('lead_no', 'like', `L-${year}-%`).orderBy('id', 'desc').first();
  const seq = last ? parseInt(last.lead_no.split('-')[2]) + 1 : 1;
  return `L-${year}-${String(seq).padStart(3, '0')}`;
}

// GET /api/leads — 列表（支援篩選 + scope）
router.get('/', authenticate, requirePermission('leads', 'read'), async (req, res) => {
  try {
    let query = db('leads AS l')
      .leftJoin('users AS u', 'u.id', 'l.assigned_to')
      .leftJoin('stores AS s', 's.id', 'l.store_id')
      .leftJoin('customers AS c', 'c.id', 'l.customer_id')
      .select(
        'l.*',
        'u.name AS designer_name',
        's.name AS store_name',
        'c.name AS customer_name_ref'
      )
      .orderBy('l.filled_at', 'desc');

    // scope 過濾
    applyScopeFilter(query, req, 'l.assigned_to', 'l.store_id');

    // 篩選
    if (req.query.status) query = query.where('l.status', req.query.status);
    if (req.query.urgency) query = query.where('l.urgency', req.query.urgency);
    if (req.query.store_id) query = query.where('l.store_id', req.query.store_id);
    if (req.query.assigned_to) query = query.where('l.assigned_to', req.query.assigned_to);
    if (req.query.unassigned === 'true') query = query.whereNull('l.assigned_to');
    if (req.query.search) {
      query = query.where(function() {
        this.where('l.name', 'ilike', `%${req.query.search}%`)
          .orWhere('l.phone', 'ilike', `%${req.query.search}%`)
          .orWhere('l.district', 'ilike', `%${req.query.search}%`);
      });
    }

    // 分頁
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const total = await db('leads').count('id as count').first();
    const data = await query.offset((page - 1) * limit).limit(limit);

    res.json({ data, total: parseInt(total.count), page, limit });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/leads/stats — 統計
router.get('/stats', authenticate, requirePermission('leads', 'read'), async (req, res) => {
  try {
    const total = await db('leads').count('id as n').first();
    const unprocessed = await db('leads').where('status', '未處理').count('id as n').first();
    const unassigned = await db('leads').whereNull('assigned_to').count('id as n').first();
    const today = await db('leads').where('filled_at', '>=', db.raw("CURRENT_DATE")).count('id as n').first();
    const byStatus = await db('leads').select('status').count('id as n').groupBy('status');
    const bySource = await db('leads').select('source').count('id as n').groupBy('source').orderBy('n', 'desc').limit(10);

    res.json({
      total: parseInt(total.n),
      unprocessed: parseInt(unprocessed.n),
      unassigned: parseInt(unassigned.n),
      today: parseInt(today.n),
      byStatus,
      bySource,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/leads/:id — 單筆
router.get('/:id', authenticate, requirePermission('leads', 'read'), async (req, res) => {
  try {
    const lead = await db('leads AS l')
      .leftJoin('users AS u', 'u.id', 'l.assigned_to')
      .leftJoin('stores AS s', 's.id', 'l.store_id')
      .select('l.*', 'u.name AS designer_name', 's.name AS store_name')
      .where('l.id', req.params.id)
      .first();
    if (!lead) return res.status(404).json({ error: '找不到此填單' });
    res.json(lead);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/leads — 新增填單
router.post('/', authenticate, requirePermission('leads', 'create'), auditLog('新增填單'), async (req, res) => {
  try {
    const {
      name, phone, line_id, city, district, address,
      house_type, house_age, area, budget, contact_time,
      source, progress, urgency, store_id, note
    } = req.body;

    if (!name || !phone) return res.status(400).json({ error: '姓名和電話為必填' });

    const lead_no = await nextLeadNo();

    // 自動建立或關聯客戶
    let customer_id = null;
    const existingCustomer = await db('customers').where('phone', phone).first();
    if (existingCustomer) {
      customer_id = existingCustomer.id;
    } else {
      const [newCustomer] = await db('customers').insert({
        name, phone, line_id, address, district, city, source,
      }).returning('id');
      customer_id = newCustomer.id || newCustomer;
    }

    const [lead] = await db('leads').insert({
      lead_no, customer_id, name, phone, line_id,
      city, district, address, house_type, house_age,
      area, budget, contact_time, source, progress,
      urgency: urgency || 'warm',
      store_id: store_id || null,
      note,
    }).returning('*');

    res.status(201).json(lead);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/leads/:id — 更新
router.put('/:id', authenticate, requirePermission('leads', 'update'), auditLog('更新填單'), async (req, res) => {
  try {
    const allowed = ['name','phone','line_id','city','district','address','house_type','house_age',
      'area','budget','contact_time','source','progress','status','urgency','store_id','note'];
    const update = { updated_at: new Date() };
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    await db('leads').where('id', req.params.id).update(update);
    res.json({ message: '已更新' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/leads/:id/assign — 指派設計師
router.post('/:id/assign', authenticate, requirePermission('leads', 'update'), auditLog('指派設計師'), async (req, res) => {
  try {
    const { designer_id } = req.body;
    if (!designer_id) return res.status(400).json({ error: '請選擇設計師' });

    const designer = await db('users').where('id', designer_id).first();
    if (!designer) return res.status(404).json({ error: '設計師不存在' });

    await db('leads').where('id', req.params.id).update({
      assigned_to: designer_id,
      assigned_at: new Date(),
      status: '已聯繫',
      updated_at: new Date(),
    });

    // TODO: LINE 通知設計師
    // TODO: GP +5（新客接洽）

    res.json({ message: '已指派 ' + designer.name, designer: designer.name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/leads/:id/convert — 填單轉案件
router.post('/:id/convert', authenticate, requirePermission('cases', 'create'), auditLog('填單轉案件'), async (req, res) => {
  try {
    const lead = await db('leads').where('id', req.params.id).first();
    if (!lead) return res.status(404).json({ error: '找不到此填單' });
    if (lead.status === '已成交') return res.status(400).json({ error: '此填單已轉換' });

    // 產生案件編號
    const year = new Date().getFullYear();
    const lastCase = await db('cases').where('case_no', 'like', `TM-${year}-%`).orderBy('id', 'desc').first();
    const seq = lastCase ? parseInt(lastCase.case_no.split('-')[2]) + 1 : 1;
    const case_no = `TM-${year}-${String(seq).padStart(3, '0')}`;

    const {
      store_id, designer_id, house_type, style,
      area, budget, est_sign_date, name: caseName
    } = req.body;

    // 預算文字轉數字
    const budgetMap = { '300萬以上': 3500000, '150~300萬': 2000000, '80~150萬': 1000000, '50~80萬': 600000 };
    const budgetNum = budgetMap[lead.budget] || parseInt(budget) || 0;

    const [newCase] = await db('cases').insert({
      case_no,
      customer_id: lead.customer_id,
      lead_id: lead.id,
      store_id: store_id || lead.store_id,
      designer_id: designer_id || lead.assigned_to,
      manager_id: req.body.manager_id || null,
      name: caseName || `${lead.district} ${lead.name}宅`,
      address: lead.address,
      area: parseFloat(area) || null,
      house_type: house_type || lead.house_type,
      style: style || null,
      quote_amount: budgetNum,
      stage: '名單建立',
      status: 'active',
      health: 'green',
    }).returning('*');

    // 更新填單狀態
    await db('leads').where('id', req.params.id).update({
      status: '已成交',
      updated_at: new Date(),
    });

    // 建立工地
    await db('sites').insert({
      site_no: `SITE-${String(seq).padStart(3, '0')}`,
      case_id: newCase.id,
      name: newCase.name,
      address: newCase.address,
    });

    // 建立對話群組
    const [chatGroup] = await db('chat_groups').insert({
      name: `${newCase.name} 施工群組`,
      case_id: newCase.id,
      type: 'case',
    }).returning('id');

    // 加入成員
    const members = [newCase.designer_id, newCase.manager_id, newCase.worker_id].filter(Boolean);
    for (const uid of members) {
      await db('chat_members').insert({ group_id: chatGroup.id || chatGroup, user_id: uid }).catch(() => {});
    }

    // TODO: LINE 通知
    // TODO: GP 設計師 +20（成功簽約）

    res.status(201).json({
      case: newCase,
      message: `案件 ${case_no} 已建立`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
