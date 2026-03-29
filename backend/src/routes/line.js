const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get('/conversations', authenticate, requirePermission('line_oa','read'), async (req, res) => {
  try {
    const data = await db('line_conversations AS lc').leftJoin('cases AS c','c.id','lc.case_id').leftJoin('users AS u','u.id','lc.designer_id')
      .select('lc.*','c.case_no','u.name AS designer_name').orderBy('lc.last_message_at','desc');
    res.json({data});
  } catch(e){res.status(500).json({error:e.message})}
});

router.get('/conversations/:id/messages', authenticate, async (req, res) => {
  try {
    const messages = await db('line_messages').where('conversation_id',req.params.id).orderBy('created_at','asc').limit(200);
    res.json(messages);
  } catch(e){res.status(500).json({error:e.message})}
});

router.post('/conversations/:id/reply', authenticate, async (req, res) => {
  try {
    const {text} = req.body;
    const [msg] = await db('line_messages').insert({conversation_id:req.params.id,direction:'out',sender_name:req.user.username,text,source:'platform'}).returning('*');
    await db('line_conversations').where('id',req.params.id).update({last_message:text,last_message_at:new Date()});
    // TODO: LINE Push API
    res.status(201).json(msg);
  } catch(e){res.status(500).json({error:e.message})}
});

router.post('/webhook', async (req, res) => {
  // LINE Messaging API Webhook
  try {
    const events = req.body.events||[];
    for(const event of events){
      if(event.type==='message'&&event.message.type==='text'){
        let conv = await db('line_conversations').where('line_user_id',event.source.userId).first();
        if(!conv){
          [conv] = await db('line_conversations').insert({line_user_id:event.source.userId,display_name:'LINE用戶'}).returning('*');
        }
        await db('line_messages').insert({conversation_id:conv.id,direction:'in',sender_name:conv.display_name||'客戶',text:event.message.text,source:'line',line_message_id:event.message.id});
        await db('line_conversations').where('id',conv.id).update({last_message:event.message.text,last_message_at:new Date(),unread_count:db.raw('unread_count+1')});
      }
    }
    res.json({ok:true});
  } catch(e){res.status(200).json({ok:true})}
});

module.exports = router;