const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get('/my', authenticate, async (req, res) => {
  try {
    let prog = await db('onboarding_progress').where('user_id',req.user.id).first();
    if(!prog) prog = {current_module:0,current_section:0,quiz_answers:{},modules_done:[],completed:false};
    res.json(prog);
  } catch(e){res.status(500).json({error:e.message})}
});

router.put('/my', authenticate, async (req, res) => {
  try {
    const {current_module,current_section,quiz_answers,modules_done,completed,exam_tasks} = req.body;
    const update = {};
    if(current_module!==undefined) update.current_module=current_module;
    if(current_section!==undefined) update.current_section=current_section;
    if(quiz_answers) update.quiz_answers=JSON.stringify(quiz_answers);
    if(modules_done) update.modules_done=JSON.stringify(modules_done);
    if(exam_tasks) update.exam_tasks=JSON.stringify(exam_tasks);
    if(completed!==undefined){update.completed=completed;if(completed)update.completed_at=new Date();}
    const exists = await db('onboarding_progress').where('user_id',req.user.id).first();
    if(exists){await db('onboarding_progress').where('user_id',req.user.id).update(update);}
    else{await db('onboarding_progress').insert({user_id:req.user.id,module_set:req.user.role,...update});}
    if(completed) await db('users').where('id',req.user.id).update({onboarding_completed:true});
    res.json({message:'進度已更新'});
  } catch(e){res.status(500).json({error:e.message})}
});

router.get('/all', authenticate, requirePermission('onboarding','read'), async (req, res) => {
  try {
    const data = await db('onboarding_progress AS o').join('users AS u','u.id','o.user_id').join('roles AS r','r.id','u.role_id')
      .select('o.*','u.name','u.username','r.code AS role','r.name AS role_name').orderBy('o.created_at','desc');
    res.json(data);
  } catch(e){res.status(500).json({error:e.message})}
});

module.exports = router;