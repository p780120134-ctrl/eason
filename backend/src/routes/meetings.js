const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.get('/', authenticate, async (req, res) => {
  try {
    let query = db('meetings AS m').leftJoin('cases AS c','c.id','m.case_id').leftJoin('users AS u','u.id','m.designer_id')
      .select('m.*','c.case_no','u.name AS designer_name');
    if(req.user.role==='client') query=query.where('m.shared_to_client',true);
    else if(req.user.role==='staff') query=query.where('m.designer_id',req.user.id);
    const data = await query.orderBy('m.date','desc').limit(50);
    res.json({data});
  } catch(e){res.status(500).json({error:e.message})}
});

router.post('/', authenticate, auditLog('建立會議記錄'), async (req, res) => {
  try {
    const {case_id,customer_id,meeting_type,duration_min,transcript,analysis,audio_url} = req.body;
    const [rec] = await db('meetings').insert({
      case_id,customer_id,designer_id:req.user.id,meeting_type,date:new Date(),duration_min,
      transcript,analysis:JSON.stringify(analysis||null),audio_url,
    }).returning('*');
    res.status(201).json(rec);
  } catch(e){res.status(500).json({error:e.message})}
});

router.put('/:id/share', authenticate, auditLog('分享會議記錄'), async (req, res) => {
  try {
    await db('meetings').where('id',req.params.id).update({shared_to_client:true,shared_at:new Date()});
    res.json({message:'已分享給客戶'});
  } catch(e){res.status(500).json({error:e.message})}
});

router.put('/:id/confirm', authenticate, auditLog('客戶確認會議'), async (req, res) => {
  try {
    const {comment} = req.body;
    await db('meetings').where('id',req.params.id).update({client_confirmed:true,client_confirmed_at:new Date(),client_comment:comment||''});
    res.json({message:'已確認'});
  } catch(e){res.status(500).json({error:e.message})}
});

module.exports = router;