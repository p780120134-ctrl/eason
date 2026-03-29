const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.get('/', authenticate, requirePermission('finance','read'), async (req, res) => {
  try {
    let query = db('invoices AS i').leftJoin('cases AS c','c.id','i.case_id').select('i.*','c.case_no','c.name AS case_name');
    if(req.query.type) query=query.where('i.type',req.query.type);
    if(req.query.period) query=query.where('i.period',req.query.period);
    const data = await query.orderBy('i.created_at','desc');
    res.json({data});
  } catch(e){res.status(500).json({error:e.message})}
});

router.post('/', authenticate, requirePermission('finance','create'), auditLog('開立發票'), async (req, res) => {
  try {
    const {type,case_id,buyer_seller,tax_id,items,carrier} = req.body;
    const amount = (items||[]).reduce((s,it)=>s+(it.price*(it.qty||1)),0);
    const tax = Math.round(amount*0.05);
    const prefix = type==='sales'?'AB':'CD';
    const invoice_no = prefix+'-'+String(Math.floor(Math.random()*90000000+10000000));
    const now = new Date(); const m=now.getMonth()+1; const y=now.getFullYear()-1911;
    const ps = m%2===0?m-1:m;
    const period = y+'年'+String(ps).padStart(2,'0')+'-'+String(ps+1).padStart(2,'0')+'月';
    const [inv] = await db('invoices').insert({
      invoice_no,type,case_id,buyer_seller,tax_id,items:JSON.stringify(items||[]),
      amount,tax,total:amount+tax,carrier,period,
    }).returning('*');
    res.status(201).json(inv);
  } catch(e){res.status(500).json({error:e.message})}
});

router.put('/:id/void', authenticate, requirePermission('finance','update'), auditLog('作廢發票'), async (req, res) => {
  try {
    await db('invoices').where('id',req.params.id).update({voided:true,voided_at:new Date(),status:'已作廢'});
    res.json({message:'已作廢'});
  } catch(e){res.status(500).json({error:e.message})}
});

module.exports = router;