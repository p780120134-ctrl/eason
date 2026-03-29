const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Claude API Proxy
async function callClaude(systemPrompt, userMessage) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key') {
    return null; // 未設定 → 回傳 fallback
  }
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  return response.content[0]?.text || '';
}

// POST /api/ai/analyze-meeting — AI 會議分析
router.post('/analyze-meeting', authenticate, async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: '無逐字稿' });

    const result = await callClaude(
      '你是裝修公司的會議分析助理。分析設計師與客戶的會議逐字稿，回傳 JSON 格式：{"summary":"摘要","needs":["需求1"],"promises":["承諾1"],"nextActions":["行動1"],"profScore":85,"alerts":["注意事項"]}',
      transcript
    );

    if (result) {
      try {
        const parsed = JSON.parse(result);
        return res.json(parsed);
      } catch (e) {
        return res.json({ summary: result, needs: [], promises: [], nextActions: [] });
      }
    }

    // fallback（未設定 API Key）
    res.json({
      summary: 'AI 分析功能待接入 Claude API。請在 .env 設定 ANTHROPIC_API_KEY。',
      needs: [], promises: [], nextActions: [],
      note: '目前為 fallback 模式',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
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