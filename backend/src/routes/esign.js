const router = require('express').Router();
const db = require('../db');
const { authenticate, requirePermission } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.get('/', authenticate, requirePermission('esign','read'), async (req, res) => {
  try {
    const docs = await db('esign_documents AS d').leftJoin('cases AS c','c.id','d.case_id').select('d.*','c.case_no','c.name AS case_name').orderBy('d.created_at','desc');
    for(const doc of docs){
      doc.parties = await db('esign_signatures').where('document_id',doc.id).orderBy('id');
    }
    res.json({data:docs});
  } catch(e){res.status(500).json({error:e.message})}
});

router.post('/', authenticate, requirePermission('esign','create'), auditLog('建立簽署文件'), async (req, res) => {
  try {
    const {case_id,type,title,amount,parties} = req.body;
    const [doc] = await db('esign_documents').insert({case_id,type,title,amount:amount||0}).returning('*');
    for(const p of (parties||[])){
      await db('esign_signatures').insert({document_id:doc.id,role:p.role,signer_name:p.name,signer_user_id:p.user_id||null});
    }
    res.status(201).json(doc);
  } catch(e){res.status(500).json({error:e.message})}
});

router.put('/:docId/sign', authenticate, auditLog('電子簽署'), async (req, res) => {
  try {
    const {signer_name,signature_url} = req.body;
    const sig = await db('esign_signatures').where({document_id:req.params.docId,signer_name}).first();
    if(!sig) return res.status(404).json({error:'簽署方不存在'});
    await db('esign_signatures').where('id',sig.id).update({signed:true,signed_at:new Date(),signature_url,ip_address:req.ip});
    const allSigned = await db('esign_signatures').where('document_id',req.params.docId).where('signed',false).first();
    if(!allSigned) await db('esign_documents').where('id',req.params.docId).update({status:'已簽署'});
    res.json({message:'簽署完成'});
  } catch(e){res.status(500).json({error:e.message})}
});

module.exports = router;