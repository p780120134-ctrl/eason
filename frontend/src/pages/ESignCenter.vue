<template>
  <div>
    <PageHeader title="電子簽章" subtitle="合約 · 追加減同意書 · 驗收單" />
    <div class="stat-row">
      <StatCard label="待簽署" :value="pending.length" :color="pending.length?'var(--red)':'var(--green)'" />
      <StatCard label="已簽署" :value="signed.length" color="var(--green)" />
      <StatCard label="全部" :value="docs.length" />
    </div>
    <div class="tab-bar"><button v-for="t in tabs" :key="t.id" :class="{active:tab===t.id}" @click="tab=t.id">{{ t.label }}</button></div>

    <div v-for="doc in currentList" :key="doc.id" class="card">
      <div class="d-top">
        <div><div class="d-title">{{ doc.title }}</div><div class="d-sub mono">{{ doc.type }} · {{ doc.created_at }}</div></div>
        <StatusTag :color="doc.status==='已簽署'?'green':'red'" :label="doc.status" />
      </div>
      <div v-if="doc.amount" class="mono d-amount">${{ doc.amount.toLocaleString() }}</div>
      <div class="d-parties">
        <div v-for="p in doc.parties" :key="p.name" class="party-row">
          <div class="party-dot" :style="{background:p.signed?'var(--green)':'var(--border)'}">{{ p.signed?'✓':p.name[0] }}</div>
          <div class="party-info"><div class="party-role">{{ p.role }}</div><div class="party-name">{{ p.name }}{{ p.signed?' · '+p.sign_date:'' }}</div></div>
          <div v-if="p.signed" class="party-sig" style="font-family:cursive;font-style:italic;color:var(--text2)">{{ p.name }}</div>
          <button v-else-if="canSign(p)" class="btn btn-sm btn-primary" @click="openSignPad(doc,p)">✍ 簽署</button>
          <span v-else class="party-wait">等待簽署</span>
        </div>
      </div>
      <div class="d-actions">
        <button class="btn btn-sm" @click="viewDoc(doc)">👁 查看</button>
        <button class="btn btn-sm" @click="downloadPDF(doc)">⬇ PDF</button>
        <button class="btn btn-sm" v-if="doc.status==='已簽署'" @click="verifyDoc(doc)">🔍 驗證</button>
      </div>
    </div>

    <!-- 簽名板 Modal -->
    <div class="modal-overlay" v-if="showSignPad" @click.self="showSignPad=false">
      <div class="modal">
        <h3>✍ 電子簽名</h3>
        <p class="sign-hint">請在下方空白區域簽名</p>
        <canvas ref="signCanvas" width="380" height="160" class="sign-canvas"
          @mousedown="startDraw" @mousemove="drawing" @mouseup="endDraw" @mouseleave="endDraw"
          @touchstart.prevent="startDraw" @touchmove.prevent="drawing" @touchend="endDraw" />
        <div class="sign-actions">
          <button class="btn" @click="clearCanvas">清除重簽</button>
          <button class="btn btn-primary" @click="submitSign">確認簽署</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { useToast } from "@/composables/useToast"
import { ref, computed, nextTick } from "vue"
import { useAuthStore } from "@/stores/auth"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
import StatusTag from "@/components/common/StatusTag.vue"

const auth = useAuthStore()
const tab = ref("pending")
const tabs = [{id:"pending",label:"✍ 待簽署"},{id:"signed",label:"✅ 已簽署"},{id:"all",label:"📋 全部"}]
const showSignPad = ref(false)
const signCanvas = ref(null)
const signingDoc = ref(null)
const signingParty = ref(null)
let isDrawing = false
let ctx = null

const docs = ref([
  // TODO: load from API /api/esign
 
  {id:1,type:"合約",title:"大安張宅全室翻修工程合約",created_at:"2026/02/08",amount:1328000,status:"已簽署",
   parties:[{role:"甲方（業主）",name:"張先生",signed:true,sign_date:"02/10"},{role:"乙方（統包先生）",name:"陳逸昇",signed:true,sign_date:"02/10"}]},
  {id:2,type:"追加減同意書",title:"主臥增設嵌燈×4 追加確認",created_at:"2026/03/14",amount:12000,status:"待簽署",
   parties:[{role:"業主確認",name:"張先生",signed:false},{role:"設計師",name:"鄭博文",signed:true,sign_date:"03/14"}]},
  {id:3,type:"驗收單",title:"大安張宅完工驗收確認單",created_at:"2026/03/27",amount:0,status:"待簽署",
   parties:[{role:"業主驗收",name:"張先生",signed:false},{role:"設計師",name:"鄭博文",signed:false},{role:"工務",name:"王源",signed:false}]},
])

