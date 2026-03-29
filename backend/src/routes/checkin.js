const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission, applyScopeFilter } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

// GET /api/checkin — 打卡紀錄列表
router.get('/', authenticate, requirePermission('checkin', 'read'), async (req, res) => {
  try {
    let query = db('checkins AS c')
      .join('users AS u', 'u.id', 'c.user_id')
      .leftJoin('sites AS s', 's.id', 'c.site_id')
      .select('c.*', 'u.name AS user_name', 'u.title', 's.name AS site_name', 's.site_no');
    applyScopeFilter(query, req, 'c.user_id', 'u.store_id');
    if (req.query.date) query = query.where('c.date', req.query.date);
    if (req.query.user_id) query = query.where('c.user_id', req.query.user_id);
    if (req.query.site_id) query = query.where('c.site_id', req.query.site_id);
    const data = await query.orderBy('c.date', 'desc').orderBy('c.time', 'desc').limit(200);
    res.json({ data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/checkin/stats — 打卡統計
router.get('/stats', authenticate, requirePermission('checkin', 'read'), async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = await db('checkins').where('date', today).countDistinct('user_id as n').first();
    const monthCount = await db('checkins').where('date', '>=', today.slice(0, 7) + '-01').count('id as n').first();
    const totalWorkers = await db('users AS u').join('roles AS r', 'r.id', 'u.role_id').where('r.code', 'worker').where('u.is_active', true).count('u.id as n').first();
    res.json({ todayCheckedIn: parseInt(todayCount.n), monthTotal: parseInt(monthCount.n), totalWorkers: parseInt(totalWorkers.n) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/checkin/today — 今日打卡狀態（當前用戶）
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const records = await db('checkins AS c').leftJoin('sites AS s', 's.id', 'c.site_id')
      .where('c.user_id', req.user.id).where('c.date', today)
      .select('c.*', 's.name AS site_name');
    res.json({ checkedIn: records.length > 0, records });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/checkin — 打卡
router.post('/', authenticate, auditLog('工地打卡'), async (req, res) => {
  try {
    const { site_id, type, latitude, longitude } = req.body;
    if (!site_id) return res.status(400).json({ error: '請選擇工地' });
    const site = await db('sites').where('id', site_id).first();
    if (!site) return res.status(404).json({ error: '工地不存在' });

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);

    // GPS 驗證
    let gps_verified = false;
    let distance = null;
    if (latitude && longitude && site.latitude && site.longitude) {
      const R = 6371000;
      const dLat = (site.latitude - latitude) * Math.PI / 180;
      const dLng = (site.longitude - longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(latitude*Math.PI/180) * Math.cos(site.latitude*Math.PI/180) * Math.sin(dLng/2)**2;
      distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
      gps_verified = distance <= (site.radius || 100);
    }

    // 檢查今天是否已在此工地打卡
    const exists = await db('checkins').where({ user_id: req.user.id, site_id, date: today }).first();
    if (exists) return res.status(409).json({ error: '今日已在此工地打卡', record: exists });

    const [record] = await db('checkins').insert({
      user_id: req.user.id, site_id, date: today, time,
      type: type || 'nfc', gps_verified, latitude, longitude, distance,
    }).returning('*');

    res.status(201).json({ ...record, site_name: site.name, message: '打卡成功' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/checkin/sites — 可打卡工地列表
router.get('/sites', authenticate, async (req, res) => {
  try {
    const sites = await db('sites AS s')
      .join('cases AS c', 'c.id', 's.case_id')
      .where('s.is_active', true).where('c.status', 'active')
      .select('s.*', 'c.case_no', 'c.name AS case_name');
    res.json(sites);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
