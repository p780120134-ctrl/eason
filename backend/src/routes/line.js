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

// LINE Push Message
async function linePush(lineUserId, text) {
  const token = process.env.LINE_ACCESS_TOKEN;
  if (!token || token === 'your_access_token') return { ok: false, reason: 'LINE_ACCESS_TOKEN 未設定' };
  try {
    const axios = require('axios');
    await axios.post('https://api.line.me/v2/bot/message/push', {
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
    return { ok: true };
  } catch (e) {
    console.error('[LINE Push]', e.response?.data || e.message);
    return { ok: false, reason: e.message };
  }
}

// LINE Notify
async function lineNotify(message) {
  const token = process.env.LINE_NOTIFY_TOKEN_ALL;
  if (!token || token === 'your_notify_token') return;
  try {
    const axios = require('axios');
    await axios.post('https://notify-api.line.me/api/notify', `message=${encodeURIComponent(message)}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (e) { console.error('[LINE Notify]', e.message); }
}

router.post('/conversations/:id/reply', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    const [msg] = await db('line_messages').insert({ conversation_id: req.params.id, direction: 'out', sender_name: req.user.username, text, source: 'platform' }).returning('*');
    await db('line_conversations').where('id', req.params.id).update({ last_message: text, last_message_at: new Date() });

    // LINE Push API 回推
    const conv = await db('line_conversations').where('id', req.params.id).first();
    if (conv?.line_user_id) {
      const result = await linePush(conv.line_user_id, text);
      msg.line_pushed = result.ok;
    }

    res.status(201).json(msg);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/line/notify — 發送 LINE Notify
router.post('/notify', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: '訊息不能為空' });
    await lineNotify(message);
    res.json({ message: '已發送' });
  } catch (e) { res.status(500).json({ error: e.message }); }
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