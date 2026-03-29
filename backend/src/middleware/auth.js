const jwt = require('jsonwebtoken');
const crypto = require('crypto');
function uuidv4() { return crypto.randomUUID(); }

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// ── 產生 Token ──
function generateTokens(user) {
  const jti = uuidv4();
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role_code, store_id: user.store_id, jti },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refreshToken = jwt.sign(
    { id: user.id, jti: uuidv4(), type: 'refresh' },
    JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  return { accessToken, refreshToken, jti };
}

// ── 驗證 Token ──
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登入' });
  }
  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.token = token;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token 已過期', code: 'TOKEN_EXPIRED' });
    }
    res.status(401).json({ error: 'Token 無效' });
  }
}

// ── 角色授權（檢查是否為指定角色）──
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '未登入' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '權限不足', required: roles, current: req.user.role });
    }
    next();
  };
}

// ── 功能權限檢查（檢查是否有特定模組的 CRUD 權限）──
// 用法: requirePermission('finance', 'read')
function requirePermission(permCode, action) {
  action = action || 'read';
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '未登入' });
    // boss 擁有所有權限
    if (req.user.role === 'boss') return next();

    try {
      const db = require('../db');
      // 1. 先查使用者覆寫
      const override = await db('user_permission_overrides AS upo')
        .join('permissions AS p', 'p.id', 'upo.permission_id')
        .where({ 'upo.user_id': req.user.id, 'p.code': permCode })
        .where(function() {
          this.whereNull('upo.expires_at').orWhere('upo.expires_at', '>', new Date());
        })
        .first();

      if (override) {
        if (!override.granted) return res.status(403).json({ error: '權限已被撤銷' });
        const actionMap = { create: 'can_create', read: 'can_read', update: 'can_update', delete: 'can_delete' };
        if (override[actionMap[action]] === false) return res.status(403).json({ error: '無此操作權限' });
        req.permScope = override.scope;
        return next();
      }

      // 2. 查角色預設權限
      const rolePerm = await db('role_permissions AS rp')
        .join('permissions AS p', 'p.id', 'rp.permission_id')
        .join('roles AS r', 'r.id', 'rp.role_id')
        .where({ 'r.code': req.user.role, 'p.code': permCode })
        .first();

      if (!rolePerm) return res.status(403).json({ error: '無此功能權限' });

      const actionMap = { create: 'can_create', read: 'can_read', update: 'can_update', delete: 'can_delete' };
      if (!rolePerm[actionMap[action]]) return res.status(403).json({ error: '無此操作權限' });

      req.permScope = rolePerm.scope; // 'own' / 'store' / 'all'
      next();
    } catch (e) {
      res.status(500).json({ error: '權限檢查失敗' });
    }
  };
}

// ── 資料範圍過濾（根據 scope 自動加 WHERE）──
function applyScopeFilter(query, req, userIdCol, storeIdCol) {
  if (!req.permScope || req.permScope === 'all') return query;
  if (req.permScope === 'own') return query.where(userIdCol, req.user.id);
  if (req.permScope === 'store') return query.where(storeIdCol, req.user.store_id);
  return query;
}

module.exports = { generateTokens, authenticate, authorize, requirePermission, applyScopeFilter };
