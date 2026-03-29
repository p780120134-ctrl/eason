const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission, applyScopeFilter } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

// GET /api/complaints — 列表
router.get('/', authenticate, async (req, res) => {
  try {
    let query = db('complaints AS cp')
      .leftJoin('cases AS c', 'c.id', 'cp.case_id')
      .leftJoin('customers AS cu', 'cu.id', 'cp.customer_id')
      .leftJoin('users AS u', 'u.id', 'cp.assigned_to')
      .select('cp.*', 'c.case_no', 'c.name AS case_name', 'cu.name AS client_name', 'u.name AS assigned_name');

    if (req.user.role === 'client') {
      query = query.where('cp.customer_id', req.user.id); // 客戶只看自己的
    }
    if (req.query.status) query = query.where('cp.status', req.query.status);
    const data = await query.orderBy('cp.created_at', 'desc').limit(100);

    const stats = {
      pending: data.filter(d => d.status === '待處理').length,
      processing: data.filter(d => d.status === '處理中').length,
      completed: data.filter(d => d.status === '已完成').length,
    };
    res.json({ data, stats });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/complaints/:id — 單筆
router.get('/:id', authenticate, async (req, res) => {
  try {
    const cp = await db('complaints AS cp')
      .leftJoin('cases AS c', 'c.id', 'cp.case_id')
      .leftJoin('customers AS cu', 'cu.id', 'cp.customer_id')
      .select('cp.*', 'c.case_no', 'c.name AS case_name', 'cu.name AS client_name')
      .where('cp.id', req.params.id).first();
    if (!cp) return res.status(404).json({ error: '工單不存在' });
    res.json(cp);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/complaints — 建立報修
router.post('/', authenticate, auditLog('建立報修'), async (req, res) => {
  try {
    const { case_id, customer_id, issue, type, urgency, photos } = req.body;
    if (!issue) return res.status(400).json({ error: '請填寫問題說明' });

    // 產生工單號
    const last = await db('complaints').orderBy('id', 'desc').first();
    const seq = last ? parseInt(last.complaint_no?.split('-')[2] || '0') + 1 : 1;
    const complaint_no = `WO-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;

    const [cp] = await db('complaints').insert({
      case_id, customer_id, complaint_no, issue,
      type: type || '保固內',
      urgency: urgency || '一般',
      photos: JSON.stringify(photos || []),
      status: '待處理',
    }).returning('*');

    // 建立對話群組
    const [group] = await db('chat_groups').insert({
      name: `報修：${issue.slice(0, 20)}`,
      case_id,
      type: 'repair',
    }).returning('id');

    await db('complaints').where('id', cp.id).update({ chat_group_id: group.id || group });

    // 自動系統訊息
    await db('chat_messages').insert({
      group_id: group.id || group,
      text: `報修申請已建立：${issue}`,
      is_system: true,
      read_by: JSON.stringify([]),
    });

    res.status(201).json({ ...cp, chat_group_id: group.id || group, message: '報修已送出' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/complaints/:id — 更新狀態
router.put('/:id', authenticate, auditLog('更新報修'), async (req, res) => {
  try {
    const { status, assigned_to, scheduled_date, rating, rating_comment } = req.body;
    const update = { updated_at: new Date() };
    if (status) update.status = status;
    if (assigned_to) update.assigned_to = assigned_to;
    if (scheduled_date) update.scheduled_date = scheduled_date;
    if (status === '已完成') update.completed_date = new Date();
    if (rating) { update.rating = rating; update.rating_comment = rating_comment; }

    await db('complaints').where('id', req.params.id).update(update);
    res.json({ message: '已更新' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
