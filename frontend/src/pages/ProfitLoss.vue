<template>
  <div>
    <PageHeader title="案件損益" subtitle="合約 · 成本 · 毛利" />
    <div class="stat-row">
      <StatCard label="合約總額" :value="'$'+fmtM(stats.totalContract)+'萬'" color="var(--black)" />
      <StatCard label="總成本" :value="'$'+fmtM(stats.totalCost)+'萬'" color="var(--red)" />
      <StatCard label="毛利" :value="'$'+fmtM(stats.totalContract-stats.totalCost)+'萬'" color="var(--green)" />
      <StatCard label="平均毛利率" :value="stats.avgMargin+'%'" :color="stats.avgMargin>=25?'var(--green)':'var(--red)'" />
    </div>
    <div class="card" v-for="c in cases" :key="c.id" @click="$router.push('/cases/'+c.id)">
      <div class="p-top">
        <div><div class="p-name">{{ c.name }}</div><div class="p-sub mono">{{ c.case_no }} · {{ c.designer_name }} · {{ c.store_name }}</div></div>
        <div class="p-margin mono" :style="{color:c.gross_margin>=25?'var(--green)':'var(--red)'}">{{ c.gross_margin||0 }}%</div>
      </div>
      <div class="p-bars">
        <div class="p-bar-row"><span class="p-bar-label">合約</span><div class="p-bar"><div class="p-bar-fill" style="background:var(--black)" :style="{width:'100%'}"></div></div><span class="mono p-bar-val">${{ (c.contract_amount||0).toLocaleString() }}</span></div>
        <div class="p-bar-row"><span class="p-bar-label">成本</span><div class="p-bar"><div class="p-bar-fill" style="background:var(--red)" :style="{width:costPct(c)+'%'}"></div></div><span class="mono p-bar-val">${{ (c.cost||0).toLocaleString() }}</span></div>
        <div class="p-bar-row"><span class="p-bar-label">已收</span><div class="p-bar"><div class="p-bar-fill" style="background:var(--green)" :style="{width:collectedPct(c)+'%'}"></div></div><span class="mono p-bar-val">${{ (c.collected||0).toLocaleString() }}</span></div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import api from "@/utils/api"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
const cases = ref([])
const stats = ref({totalContract:0,totalCost:0,totalCollected:0,avgMargin:0})
function fmtM(n){return((n||0)/10000).toFixed(1)}
function costPct(c){return c.contract_amount?Math.min(100,Math.round((c.cost||0)/c.contract_amount*100)):0}
function collectedPct(c){return c.contract_amount?Math.min(100,Math.round((c.collected||0)/c.contract_amount*100)):0}
onMounted(async()=>{try{const{data}=await api.get("/finance/pnl");cases.value=data.data||[];stats.value=data.stats||stats.value}catch(e){}})
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:8px;cursor:pointer;transition:border-color .15s}.card:hover{border-color:var(--black)}
.p-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}.p-name{font-size:14px;font-weight:700}.p-sub{font-size:11px;color:var(--text3)}.p-margin{font-size:20px;font-weight:800}
.p-bars{}.p-bar-row{display:flex;align-items:center;gap:6px;margin-bottom:4px}.p-bar-label{width:30px;font-size:10px;color:var(--text3)}.p-bar{flex:1;height:6px;background:var(--bg3);border-radius:3px;overflow:hidden}.p-bar-fill{height:100%;border-radius:3px;transition:width .3s}.p-bar-val{width:80px;text-align:right;font-size:11px;font-weight:600}
@media(max-width:768px){.stat-row{grid-template-columns:repeat(2,1fr)}}
</style>