<template>
  <div>
    <PageHeader title="收款管理" :subtitle="'待收 $'+fmtM(stats.totalPending)+'萬 · 逾期 '+stats.overdue+' 筆'" />
    <div class="stat-row">
      <StatCard label="待收總額" :value="'$'+fmtM(stats.totalPending)+'萬'" color="var(--red)" />
      <StatCard label="已收" :value="'$'+fmtM(stats.totalReceived)+'萬'" color="var(--green)" />
      <StatCard label="逾期" :value="stats.overdue" :color="stats.overdue>0?'var(--red)':'var(--green)'" />
    </div>
    <div class="tab-bar"><button v-for="t in tabs" :key="t.id" :class="{active:tab===t.id}" @click="tab=t.id;load()">{{ t.label }}</button></div>
    <div class="card" v-for="n in nodes" :key="n.id" :style="{borderLeft:'3px solid '+(n.received?'var(--green)':isOverdue(n)?'var(--red)':'var(--border)')}">
      <div class="n-top">
        <div><div class="n-case">{{ n.case_name }}</div><div class="n-sub mono">{{ n.case_no }} · {{ n.name }} · {{ n.designer_name }}</div></div>
        <div class="n-right"><div class="mono n-amount">${{ (n.amount||0).toLocaleString() }}</div>
        <StatusTag :color="n.received?'green':isOverdue(n)?'red':'orange'" :label="n.received?'已收款':isOverdue(n)?'逾期':'待收'" /></div>
      </div>
      <div class="n-info"><span>到期：{{ n.due_date||'待定' }}</span><span v-if="n.remind_count">催款 {{ n.remind_count }} 次</span></div>
      <div class="n-actions" v-if="!n.received">
        <button class="btn btn-sm btn-primary" @click="confirmReceive(n)">✓ 確認收款</button>
        <button class="btn btn-sm" @click="remind(n)">📩 催款</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import api from "@/utils/api"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
import StatusTag from "@/components/common/StatusTag.vue"
const tab = ref("pending")
const tabs = [{id:"pending",label:"⏳ 待收"},{id:"overdue",label:"🔴 逾期"},{id:"received",label:"✅ 已收"}]
const nodes = ref([])
const stats = ref({totalPending:0,totalReceived:0,overdue:0})
function fmtM(n){return((n||0)/10000).toFixed(1)}
function isOverdue(n){return !n.received && n.due_date && new Date(n.due_date)<new Date()}
async function load(){
  const params = tab.value==="pending"?{status:"pending"}:tab.value==="overdue"?{overdue:"true"}:{status:"received"}
  try{const{data}=await api.get("/finance/receivables",{params});nodes.value=data.data||[];stats.value=data.stats||stats.value}catch(e){}
}
async function confirmReceive(n){await api.put("/finance/receivables/"+n.id+"/confirm",{});load()}
async function remind(n){await api.post("/finance/receivables/"+n.id+"/remind");load()}
onMounted(load)
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.tab-bar{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:14px}.tab-bar button{padding:8px 14px;border:none;background:transparent;font-size:12px;color:var(--text3);border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;font-family:var(--font-sans)}.tab-bar button.active{font-weight:700;color:var(--text);border-bottom-color:var(--text)}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:8px}
.n-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px}.n-case{font-size:14px;font-weight:700}.n-sub{font-size:11px;color:var(--text3)}.n-amount{font-size:16px;font-weight:700;margin-bottom:2px}.n-right{text-align:right}
.n-info{font-size:11px;color:var(--text3);margin-bottom:6px;display:flex;gap:12px}
.n-actions{display:flex;gap:6px}
.btn{padding:6px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:11px;font-family:var(--font-sans)}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}.btn-sm{padding:5px 12px}
</style>