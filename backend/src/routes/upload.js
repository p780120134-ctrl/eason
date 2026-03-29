const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname,'../../../uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir,{recursive:true});

const storage = multer.diskStorage({
  destination:(req,file,cb)=>cb(null,uploadDir),
  filename:(req,file,cb)=>cb(null,Date.now()+'-'+file.originalname),
});
const upload = multer({storage,limits:{fileSize:10*1024*1024}});

router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if(!req.file) return res.status(400).json({error:'無檔案'});
    const {category,case_id} = req.body;
    const fileType = req.file.mimetype.startsWith('image/')?'photo':req.file.mimetype==='application/pdf'?'document':'other';
    const [doc] = await db('documents').insert({
      case_id:case_id||null, type:fileType, name:req.file.originalname,
      file_type:path.extname(req.file.originalname).slice(1),
      size:req.file.size, s3_key:req.file.filename, url:'/uploads/'+req.file.filename,
      category:category||'其他', uploader_id:req.user.id,
    }).returning('*');
    res.status(201).json(doc);
  } catch(e){res.status(500).json({error:e.message})}
});

router.get('/', authenticate, async (req, res) => {
  try {
    let query = db('documents AS d').leftJoin('users AS u','u.id','d.uploader_id').select('d.*','u.name AS uploader_name');
    if(req.query.case_id) query=query.where('d.case_id',req.query.case_id);
    if(req.query.type) query=query.where('d.type',req.query.type);
    const data = await query.orderBy('d.created_at','desc').limit(100);
    res.json({data});
  } catch(e){res.status(500).json({error:e.message})}
});

module.exports = router;