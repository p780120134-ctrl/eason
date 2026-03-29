<template>
  <div>
    <PageHeader title="驗收缺失" subtitle="逐項驗收 · 缺失追蹤 · 改善確認" />
    <div class="stat-row">
      <StatCard label="待驗收" :value="cases.filter(c=>c.status==='待驗收').length" color="var(--red)" />
      <StatCard label="修繕中" :value="defects.filter(d=>!d.fixed).length" color="var(--orange)" />
      <StatCard label="已完成" :value="defects.filter(d=>d.fixed).length" color="var(--green)" />
    </div>

    <div class="card" v-for="c in cases" :key="c.id">
      <div class="d-top"><div class="d-name">{{ c.name }}</div><StatusTag :color="c.status==='已驗收'?'green':'orange'" :label="c.status" /></div>
      <div v-for="d in c.items" :key="d.id" class="defect-row">
        <div class="defect-check" :class="{checked:d.pass}" @click="d.pass=!d.pass">{{ d.pass ? "✓" : "" }}</div>
        <div class="defect-info"><div class="defect-item">{{ d.item }}</div>
          <div class="defect-note" v-if="d.note" style="color:var(--red)">⚠ {{ d.note }}</div></div>
        <select class="defect-select" v-model="d.result">
          <option value="">待核</option><option value="pass">通過</option><option value="fail">缺失</option>
        </select>
      </div>
      <div class="d-actions">
        <button class="btn btn-primary btn-sm" @click="submitInspection(c)">送出驗收結果</button>
        <button class="btn btn-sm">儲存草稿</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
import StatusTag from "@/components/common/StatusTag.vue"
const cases = ref([
  // TODO: load from API /api/cases
 
  {id:1,name:"大安張宅",status:"待驗收",items:[
    {id:1,item:"客廳天花板平整度",pass:false,result:"",note:""},
    {id:2,item:"主臥衣櫃門片對齊",pass:false,result:"",note:""},
    {id:3,item:"浴室防水測試",pass:false,result:"",note:""},
    {id:4,item:"全室油漆色差",pass:false,result:"fail",note:"客廳牆面有一處刷痕"},
    {id:5,item:"水電全測試",pass:true,result:"pass",note:""},
    {id:6,item:"清潔到位",pass:false,result:"",note:""},
  ]},
])
const defects = ref([{id:1,item:"油漆刷痕",fixed:false},{id:2,item:"門片微調",fixed:true}])
function submitInspection(c){alert("驗收結果已送出："+c.name)}
onMounted(async () => {
  // TODO: load cases needing inspection from /api/cases?stage=驗收請款
})
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px}
.d-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.d-name{font-size:14px;font-weight:700}
.defect-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)}
.defect-check{width:22px;height:22px;border-radius:4px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--green);cursor:pointer;flex-shrink:0}.defect-check.checked{background:var(--green);color:#fff;border-color:var(--green)}
.defect-info{flex:1}.defect-item{font-size:12px}.defect-note{font-size:10px;margin-top:1px}
.defect-select{padding:4px 8px;border:1px solid var(--border);border-radius:4px;font-size:11px;outline:none;background:var(--bg)}
.d-actions{display:flex;gap:6px;margin-top:10px}
.btn{padding:6px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:11px;font-family:var(--font-sans)}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}.btn-sm{padding:5px 12px}
</style>