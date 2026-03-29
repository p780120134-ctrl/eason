// 簡潔的表單驗證中間件
function validate(rules) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, checks] of Object.entries(rules)) {
      const value = req.body[field];
      for (const check of checks) {
        if (check === 'required' && (value === undefined || value === null || value === '')) {
          errors.push(`${field} 為必填`);
        }
        if (check === 'string' && value !== undefined && typeof value !== 'string') {
          errors.push(`${field} 必須為文字`);
        }
        if (check === 'number' && value !== undefined && isNaN(Number(value))) {
          errors.push(`${field} 必須為數字`);
        }
        if (check === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
          errors.push(`${field} 格式不正確`);
        }
        if (check === 'phone' && value && !/^[\d\-+() ]{8,20}$/.test(value)) {
          errors.push(`${field} 格式不正確`);
        }
        if (typeof check === 'object' && check.min !== undefined && value !== undefined && String(value).length < check.min) {
          errors.push(`${field} 至少 ${check.min} 個字元`);
        }
        if (typeof check === 'object' && check.max !== undefined && value !== undefined && String(value).length > check.max) {
          errors.push(`${field} 最多 ${check.max} 個字元`);
        }
      }
    }
    if (errors.length) {
      return res.status(400).json({ error: errors[0], errors });
    }
    next();
  };
}

module.exports = { validate };
