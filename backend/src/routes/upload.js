const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// S3 設定（有設定就用 S3，沒設定就存本地）
const useS3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET);
let s3Client, PutObjectCommand, getSignedUrl;

if (useS3) {
  const { S3Client, PutObjectCommand: POC } = require('@aws-sdk/client-s3');
  const { getSignedUrl: gsu } = require('@aws-sdk/s3-request-presigner');
  s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' });
  PutObjectCommand = POC;
  getSignedUrl = gsu;
  console.log('[Upload] S3 模式：', process.env.S3_BUCKET);
} else {
  console.log('[Upload] 本地模式：uploads/');
}

// 本地存儲 fallback
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|heic|webp|gif|pdf|doc|docx|mp4|mov/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ext ? null : new Error('不支援此檔案格式'), ext);
  },
});

// POST /api/upload — 上傳檔案
router.post('/', authenticate, upload.single('file'), auditLog('上傳檔案'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '無檔案' });

    const { category, case_id } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileType = req.file.mimetype.startsWith('image/') ? 'photo' : req.file.mimetype === 'application/pdf' ? 'document' : 'other';
    const key = `${category || 'misc'}/${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    let url;

    if (useS3) {
      // S3 上傳
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }));
      url = `${process.env.S3_CDN_BASE || 'https://s3.amazonaws.com/' + process.env.S3_BUCKET}/${key}`;
    } else {
      // 本地存儲
      const localPath = path.join(uploadDir, key.replace(/\//g, '_'));
      fs.writeFileSync(localPath, req.file.buffer);
      url = '/uploads/' + path.basename(localPath);
    }

    const [doc] = await db('documents').insert({
      case_id: case_id || null,
      type: fileType,
      name: req.file.originalname,
      file_type: ext.slice(1),
      size: req.file.size,
      s3_key: key,
      url,
      category: category || '其他',
      uploader_id: req.user.id,
    }).returning('*');

    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/upload/presign — 取得 S3 Presigned URL（前端直傳）
router.post('/presign', authenticate, async (req, res) => {
  if (!useS3) return res.status(400).json({ error: '未設定 S3，請使用 POST /api/upload' });
  try {
    const { filename, contentType, category } = req.body;
    const key = `${category || 'misc'}/${Date.now()}_${filename}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const cdnUrl = `${process.env.S3_CDN_BASE || ''}/${key}`;
    res.json({ uploadUrl, key, cdnUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/upload — 檔案列表
router.get('/', authenticate, async (req, res) => {
  try {
    let query = db('documents AS d')
      .leftJoin('users AS u', 'u.id', 'd.uploader_id')
      .leftJoin('cases AS c', 'c.id', 'd.case_id')
      .select('d.*', 'u.name AS uploader_name', 'c.case_no', 'c.name AS case_name');
    if (req.query.case_id) query = query.where('d.case_id', req.query.case_id);
    if (req.query.type) query = query.where('d.type', req.query.type);
    if (req.query.category) query = query.where('d.category', req.query.category);
    const data = await query.orderBy('d.created_at', 'desc').limit(200);
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/upload/:id — 單筆
router.get('/:id', authenticate, async (req, res) => {
  try {
    const doc = await db('documents').where('id', req.params.id).first();
    if (!doc) return res.status(404).json({ error: '檔案不存在' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/upload/:id — 刪除
router.delete('/:id', authenticate, auditLog('刪除檔案'), async (req, res) => {
  try {
    const doc = await db('documents').where('id', req.params.id).first();
    if (!doc) return res.status(404).json({ error: '檔案不存在' });
    // S3 刪除 TODO: s3Client.send(new DeleteObjectCommand(...))
    // 本地刪除
    if (!useS3 && doc.url) {
      const localPath = path.join(uploadDir, path.basename(doc.url));
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }
    await db('documents').where('id', req.params.id).del();
    res.json({ message: '已刪除' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;