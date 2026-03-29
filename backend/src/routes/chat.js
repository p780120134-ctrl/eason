const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

router.get('/groups', authenticate, async (req, res) => {
  try {
    const groups = await db('chat_members AS m').join('chat_groups AS g','g.id','m.group_id')
      .where('m.user_id',req.user.id).select('g.*','m.role AS my_role');
    for(const g of groups){
      const last = await db('chat_messages').where('group_id',g.id).orderBy('created_at','desc').first();
      g.last_message = last?.text||'';
      g.last_time = last?.created_at||g.created_at;
      g.unread = await db('chat_messages').where('group_id',g.id).whereRaw("NOT (read_by @> ?::jsonb)", [JSON.stringify([req.user.id])]).count('id as n').first().then(r=>parseInt(r.n));
    }
    res.json(groups);
  } catch(e){res.status(500).json({error:e.message})}
});

router.get('/groups/:id/messages', authenticate, async (req, res) => {
  try {
    const messages = await db('chat_messages AS m').leftJoin('users AS u','u.id','m.user_id')
      .where('m.group_id',req.params.id).select('m.*','u.name AS sender_name','u.avatar')
      .orderBy('m.created_at','asc').limit(200);
    await db('chat_messages').where('group_id',req.params.id).whereRaw("NOT (read_by @> ?::jsonb)",[JSON.stringify([req.user.id])])
      .update({read_by:db.raw("read_by || ?::jsonb",JSON.stringify([req.user.id]))});
    res.json(messages);
  } catch(e){res.status(500).json({error:e.message})}
});

router.post('/groups/:id/messages', authenticate, async (req, res) => {
  try {
    const {text,media} = req.body;
    if(!text&&!media) return res.status(400).json({error:'訊息不能為空'});
    const [msg] = await db('chat_messages').insert({
      group_id:req.params.id,user_id:req.user.id,text,
      media:JSON.stringify(media||[]),read_by:JSON.stringify([req.user.id]),
    }).returning('*');
    res.status(201).json(msg);
  } catch(e){res.status(500).json({error:e.message})}
});

module.exports = router;