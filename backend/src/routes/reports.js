const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission } = require('../middleware/auth');

router.get('/gp', authenticate, requirePermission('reports','read'), async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0,7);
    const data = await db('gp_monthly AS g').join('users AS u','u.id','g.user_id').join('roles AS r','r.id','u.role_id')
      .where('g.month',month).select('u.name','r.name AS role','g.earned','g.penalties','g.total','g.level','g.streak','g.red_card','g.reward_amount')
      .orderBy('g.total','desc');
    res.json({month,data});
  } catch(e){res.status(500).json({error:e.message})}
});

router.get('/finance', authenticate, requirePermission('reports','read'), async (req, res) => {
  try {
    const data = await db('cases').where('contract_amount','>',0)
      .select('case_no','name','contract_amount','collected','pending','cost','gross_margin','status','sign_date')
      .orderBy('sign_date','desc');
    res.json({data});
  } catch(e){res.status(500).json({error:e.message})}
});

router.get('/checkins', authenticate, requirePermission('reports','read'), async (req, res) => {
  try {
    const data = await db('checkins AS c').join('users AS u','u.id','c.user_id').leftJoin('sites AS s','s.id','c.site_id')
      .select('c.date','c.time','u.name','u.title','s.name AS site','c.type','c.gps_verified')
      .orderBy('c.date','desc').orderBy('c.time','desc').limit(500);
    res.json({data});
  } catch(e){res.status(500).json({error:e.message})}
});

module.exports = router;