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

router.post('/sync', authenticate, requirePermission('erp','update'), async (req, res) => {
  try {
    // TODO: 實際呼叫 ERP API
    res.json({message:'同步完成（模擬）',synced_at:new Date()});
  } catch(e){res.status(500).json({error:e.message})}
});

module.exports = router;