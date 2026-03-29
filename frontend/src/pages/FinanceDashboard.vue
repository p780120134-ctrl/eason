<template>
  <div>
    <PageHeader title="財務總覽" subtitle="收款 · 請款 · 損益 · 現金流" />
    <div class="stat-grid">
      <StatCard label="合約總額" :value="'$'+fmtM(dash.totalContract)+'萬'" color="var(--black)" />
      <StatCard label="已收款" :value="'$'+fmtM(dash.totalCollected)+'萬'" color="var(--green)" />
      <StatCard label="待收款" :value="'$'+fmtM(dash.totalPending)+'萬'" :color="dash.totalPending>0?'var(--red)':'var(--green)'" />
      <StatCard label="毛利率" :value="dash.grossMargin+'%'" :color="dash.grossMargin>=25?'var(--green)':'var(--red)'" />
    </div>
    <div class="stat-grid">
      <StatCard label="逾期款項" :value="dash.overdueCount" :color="dash.overdueCount>0?'var(--red)':'var(--green)'" />
      <StatCard label="待審請款" :value="dash.pendingClaims" :color="dash.pendingClaims>0?'var(--red)':'var(--text3)'" :sub="'$'+fmtM(dash.pendingClaimAmount)+'萬'" />
      <StatCard label="現金流安全" :value="cashflow.safeDays+'天'" :color="cashflow.safeDays>=30?'var(--green)':'var(--red)'" />
      <StatCard label="總成本" :value="'$'+fmtM(dash.totalCost)+'萬'" color="var(--text3)" />
    </div>
    <div class="quick-row">
      <button class="btn btn-primary" @click="$router.push('/finance/receivables')">💰 收款管理</button>
      <button class="btn" @click="$router.push('/finance/payables')">💳 工班請款</button>
      <button class="btn" @click="$router.push('/finance/pnl')">📊 案件損益</button>
      <button class="btn" @click="$router.push('/finance/invoices')">🧾 發票管理</button>
      <button class="btn" @click="$router.push('/finance/cashflow')">📈 現金流</button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import api from "@/utils/api"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
const dash = ref({totalContract:0,totalCollected:0,totalPending:0,totalCost:0,grossMargin:0,overdueCount:0,pendingClaims:0,pendingClaimAmount:0})
const cashflow = ref({safeDays:45})
function fmtM(n){return((n||0)/10000).toFixed(1)}
onMounted(async()=>{
  try{const{data}=await api.get("/finance/dashboard");Object.assign(dash.value,data)}catch(e){}
  try{const{data}=await api.get("/finance/cashflow");Object.assign(cashflow.value,data)}catch(e){}
})
</script>
<style scoped>
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}
.quick-row{display:flex;gap:8px;flex-wrap:wrap}
.btn{padding:10px 16px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:12px;font-family:var(--font-sans)}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}
@media(max-width:768px){.stat-grid{grid-template-columns:repeat(2,1fr)}.quick-row{flex-direction:column}.quick-row .btn{width:100%}}
</style>