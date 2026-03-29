const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get('/status', authenticate, requirePermission('erp','read'), async (req, res) => {
  try {
    const cases = await db('cases').count('id as n').first();
    const invoices = await db('invoices').count('id as n').first();
    const claims = await db('vendor_claims').count('id as n').first();
    res.json({
      provider:process.env.ERP_PROVIDER||'tiptop',
      status:'ready',
      modules:[
        {name:'應收帳款',records:parseInt(cases.n),status:'ready'},
        {name:'應付帳款',records:parseInt(claims.n),status:'ready'},
        {name:'發票',records:parseInt(invoices.n),status:'ready'},
      ],
      lastSync:null,
    });
  } catch(e){res.status(500).json({error:e.message})}
});

// ERP API 呼叫（鼎新 / SAP / 自訂）
async function callERP(endpoint, data) {
  const apiUrl = process.env.ERP_API_URL;
  const apiKey = process.env.ERP_API_KEY;
  if (!apiUrl || apiUrl.includes('tongbao.com')) return { ok: false, reason: 'ERP API 未設定' };
  try {
    const axios = require('axios');
    const res = await axios.post(`${apiUrl}/${endpoint}`, data, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    return { ok: true, data: res.data };
  } catch (e) {
    return { ok: false, reason: e.response?.data?.message || e.message };
  }
}

// POST /api/erp/sync — 同步
router.post('/sync', authenticate, requirePermission('erp', 'update'), async (req, res) => {
  try {
    const { modules } = req.body; // ['receivables','payables','invoices']
    const results = [];

    // 同步應收
    if (!modules || modules.includes('receivables')) {
      const cases = await db('cases').where('contract_amount', '>', 0).select('case_no', 'name', 'contract_amount', 'collected', 'pending', 'status');
      const erpRes = await callERP('accounts-receivable/batch', { records: cases });
      results.push({ module: '應收帳款', records: cases.length, ...erpRes });
    }

    // 同步應付
    if (!modules || modules.includes('payables')) {
      const claims = await db('vendor_claims AS vc')
        .join('vendors AS v', 'v.id', 'vc.vendor_id')
        .select('vc.claim_no', 'v.name AS vendor', 'vc.amount', 'vc.status');
      const erpRes = await callERP('accounts-payable/batch', { records: claims });
      results.push({ module: '應付帳款', records: claims.length, ...erpRes });
    }

    // 同步發票
    if (!modules || modules.includes('invoices')) {
      const invoices = await db('invoices').where('voided', false).select('invoice_no', 'type', 'amount', 'tax', 'total', 'period');
      const erpRes = await callERP('invoices/batch', { records: invoices });
      results.push({ module: '發票', records: invoices.length, ...erpRes });
    }

    // 記錄同步
    await db('notifications').insert({
      type: 'erp_sync',
      title: 'ERP 同步',
      body: JSON.stringify(results),
      channel: 'system',
    });

    res.json({ message: '同步完成', results, synced_at: new Date() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/erp/sync-logs — 同步紀錄
router.get('/sync-logs', authenticate, requirePermission('erp', 'read'), async (req, res) => {
  try {
    const logs = await db('notifications').where('type', 'erp_sync').orderBy('created_at', 'desc').limit(20);
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;