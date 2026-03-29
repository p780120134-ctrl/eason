const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission, applyScopeFilter } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.get('/my', authenticate, async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0,7);
    let gp = await db('gp_monthly').where({user_id:req.user.id,month}).first();
    if(!gp) gp = {earned:0,penalties:0,total:0,level:1,streak:0,red_card:false,tasks_done:[]};
    res.json(gp);
  } catch(e){res.status(500).json({error:e.message})}
});

router.get('/team', authenticate, requirePermission('gp','read'), async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0,7);
    const team = await db('gp_monthly AS g').join('users AS u','u.id','g.user_id').join('roles AS r','r.id','u.role_id')
      .where('g.month',month).select('g.*','u.name','u.avatar','r.code AS role','r.name AS role_name')
      .orderBy('g.total','desc');
    res.json(team);
  } catch(e){res.status(500).json({error:e.message})}
});

router.post('/complete-task', authenticate, auditLog('完成GP任務'), async (req, res) => {
  try {
    const {task_id,points} = req.body;
    const month = new Date().toISOString().slice(0,7);
    let gp = await db('gp_monthly').where({user_id:req.user.id,month}).first();
    if(!gp){
      [gp] = await db('gp_monthly').insert({user_id:req.user.id,month,earned:0,penalties:0,total:0,level:1,streak:0,tasks_done:JSON.stringify([])}).returning('*');
    }
    const tasks = typeof gp.tasks_done==='string'?JSON.parse(gp.tasks_done):gp.tasks_done||[];
    if(tasks.includes(task_id)) return res.status(409).json({error:'任務已完成'});
    tasks.push(task_id);
    const earned = gp.earned + (points||0);
    const total = earned + gp.penalties;
    await db('gp_monthly').where('id',gp.id).update({earned,total,tasks_done:JSON.stringify(tasks),updated_at:new Date()});
    res.json({earned,total,tasks_done:tasks,message:'+'+points+' GP'});
  } catch(e){res.status(500).json({error:e.message})}
});

router.post('/penalty', authenticate, requirePermission('gp','update'), auditLog('GP扣分'), async (req, res) => {
  try {
    const {user_id,points,reason} = req.body;
    const month = new Date().toISOString().slice(0,7);
    let gp = await db('gp_monthly').where({user_id,month}).first();
    if(!gp) return res.status(404).json({error:'無GP紀錄'});
    const penalties = gp.penalties - Math.abs(points);
    const total = gp.earned + penalties;
    await db('gp_monthly').where('id',gp.id).update({penalties,total,updated_at:new Date()});
    res.json({penalties,total,message:'扣 '+points+' GP：'+reason});
  } catch(e){res.status(500).json({error:e.message})}
});

module.exports = router;