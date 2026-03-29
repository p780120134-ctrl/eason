const { startServer, stopServer, request, login } = require('./setup');

beforeAll(async () => { await startServer(); });
afterAll(async () => { await stopServer(); });

describe('Cases API', () => {

  test('GET /api/cases — boss 看到所有案件', async () => {
    const token = await login('boss');
    const res = await request('GET', '/api/cases', null, token);
    expect(res.status).toBe(200);
    expect(res.data.total).toBeGreaterThan(0);
    expect(res.data.data.length).toBeGreaterThan(0);
  });

  test('GET /api/cases/stats — 統計數據', async () => {
    const token = await login('boss');
    const res = await request('GET', '/api/cases/stats', null, token);
    expect(res.status).toBe(200);
    expect(res.data.active).toBeDefined();
    expect(res.data.contract).toBeGreaterThan(0);
  });

  test('GET /api/cases/:id — 案件詳情含付款+追加減', async () => {
    const token = await login('boss');
    const list = await request('GET', '/api/cases', null, token);
    const caseId = list.data.data[0]?.id;
    if (!caseId) return;

    const res = await request('GET', `/api/cases/${caseId}`, null, token);
    expect(res.status).toBe(200);
    expect(res.data.case_no).toBeDefined();
    expect(res.data.payments).toBeDefined();
    expect(res.data.addons).toBeDefined();
  });

  test('POST /api/cases — 建立新案件', async () => {
    const token = await login('boss');
    const res = await request('POST', '/api/cases', {
      customer_name: '測試客戶',
      customer_phone: '0999-000-000',
      name: '測試案件-單元測試',
      store_id: 1,
      budget: 500000,
    }, token);
    expect(res.status).toBe(201);
    expect(res.data.case_no).toBeDefined();
  });

  test('PUT /api/cases/:id/stage — 推進階段', async () => {
    const token = await login('boss');
    const list = await request('GET', '/api/cases', null, token);
    const c = list.data.data.find(x => x.stage === '名單建立');
    if (!c) return;

    const res = await request('PUT', `/api/cases/${c.id}/stage`, { stage: '丈量完成' }, token);
    expect(res.status).toBe(200);
    expect(res.data.progress).toBeGreaterThan(0);
  });
});
