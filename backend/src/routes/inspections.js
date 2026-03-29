const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission, applyScopeFilter } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.get('/', authenticate, requirePermission('inspection', 'read'), async (req, res) => {
  try {
    let query = db('inspections AS i').join('users AS u','u.id','i.designer_id').leftJoin('sites AS s','s.id','i.site_id').leftJoin('cases AS c','c.id','i.case_id')
      .select('i.*','u.name AS designer_name','s.name AS site_name','c.case_no');
    applyScopeFilter(query, req, 'i.designer_id', 'c.store_id');
    if(req.query.week) query=query.where('i.week',req.query.week);
    const data = await query.orderBy('i.date','desc').limit(100);
    res.json({data});
  } catch(e){res.status(500).json({error:e.message})}
});

router.get('/status', authenticate, async (req, res) => {
  try {
    const weekNum = Math.ceil(new Date().getDate()/7);
    const week = 'W'+(weekNum+9);
    const done = await db('inspections').where({designer_id:req.user.id,week}).first();
    res.json({week,completed:!!done,inspection:done});
  } catch(e){res.status(500).json({error:e.message})}
});

router.post('/', authenticate, auditLog('提交巡查'), async (req, res) => {
  try {
    const {case_id,site_id,photos,quality_checks,client_note,issues} = req.body;
    const weekNum = Math.ceil(new Date().getDate()/7);
    const week = 'W'+(weekNum+9);
    const today = new Date().toISOString().slice(0,10);
    const time = new Date().toTimeString().slice(0,8);
    const [rec] = await db('inspections').insert({
      case_id,site_id,designer_id:req.user.id,date:today,week,checkin_time:time,checkin_type:'nfc',
      photos:JSON.stringify(photos||[]),quality_checks:JSON.stringify(quality_checks||{}),
      client_note,issues:JSON.stringify(issues||[]),
    }).returning('*');
    res.status(201).json({...rec,message:'巡查已提交'});
  } catch(e){res.status(500).json({error:e.message})}
});

module.exports = router;