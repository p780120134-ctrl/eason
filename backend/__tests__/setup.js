/**
 * 測試環境設定
 * 用真實 DB（測試用的 Docker PostgreSQL）
 */
require('dotenv').config({ path: '../.env' });

const http = require('http');
const app = require('../src/app');

let server;
let baseURL;

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseURL = `http://localhost:${port}`;
      resolve({ server, baseURL, port });
    });
  });
}

async function stopServer() {
  if (server) await new Promise(r => server.close(r));
}

// HTTP 工具
async function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseURL);
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(url, { method, headers }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function login(username = 'boss', password = '1234') {
  const res = await request('POST', '/api/auth/login', { username, password });
  return res.data.token;
}

module.exports = { startServer, stopServer, request, login };