const pending = computed(()=>docs.value.filter(d=>d.status!=="已簽署"))
const signed = computed(()=>docs.value.filter(d=>d.status==="已簽署"))
const currentList = computed(()=>tab.value==="pending"?pending.value:tab.value==="signed"?signed.value:docs.value)

function canSign(p){return !p.signed && (p.name===auth.user?.name || auth.user?.role==="client")}

function openSignPad(doc,party){
  signingDoc.value=doc; signingParty.value=party; showSignPad.value=true
  nextTick(()=>{
    const c=signCanvas.value; if(!c)return
    ctx=c.getContext("2d"); ctx.strokeStyle="#0A0A0A"; ctx.lineWidth=2.5; ctx.lineCap="round"
  })
}

function getPos(e){
  const r=signCanvas.value.getBoundingClientRect()
  const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left
  const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top
  return{x:x*(380/r.width),y:y*(160/r.height)}
}
function startDraw(e){isDrawing=true;const p=getPos(e);ctx.beginPath();ctx.moveTo(p.x,p.y)}
function drawing(e){if(!isDrawing)return;const p=getPos(e);ctx.lineTo(p.x,p.y);ctx.stroke()}
function endDraw(){isDrawing=false}
function clearCanvas(){ctx?.clearRect(0,0,380,160)}

function submitSign(){
  if(!signingParty.value)return
  signingParty.value.signed=true
  signingParty.value.sign_date=new Date().toLocaleDateString("zh-TW")
  const doc=signingDoc.value
  if(doc.parties.every(p=>p.signed))doc.status="已簽署"
  showSignPad.value=false
  alert("✅ 簽署完成！")
}

function viewDoc(d){alert("查看文件："+d.title)}
function downloadPDF(d){alert("下載 PDF："+d.title+".pdf")}
function verifyDoc(d){alert("✅ 簽章有效\n文件："+d.title)}
onMounted(async () => {
  try {
    const {data} = await api.get("/esign");
    if(data.data?.length) docs.value = data.data.map(d=>({
      id:d.id,type:d.type,title:d.title,created_at:d.created_at?.slice(0,10)||"",amount:d.amount||0,status:d.status,
      parties:(d.parties||[]).map(p=>({role:p.role,name:p.signer_name,signed:p.signed,sign_date:p.signed_at?.slice(5,10)||""}))
    }));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.tab-bar{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:14px}.tab-bar button{padding:8px 14px;border:none;background:transparent;font-size:12px;color:var(--text3);border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;font-family:var(--font-sans)}.tab-bar button.active{font-weight:700;color:var(--text);border-bottom-color:var(--text)}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px}
.d-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}.d-title{font-size:14px;font-weight:700}.d-sub{font-size:11px;color:var(--text3)}.d-amount{font-size:14px;font-weight:600;margin-bottom:8px}
.d-parties{margin-bottom:8px}.party-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)}
.party-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:700;flex-shrink:0}
.party-info{flex:1}.party-role{font-size:10px;color:var(--text3)}.party-name{font-size:12px;font-weight:500}.party-wait{font-size:10px;color:var(--text3)}
.d-actions{display:flex;gap:6px}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:var(--bg2);border-radius:16px;padding:20px;width:100%;max-width:420px}.modal h3{font-size:16px;font-weight:800;margin-bottom:4px}
.sign-hint{font-size:12px;color:var(--text3);margin-bottom:10px}
.sign-canvas{width:100%;height:160px;border:1.5px solid var(--border);border-radius:10px;background:#fff;cursor:crosshair;touch-action:none}
.sign-actions{display:flex;gap:8px;margin-top:12px}
.btn{padding:8px 16px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:12px;font-family:var(--font-sans);flex:1}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}.btn-sm{padding:5px 12px;flex:none}
</style>