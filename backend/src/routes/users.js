const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');

// GET /api/users — 列表
router.get('/', authenticate, requirePermission('user_manage', 'read'), async (req, res) => {
  const users = await db('users AS u')
    .join('roles AS r', 'r.id', 'u.role_id')
    .select('u.id','u.username','u.name','u.title','u.org','u.avatar','u.is_active','u.last_login',
            'r.code AS role','r.name AS role_name')
    .orderBy('r.level').orderBy('u.name');
  res.json(users);
});

// POST /api/users — 新增
router.post('/', authenticate, requirePermission('user_manage', 'create'), async (req, res) => {
  const { username, password, role_code, name, title, org, store_id, phone, email, hire_date, base_salary } = req.body;
  if (!username||!password||!role_code||!name) return res.status(400).json({ error: '必填欄位不完整' });
  const exists = await db('users').where({ username }).first();
  if (exists) return res.status(409).json({ error: '帳號已存在' });
  const role = await db('roles').where({ code: role_code }).first();
  if (!role) return res.status(400).json({ error: '角色不存在' });
  const hash = await bcrypt.hash(password, 10);
  const [user] = await db('users').insert({
    username, password_hash:hash, role_id:role.id, name, title, org, store_id, phone, email, hire_date, base_salary, avatar:name[0]
  }).returning('id');
  res.status(201).json({ id: user.id||user, username, name, role: role_code });
});

// PUT /api/users/:id — 更新
router.put('/:id', authenticate, requirePermission('user_manage', 'update'), async (req, res) => {
  const { name, title, org, store_id, phone, email, base_salary, is_active, role_code } = req.body;
  const update = { name, title, org, store_id, phone, email, base_salary, is_active, updated_at: new Date() };
  if (role_code) { const r = await db('roles').where({ code:role_code }).first(); if(r) update.role_id=r.id; }
  await db('users').where({ id: req.params.id }).update(update);
  res.json({ message: '已更新' });
});

// PUT /api/users/:id/permissions — 個人權限覆寫
router.put('/:id/permissions', authenticate, authorize('boss'), async (req, res) => {
  const userId = parseInt(req.params.id);
  await db('user_permission_overrides').where({ user_id: userId }).del();
  for (const perm of (req.body.permissions||[])) {
    const p = await db('permissions').where({ code: perm.code }).first();
    if (!p) continue;
    await db('user_permission_overrides').insert({
      user_id:userId, permission_id:p.id, granted:perm.granted,
      can_create:perm.can_create, can_read:perm.can_read, can_update:perm.can_update, can_delete:perm.can_delete,
      scope:perm.scope, granted_by:req.user.id, reason:perm.reason||'管理員設定'
    });
  }
  res.json({ message: '權限已更新' });
});

// DELETE /api/users/:id — 停用
router.delete('/:id', authenticate, authorize('boss'), async (req, res) => {
  await db('users').where({ id: req.params.id }).update({ is_active: false });
  res.json({ message: '帳號已停用' });
});

// GET /api/users/roles — 角色列表
router.get('/meta/roles', authenticate, async (req, res) => {
  res.json(await db('roles').orderBy('level'));
});

// GET /api/users/permissions — 權限列表
router.get('/meta/permissions', authenticate, async (req, res) => {
  res.json(await db('permissions').orderBy('sort_order'));
});

// GET /api/users/login-logs — 登入紀錄
router.get('/meta/login-logs', authenticate, authorize('boss','admin'), async (req, res) => {
  const logs = await db('login_logs AS l')
    .leftJoin('users AS u','u.id','l.user_id')
    .select('l.*','u.name','u.username')
    .orderBy('l.created_at','desc').limit(200);
  res.json(logs);
});

module.exports = router;
