<template>
  <div>
    <PageHeader title="現金流看板" subtitle="餘額 · 預測 · 安全天數" />
    <div class="cf-card">
      <div class="cf-grid">
        <div><div class="cf-val mono">${{ fmtM(cf.currentBalance) }}萬</div><div class="cf-label">目前餘額</div></div>
        <div><div class="cf-val mono" style="color:var(--green)">+${{ fmtM(cf.inflow?.total) }}萬</div><div class="cf-label">預計流入（90天）</div></div>
        <div><div class="cf-val mono" style="color:var(--red)">-${{ fmtM(cf.outflow?.total) }}萬</div><div class="cf-label">預計流出</div></div>
        <div><div class="cf-val" :style="{color:cf.safeDays>=30?'var(--green)':'var(--red)'}">{{ cf.safeDays }}天</div><div class="cf-label">安全天數</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">📥 預計流入（應收款）</div>
      <div v-for="i in (cf.inflow?.items||[])" :key="i.due_date" class="flow-row">
        <span class="mono flow-date">{{ i.due_date }}</span>
        <span class="flow-amount mono" style="color:var(--green)">+${{ (i.amount||0).toLocaleString() }}</span>
      </div>
      <div v-if="!(cf.inflow?.items||[]).length" class="empty">無預計流入</div>
    </div>
    <div class="card">
      <div class="card-title">📤 預計流出（待撥款）</div>
      <div v-for="o in (cf.outflow?.items||[])" :key="o.due_date" class="flow-row">
        <span class="mono flow-date">{{ o.due_date }}</span>
        <span class="flow-amount mono" style="color:var(--red)">-${{ (o.amount||0).toLocaleString() }}</span>
      </div>
      <div v-if="!(cf.outflow?.items||[]).length" class="empty">無預計流出</div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import api from "@/utils/api"
import PageHeader from "@/components/common/PageHeader.vue"
const cf = ref({currentBalance:0,inflow:{total:0,items:[]},outflow:{total:0,items:[]},safeDays:0})
function fmtM(n){return((n||0)/10000).toFixed(1)}
onMounted(async()=>{try{const{data}=await api.get("/finance/cashflow");Object.assign(cf.value,data)}catch(e){}})
</script>
<style scoped>
.cf-card{background:var(--black);border-radius:14px;padding:20px;margin-bottom:14px;color:#fff}
.cf-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center}
.cf-val{font-size:24px;font-weight:900}.cf-label{font-size:10px;opacity:.5}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}.card-title{font-size:13px;font-weight:600;margin-bottom:10px}
.flow-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px}.flow-date{color:var(--text3)}.flow-amount{font-weight:700}
.empty{text-align:center;padding:16px;color:var(--text3);font-size:12px}
@media(max-width:768px){.cf-grid{grid-template-columns:repeat(2,1fr)}}
</style>