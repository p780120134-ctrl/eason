const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateTokens, authenticate } = require('../middleware/auth');

// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '請輸入帳號密碼' });
    }

    // 查詢使用者 + 角色
    const user = await db('users AS u')
      .join('roles AS r', 'r.id', 'u.role_id')
      .where({ 'u.username': username, 'u.is_active': true })
      .select('u.*', 'r.code AS role_code', 'r.name AS role_name', 'r.default_nav', 'r.gp_role_key', 'r.is_internal')
      .first();

    if (!user) {
      await logLogin(null, req, 'login', false, '帳號不存在');
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    // 驗證密碼
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await logLogin(user.id, req, 'login', false, '密碼錯誤');
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    // 產生 Token
    const tokens = generateTokens(user);

    // 更新最後登入
    await db('users').where({ id: user.id }).update({
      last_login: new Date(),
      login_count: db.raw('login_count + 1'),
    });

    // 記錄登入
    await logLogin(user.id, req, 'login', true);

    // 查詢權限
    const permissions = await getUserPermissions(user.id, user.role_code);

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role_code,
        roleName: user.role_name,
        title: user.title,
        org: user.org,
        store_id: user.store_id,
        zone: user.zone,
        avatar: user.avatar,
        defaultNav: user.default_nav,
        gpRoleKey: user.gp_role_key,
        isInternal: user.is_internal,
        onboardingCompleted: user.onboarding_completed,
        permissions,
      },
    });
  } catch (e) {
    console.error('[Auth] Login error:', e);
    res.status(500).json({ error: '登入失敗' });
  }
});

// ── POST /api/auth/refresh ──
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: '缺少 refresh token' });

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'dev-secret');
    if (decoded.type !== 'refresh') return res.status(401).json({ error: '無效的 refresh token' });

    // 查使用者
    const user = await db('users AS u')
      .join('roles AS r', 'r.id', 'u.role_id')
      .where({ 'u.id': decoded.id, 'u.is_active': true })
      .select('u.*', 'r.code AS role_code')
      .first();

    if (!user) return res.status(401).json({ error: '使用者不存在' });

    const tokens = generateTokens(user);
    await logLogin(user.id, req, 'refresh', true);
    res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (e) {
    res.status(401).json({ error: 'Refresh token 無效或已過期' });
  }
});

// ── GET /api/auth/me ──
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await db('users AS u')
      .join('roles AS r', 'r.id', 'u.role_id')
      .where({ 'u.id': req.user.id })
      .select('u.id', 'u.username', 'u.name', 'u.title', 'u.org', 'u.store_id', 'u.zone',
              'u.avatar', 'u.phone', 'u.email', 'u.hire_date', 'u.base_salary',
              'u.annual_leave', 'u.used_leave', 'u.onboarding_completed',
              'r.code AS role_code', 'r.name AS role_name', 'r.default_nav', 'r.gp_role_key')
      .first();

    if (!user) return res.status(404).json({ error: '使用者不存在' });

    const permissions = await getUserPermissions(user.id, user.role_code);
    res.json({ ...user, permissions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/auth/logout ──
router.post('/logout', authenticate, async (req, res) => {
  try {
    // 把 token 加入黑名單
    if (req.user.jti) {
      const decoded = require('jsonwebtoken').decode(req.token);
      await db('token_blacklist').insert({
        token_jti: req.user.jti,
        user_id: req.user.id,
        expires_at: new Date(decoded.exp * 1000),
      });
    }
    await logLogin(req.user.id, req, 'logout', true);
    res.json({ message: '已登出' });
  } catch (e) {
    res.json({ message: '已登出' }); // 即使失敗也回傳成功
  }
});

// ── POST /api/auth/change-password ──
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: '請填寫密碼' });
    if (newPassword.length < 6) return res.status(400).json({ error: '新密碼至少 6 字元' });

    const user = await db('users').where({ id: req.user.id }).first();
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: '目前密碼錯誤' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db('users').where({ id: req.user.id }).update({ password_hash: hash, updated_at: new Date() });
    res.json({ message: '密碼已更新' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 取得使用者完整權限（角色預設 + 個人覆寫）──
async function getUserPermissions(userId, roleCode) {
  // 角色預設權限
  const rolePerms = await db('role_permissions AS rp')
    .join('permissions AS p', 'p.id', 'rp.permission_id')
    .join('roles AS r', 'r.id', 'rp.role_id')
    .where({ 'r.code': roleCode })
    .select('p.code', 'p.name', 'p.icon', 'rp.can_create', 'rp.can_read', 'rp.can_update', 'rp.can_delete', 'rp.scope');

  // 個人覆寫
  const overrides = await db('user_permission_overrides AS upo')
    .join('permissions AS p', 'p.id', 'upo.permission_id')
    .where({ 'upo.user_id': userId })
    .where(function() {
      this.whereNull('upo.expires_at').orWhere('upo.expires_at', '>', new Date());
    })
    .select('p.code', 'upo.granted', 'upo.can_create', 'upo.can_read', 'upo.can_update', 'upo.can_delete', 'upo.scope');

  // 合併
  const permMap = {};
  rolePerms.forEach(p => { permMap[p.code] = p; });
  overrides.forEach(o => {
    if (o.granted) {
      permMap[o.code] = { ...permMap[o.code], ...o };
    } else {
      delete permMap[o.code];
    }
  });

  return Object.values(permMap);
}

// ── 登入記錄 ──
async function logLogin(userId, req, action, success, reason) {
  try {
    await db('login_logs').insert({
      user_id: userId,
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
      action,
      success,
      fail_reason: reason || null,
    });
  } catch (e) {
    console.error('[Auth] Log error:', e.message);
  }
}

module.exports = router;
