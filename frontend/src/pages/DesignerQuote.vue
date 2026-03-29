<template>
  <div>
    <PageHeader title="報價系統" subtitle="建立 · 編輯 · 送審 · 匯出" />
    <div class="tab-bar"><button v-for="t in tabs" :key="t.id" :class="{active:tab===t.id}" @click="tab=t.id">{{ t.label }}</button></div>

    <div v-if="tab==='list'">
      <div class="card" v-for="q in quotes" :key="q.id">
        <div class="q-row">
          <div><div class="q-name">{{ q.case_name }}</div><div class="q-sub mono">{{ q.quote_no }} · v{{ q.version }}</div></div>
          <div class="q-right"><div class="mono q-amount">${{ q.total.toLocaleString() }}</div>
          <StatusTag :color="q.status==='已核准'?'green':q.status==='草稿'?'gray':'blue'" :label="q.status" /></div>
        </div>
        <div class="q-actions">
          <button class="btn btn-sm" @click="editQuote(q)">編輯</button>
          <button class="btn btn-sm" v-if="q.status==='草稿'" @click="q.status='已送審'">送審</button>
          <button class="btn btn-sm" @click="exportQuote(q)">⬇ Excel</button>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%">+ 建立新報價單</button>
    </div>

    <div v-if="tab==='ai'">
      <div class="card">
        <div class="card-title">🤖 AI 快速報價</div>
        <div class="form-row">
          <div class="field"><label>案件類型</label><select v-model="aiParams.type"><option>全室翻修</option><option>局部裝修</option><option>中古屋翻新</option></select></div>
          <div class="field"><label>坪數</label><input type="number" v-model="aiParams.area" /></div>
        </div>
        <button class="btn btn-primary" @click="generateAI">🤖 AI 生成報價</button>
        <div v-if="aiResult" class="ai-result">
          <div class="ai-total">建議報價：<strong class="mono">${{ aiResult.total.toLocaleString() }}</strong></div>
          <div class="ai-margin">毛利率：{{ aiResult.margin }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatusTag from "@/components/common/StatusTag.vue"
const tab = ref("list")
const tabs = [{id:"list",label:"📋 報價單"},{id:"ai",label:"🤖 AI 報價"}]
const quotes = ref([
  // TODO: load from API /api/cases (quotes)
 
  {id:1,case_name:"大安張宅全室翻修",quote_no:"Q-2026-047-v3",version:3,total:1328000,status:"已核准"},
  {id:2,case_name:"中山林宅局部",quote_no:"Q-2026-025-v1",version:1,total:520000,status:"草稿"},
])
const aiParams = ref({type:"全室翻修",area:25})
const aiResult = ref(null)
function editQuote(q){
  selectedQuote.value = q
  showQuoteModal.value = true
}
const showQuoteModal = ref(false)
const selectedQuote = ref(null)
function exportQuote(q){ window.open("/api/reports/finance","_blank") }
function generateAI(){aiResult.value={total:Math.round(aiParams.value.area*52000),margin:30}}
onMounted(async () => {
  try {
    const {data} = await api.get("/cases",{params:{limit:10}});
    quotes.value = (data.data||[]).filter(c=>c.quote_amount>0).map(c=>({id:c.id,case_name:c.name,quote_no:"Q-"+c.case_no,version:1,total:c.quote_amount||c.contract_amount||0,status:c.contract_amount?"已核准":"草稿"}));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.tab-bar{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:14px}.tab-bar button{padding:8px 14px;border:none;background:transparent;font-size:12px;color:var(--text3);border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;font-family:var(--font-sans)}.tab-bar button.active{font-weight:700;color:var(--text);border-bottom-color:var(--text)}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px}.card-title{font-size:13px;font-weight:600;margin-bottom:10px}
.q-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.q-name{font-size:14px;font-weight:600}.q-sub{font-size:11px;color:var(--text3)}.q-amount{font-size:16px;font-weight:700;margin-bottom:2px}.q-right{text-align:right}
.q-actions{display:flex;gap:6px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.field label{display:block;font-size:12px;color:var(--text2);margin-bottom:4px}.field input,.field select{width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none;background:var(--bg3)}
.ai-result{margin-top:12px;padding:12px;background:var(--black);border-radius:10px;color:#fff;text-align:center}.ai-total{font-size:14px;margin-bottom:4px}.ai-total strong{font-size:22px}.ai-margin{font-size:12px;opacity:.6}
.btn{padding:8px 16px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:12px;font-family:var(--font-sans)}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}.btn-sm{padding:5px 12px;font-size:11px}
</style>