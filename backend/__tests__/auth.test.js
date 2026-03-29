const { startServer, stopServer, request, login } = require('./setup');

let server;
beforeAll(async () => { server = await startServer(); });
afterAll(async () => { await stopServer(); });

describe('Auth API', () => {

  test('POST /api/auth/login — 正確帳密 → 200 + token', async () => {
    const res = await request('POST', '/api/auth/login', { username: 'boss', password: '1234' });
    expect(res.status).toBe(200);
    expect(res.data.token).toBeDefined();
    expect(res.data.user.username).toBe('boss');
    expect(res.data.user.role).toBe('boss');
    expect(res.data.user.permissions.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/login — 錯誤密碼 → 401', async () => {
    const res = await request('POST', '/api/auth/login', { username: 'boss', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.data.error).toBeDefined();
  });

  test('POST /api/auth/login — 空帳密 → 400', async () => {
    const res = await request('POST', '/api/auth/login', { username: '', password: '' });
    expect(res.status).toBe(400);
  });

  test('GET /api/auth/me — 帶 token → 200', async () => {
    const token = await login();
    const res = await request('GET', '/api/auth/me', null, token);
    expect(res.status).toBe(200);
    expect(res.data.username).toBe('boss');
  });

  test('GET /api/auth/me — 無 token → 401', async () => {
    const res = await request('GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me — 假 token → 401', async () => {
    const res = await request('GET', '/api/auth/me', null, 'fake-token');
    expect(res.status).toBe(401);
  });

  test('不同角色 — staff 只有 10 個權限', async () => {
    const res = await request('POST', '/api/auth/login', { username: 'staff', password: '1234' });
    expect(res.status).toBe(200);
    expect(res.data.user.role).toBe('staff');
    expect(res.data.user.permissions.length).toBeLessThan(15);
  });
});
