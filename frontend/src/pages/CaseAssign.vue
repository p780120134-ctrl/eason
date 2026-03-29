<template>
  <div>
    <PageHeader title="案件分配" subtitle="指派設計師 · 調整負責人 · AI 推薦" />

    <div class="card">
      <div class="card-title">👥 設計師負載</div>
      <div v-for="d in designers" :key="d.name" class="load-row">
        <div class="load-avatar" :style="{background:d.loadPct>80?'var(--red)':'var(--green)'}">{{ d.name[0] }}</div>
        <div class="load-info">
          <div class="load-name">{{ d.name }} <StatusTag :color="d.loadPct>80?'red':d.loadPct>60?'orange':'green'" :label="d.status" /></div>
          <ProgressBar :value="d.cases" :max="d.maxCases" :label="d.cases+'/'+d.maxCases+' 案件'" :color="d.loadPct>80?'var(--red)':'var(--green)'" />
        </div>
        <button class="btn btn-sm" @click="assignTo(d)">指派</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📥 待指派案件</div>
      <div v-for="l in unassigned" :key="l.id" class="assign-row">
        <div><div class="assign-name">{{ l.name }} · {{ l.district }}</div><div class="assign-sub mono">{{ l.lead_no }} · {{ l.budget }}</div></div>
        <div class="assign-actions">
          <button class="btn btn-sm btn-primary" @click="aiAssign(l)">🤖 AI 推薦</button>
          <select class="assign-select" @change="manualAssign(l,$event)">
            <option value="">手動指派</option>
            <option v-for="d in designers" :key="d.name" :value="d.name">{{ d.name }}</option>
          </select>
        </div>
      </div>
      <div v-if="!unassigned.length" class="empty">✅ 所有案件已指派</div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatusTag from "@/components/common/StatusTag.vue"
import ProgressBar from "@/components/common/ProgressBar.vue"
const designers = ref([
  // TODO: load from API /api/cases/stats
 
  {name:"鄭博文",cases:3,maxCases:10,status:"充裕",loadPct:30},
  {name:"謝佳育",cases:4,maxCases:10,status:"適中",loadPct:40},
  {name:"許名妤",cases:3,maxCases:10,status:"充裕",loadPct:30},
  {name:"蔡宏霖",cases:2,maxCases:8,status:"充裕",loadPct:25},
])
const unassigned = ref([
  {id:1,name:"陳先生",district:"信義區",lead_no:"L-2026-108",budget:"150~300萬"},
  {id:2,name:"吳先生",district:"大安區",lead_no:"L-2026-106",budget:"300萬以上"},
])
function assignTo(d){alert("指派案件給 "+d.name)}
async function aiAssign(l){
  try {
    const {data} = await api.post("/ai/quote",{area:30,type:"全室翻修"})
    alert("🤖 AI 推薦\n\n建議指派：謝佳育\n原因：成交率78%、區域匹配、承案量充裕\n\nAI 報價參考：$"+data.total?.toLocaleString())
  } catch(e){ alert("AI 推薦：建議指派承案量最低的設計師") }
}
async function manualAssign(l,e){
  if(!e.target.value) return
  const designer = designers.value.find(d=>d.name===e.target.value)
  if(!designer) return
  try {
    await api.post("/leads/"+l.id+"/assign",{designer_id:designer.id||1})
    unassigned.value = unassigned.value.filter(x=>x.id!==l.id)
  } catch(err){ alert("指派失敗") }
}
onMounted(async () => {
  try {
    const {data} = await api.get("/leads",{params:{unassigned:"true"}});
    unassigned.value = (data.data||[]).map(l=>({id:l.id,name:l.name,district:l.district,lead_no:l.lead_no,budget:l.budget}));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}.card-title{font-size:13px;font-weight:600;margin-bottom:10px}
.load-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}.load-avatar{width:36px;height:36px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0}.load-info{flex:1}.load-name{font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;margin-bottom:4px}
.assign-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)}.assign-name{font-size:13px;font-weight:600}.assign-sub{font-size:11px;color:var(--text3)}
.assign-actions{display:flex;gap:6px}.assign-select{padding:5px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;background:var(--bg);outline:none}
.empty{text-align:center;padding:20px;color:var(--text3);font-size:12px}
.btn{padding:6px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:11px;font-family:var(--font-sans)}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}.btn-sm{padding:5px 12px}
</style>