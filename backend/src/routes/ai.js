const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

router.post('/analyze-meeting', authenticate, async (req, res) => {
  try {
    const {transcript} = req.body;
    if(!transcript) return res.status(400).json({error:'無逐字稿'});
    // TODO: Claude API proxy
    // const Anthropic = require('@anthropic-ai/sdk');
    // const client = new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
    // const response = await client.messages.create({...});
    res.json({
      summary:'AI 分析功能待接入 Claude API',
      needs:[],promises:[],nextActions:[],
      note:'請在 .env 設定 ANTHROPIC_API_KEY 後啟用',
    });
  } catch(e){res.status(500).json({error:e.message})}
});

router.post('/quote', authenticate, async (req, res) => {
  try {
    const {area,type} = req.body;
    const basePrice = type==='全室翻修'?52000:type==='局部裝修'?35000:25000;
    const total = Math.round((area||25)*basePrice);
    const cost = Math.round(total*0.7);
    res.json({total,cost,margin:30,items:[{name:'概估報價',unit:'坪',qty:area,price:basePrice,subtotal:total}]});
  } catch(e){res.status(500).json({error:e.message})}
});

router.post('/schedule', authenticate, async (req, res) => {
  try {
    const {area,type} = req.body;
    const base = type==='全室翻修'?Math.round(area*1.2):type==='局部裝修'?Math.round(area*0.7):Math.round(area*0.4);
    res.json({predictedDays:base,optimistic:Math.round(base*0.85),pessimistic:Math.round(base*1.25),confidence:'medium'});
  } catch(e){res.status(500).json({error:e.message})}
});

module.exports = router;