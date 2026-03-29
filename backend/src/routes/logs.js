const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission, applyScopeFilter } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

// GET /api/logs — 工程日誌列表
router.get('/', authenticate, requirePermission('log_manage', 'read'), async (req, res) => {
  try {
    let query = db('construction_logs AS l')
      .join('users AS u', 'u.id', 'l.user_id')
      .leftJoin('sites AS s', 's.id', 'l.site_id')
      .leftJoin('cases AS c', 'c.id', 'l.case_id')
      .select('l.*', 'u.name AS user_name', 's.name AS site_name', 'c.case_no');
    applyScopeFilter(query, req, 'l.user_id', 'c.store_id');
    if (req.query.date) query = query.where('l.date', req.query.date);
    if (req.query.case_id) query = query.where('l.case_id', req.query.case_id);
    if (req.query.site_id) query = query.where('l.site_id', req.query.site_id);
    const data = await query.orderBy('l.date', 'desc').limit(100);
    res.json({ data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/logs/today — 今日日誌狀態
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const log = await db('construction_logs').where({ user_id: req.user.id, date: today }).first();
    res.json({ submitted: !!log?.submitted_at, log });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/logs/:id — 單筆日誌
router.get('/:id', authenticate, async (req, res) => {
  try {
    const log = await db('construction_logs AS l')
      .join('users AS u', 'u.id', 'l.user_id')
      .leftJoin('sites AS s', 's.id', 'l.site_id')
      .select('l.*', 'u.name AS user_name', 's.name AS site_name')
      .where('l.id', req.params.id).first();
    if (!log) return res.status(404).json({ error: '日誌不存在' });
    res.json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/logs — 提交日誌
router.post('/', authenticate, auditLog('提交工程日誌'), async (req, res) => {
  try {
    const { case_id, site_id, weather, workers, items, progress, issues, photos, next_day_plan } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: '請填寫施工項目' });
    const today = new Date().toISOString().slice(0, 10);

    // 檢查今天是否已提交
    const exists = await db('construction_logs').where({ user_id: req.user.id, site_id: site_id || null, date: today }).first();
    if (exists?.submitted_at) return res.status(409).json({ error: '今日已提交日誌' });

    const data = {
      case_id, site_id, user_id: req.user.id, date: today, weather,
      workers: JSON.stringify(workers || []),
      items: JSON.stringify(items || []),
      progress: progress || 0,
      issues: JSON.stringify(issues || []),
      photos: JSON.stringify(photos || []),
      next_day_plan, submitted_at: new Date(),
    };

    let result;
    if (exists) {
      await db('construction_logs').where('id', exists.id).update(data);
      result = { id: exists.id, ...data };
    } else {
      [result] = await db('construction_logs').insert(data).returning('*');
    }

    // 更新案件進度
    if (case_id && progress) {
      await db('cases').where('id', case_id).update({ progress, updated_at: new Date() });
    }

    res.status(201).json({ ...result, message: '日誌已提交' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
