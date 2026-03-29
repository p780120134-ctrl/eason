const { startServer, stopServer, request, login } = require('./setup');

beforeAll(async () => { await startServer(); });
afterAll(async () => { await stopServer(); });

describe('Finance API', () => {

  test('GET /api/finance/dashboard — 財務儀表板', async () => {
    const token = await login('boss');
    const res = await request('GET', '/api/finance/dashboard', null, token);
    expect(res.status).toBe(200);
    expect(res.data.totalContract).toBeDefined();
    expect(res.data.totalCollected).toBeDefined();
    expect(res.data.totalPending).toBeDefined();
    expect(res.data.grossMargin).toBeDefined();
  });

  test('GET /api/finance/receivables — 應收列表', async () => {
    const token = await login('boss');
    const res = await request('GET', '/api/finance/receivables', null, token);
    expect(res.status).toBe(200);
    expect(res.data.data).toBeDefined();
    expect(res.data.stats).toBeDefined();
  });

  test('GET /api/finance/payables — 工班請款', async () => {
    const token = await login('boss');
    const res = await request('GET', '/api/finance/payables', null, token);
    expect(res.status).toBe(200);
    expect(res.data.stats.pendingReview).toBeDefined();
  });

  test('GET /api/finance/pnl — 案件損益', async () => {
    const token = await login('boss');
    const res = await request('GET', '/api/finance/pnl', null, token);
    expect(res.status).toBe(200);
    expect(res.data.stats.totalContract).toBeGreaterThan(0);
  });

  test('GET /api/finance/cashflow — 現金流', async () => {
    const token = await login('boss');
    const res = await request('GET', '/api/finance/cashflow', null, token);
    expect(res.status).toBe(200);
    expect(res.data.currentBalance).toBeDefined();
    expect(res.data.safeDays).toBeDefined();
  });

  test('POST /api/finance/invoices — 開立發票', async () => {
    const token = await login('boss');
    const res = await request('POST', '/api/finance/invoices', {
      type: 'sales',
      buyer_seller: '測試客戶',
      items: [{ name: '測試項目', qty: 1, price: 10000 }],
    }, token);
    expect(res.status).toBe(201);
    expect(res.data.invoice_no).toBeDefined();
    expect(res.data.tax).toBe(500);
    expect(res.data.total).toBe(10500);
  });
});
