const { startServer, stopServer, request, login } = require('./setup');

beforeAll(async () => { await startServer(); });
afterAll(async () => { await stopServer(); });

describe('Complete Workflow: 填單 → 案件 → 收款', () => {

  let bossToken, leadId, caseId;

  test('Step 1: 建立填單', async () => {
    bossToken = await login('boss');
    const res = await request('POST', '/api/leads', {
      name: '工作流測試客戶',
      phone: '0988-777-666',
      district: '中正區',
      house_type: '全新屋裝潢',
      budget: '150~300萬',
      source: '單元測試',
    }, bossToken);
    expect(res.status).toBe(201);
    expect(res.data.lead_no).toBeDefined();
    leadId = res.data.id;
  });

  test('Step 2: 指派設計師', async () => {
    const users = await request('GET', '/api/users', null, bossToken);
    const designer = users.data.find(u => u.role === 'staff');
    expect(designer).toBeDefined();

    const res = await request('POST', `/api/leads/${leadId}/assign`, {
      designer_id: designer.id,
    }, bossToken);
    expect(res.status).toBe(200);
  });

  test('Step 3: 填單轉案件', async () => {
    const res = await request('POST', `/api/leads/${leadId}/convert`, {
      name: '中正區 測試宅',
    }, bossToken);
    expect(res.status).toBe(201);
    expect(res.data.case.case_no).toBeDefined();
    caseId = res.data.case.id;
  });

  test('Step 4: 推進階段到簽約', async () => {
    for (const stage of ['丈量完成', '提案報價', '成功簽約']) {
      const res = await request('PUT', `/api/cases/${caseId}/stage`, { stage }, bossToken);
      expect(res.status).toBe(200);
    }
  });

  test('Step 5: 建立付款節點', async () => {
    const res = await request('POST', `/api/cases/${caseId}/payments`, {
      nodes: [
        { period: 1, name: '簽約款 30%', percentage: 30, amount: 300000 },
        { period: 2, name: '完工款 70%', percentage: 70, amount: 700000 },
      ],
    }, bossToken);
    expect(res.status).toBe(201);
  });

  test('Step 6: 確認收款', async () => {
    const recv = await request('GET', '/api/finance/receivables?status=pending', null, bossToken);
    const node = recv.data.data?.find(n => n.case_id === caseId);
    if (!node) return;

    const res = await request('PUT', `/api/finance/receivables/${node.id}/confirm`, {}, bossToken);
    expect(res.status).toBe(200);
  });

  test('Step 7: 驗證案件已更新', async () => {
    const res = await request('GET', `/api/cases/${caseId}`, null, bossToken);
    expect(res.status).toBe(200);
    expect(res.data.stage).toBe('成功簽約');
    expect(res.data.sign_date).toBeDefined();
  });
});

describe('GP System', () => {
  test('GET /api/gp/my — 取得自己的 GP', async () => {
    const token = await login('staff');
    const res = await request('GET', '/api/gp/my', null, token);
    expect(res.status).toBe(200);
    expect(res.data.total).toBeDefined();
  });

  test('POST /api/gp/complete-task — 完成任務加 GP', async () => {
    const token = await login('staff');
    const res = await request('POST', '/api/gp/complete-task', {
      task_id: 'test_task_001',
      points: 10,
    }, token);
    expect(res.status).toBe(200);
    expect(res.data.message).toContain('GP');
  });
});

describe('Checkin', () => {
  test('GET /api/checkin/sites — 工地列表', async () => {
    const token = await login('worker');
    const res = await request('GET', '/api/checkin/sites', null, token);
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('GET /api/checkin/today — 今日打卡', async () => {
    const token = await login('worker');
    const res = await request('GET', '/api/checkin/today', null, token);
    expect(res.status).toBe(200);
    expect(res.data.checkedIn).toBeDefined();
  });
});
