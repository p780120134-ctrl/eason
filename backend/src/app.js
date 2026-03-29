require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();

// ── 中間件 ──
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting（登入 API 限制更嚴格）
const rateLimit = require('express-rate-limit');
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: '登入嘗試過多，請 15 分鐘後再試' } }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 200 }));

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
});

// 上傳檔案靜態服務
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ── API 路由 ──
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/cases',       require('./routes/cases'));
app.use('/api/leads',       require('./routes/leads'));
app.use('/api/finance',     require('./routes/finance'));
app.use('/api/gp',          require('./routes/gp'));
app.use('/api/checkin',     require('./routes/checkin'));
app.use('/api/logs',        require('./routes/logs'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/chat',        require('./routes/chat'));
app.use('/api/meetings',    require('./routes/meetings'));
app.use('/api/esign',       require('./routes/esign'));
app.use('/api/upload',      require('./routes/upload'));
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/line',        require('./routes/line'));
app.use('/api/erp',         require('./routes/erp'));
app.use('/api/invoices',    require('./routes/invoices'));
app.use('/api/onboarding',  require('./routes/onboarding'));
app.use('/api/ai',          require('./routes/ai'));
app.use('/api/complaints',  require('./routes/complaints'));

// ── 靜態檔案（前端 build 產物）──
// 生產模式：public/ 目錄（Docker 內）；開發模式：frontend/dist
const staticDir = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../public')
  : path.join(__dirname, '../../frontend/dist');
app.use(express.static(staticDir));
app.get('*', (req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: '前端尚未 build' });
  }
});

// ── 錯誤處理 ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? '伺服器錯誤' : err.message
  });
});

// 僅在直接執行時啟動 server（require 時不啟動）
if (require.main === module) {
  const http = require('http');
  const { initSocket } = require('./socket');
  const PORT = process.env.PORT || 3000;
  const server = http.createServer(app);
  const io = initSocket(server);
  app.set('io', io); // 讓路由可以用 req.app.get('io')
  server.listen(PORT, () => {
    console.log(`[統包先生] 後端啟動 http://localhost:${PORT}`);
    console.log(`[統包先生] WebSocket 就緒`);
  });
}

module.exports = app;
