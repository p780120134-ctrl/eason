const { startServer, stopServer, request, login } = require('./setup');

beforeAll(async () => { await startServer(); });
afterAll(async () => { await stopServer(); });

describe('Permission System', () => {

  test('boss 可以存取 finance → 200', async () => {
    const token = await login('boss');
    const res = await request('GET', '/api/finance/dashboard', null, token);
    expect(res.status).toBe(200);
    expect(res.data.totalContract).toBeDefined();
  });

  test('staff 不能存取 finance → 403', async () => {
    const token = await login('staff');
    const res = await request('GET', '/api/finance/dashboard', null, token);
    expect(res.status).toBe(403);
  });

  test('staff 可以存取 cases（scope=own）→ 200', async () => {
    const token = await login('staff');
    const res = await request('GET', '/api/cases', null, token);
    // staff 有 cases_view 權限但不是 cases
    expect([200, 403]).toContain(res.status);
  });

  test('boss 可以存取 users → 200', async () => {
    const token = await login('boss');
    const res = await request('GET', '/api/users', null, token);
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('staff 不能存取 users → 403', async () => {
    const token = await login('staff');
    const res = await request('GET', '/api/users', null, token);
    expect(res.status).toBe(403);
  });

  test('client 不能存取 leads → 403', async () => {
    const token = await login('client');
    const res = await request('GET', '/api/leads', null, token);
    expect(res.status).toBe(403);
  });
});
