const db = require('../db');

// 操作紀錄中間件
// 自動記錄 POST/PUT/DELETE 操作到 audit_logs 表
function auditLog(action) {
  return async (req, res, next) => {
    const originalSend = res.json.bind(res);
    res.json = function(body) {
      // 只記錄成功的寫入操作
      if (res.statusCode < 400 && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        db('notifications').insert({
          user_id: req.user?.id,
          type: 'audit',
          title: action || `${req.method} ${req.baseUrl}`,
          body: JSON.stringify({
            method: req.method,
            path: req.originalUrl,
            params: req.params,
            body: sanitize(req.body),
            result: typeof body === 'object' ? { id: body.id, message: body.message } : null,
          }),
          data: JSON.stringify({ ip: req.ip, ua: req.headers['user-agent']?.substring(0, 100) }),
          channel: 'system',
        }).catch(e => console.error('[Audit] Error:', e.message));
      }
      return originalSend(body);
    };
    next();
  };
}

// 移除敏感欄位
function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = { ...obj };
  delete copy.password;
  delete copy.password_hash;
  delete copy.token;
  delete copy.refreshToken;
  return copy;
}

module.exports = { auditLog };
