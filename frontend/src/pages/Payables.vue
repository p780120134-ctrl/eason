<template>
  <div>
    <PageHeader title="工班請款" subtitle="審核 · 撥款 · 對帳" />
    <div class="stat-row">
      <StatCard label="待審核" :value="stats.pendingReview" color="var(--red)" :sub="'$'+fmtM(stats.pendingAmount)+'萬'" />
      <StatCard label="已核准" :value="'$'+fmtM(stats.approved)+'萬'" color="var(--blue)" />
      <StatCard label="已撥款" :value="'$'+fmtM(stats.paid)+'萬'" color="var(--green)" />
    </div>
    <div class="card" v-for="c in claims" :key="c.id" :style="{borderLeft:'3px solid '+(c.status==='已撥款'?'var(--green)':c.status==='已核准'?'var(--blue)':'var(--orange)')}">
      <div class="c-top">
        <div><div class="c-name">{{ c.vendor_name }} · {{ c.stage }}</div><div class="c-sub mono">{{ c.claim_no }} · {{ c.case_name }}</div></div>
        <div class="c-right"><div class="mono c-amount">${{ (c.amount||0).toLocaleString() }}</div>
        <StatusTag :color="c.status==='已撥款'?'green':c.status==='已核准'?'blue':c.status==='待審核'?'orange':'red'" :label="c.status" /></div>
      </div>
      <div class="c-actions" v-if="c.status==='待審核'">
        <button class="btn btn-sm btn-primary" @click="review(c,'approve')">✓ 核准</button>
        <button class="btn btn-sm" style="color:var(--red)" @click="review(c,'reject')">✕ 退回</button>
      </div>
      <div class="c-actions" v-if="c.status==='已核准'">
        <button class="btn btn-sm btn-primary" @click="pay(c)">💳 確認撥款</button>
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
const claims = ref([])
const stats = ref({pendingReview:0,pendingAmount:0,approved:0,paid:0})
function fmtM(n){return((n||0)/10000).toFixed(1)}
async function load(){try{const{data}=await api.get("/finance/payables");claims.value=data.data||[];stats.value=data.stats||stats.value}catch(e){}}
async function review(c,action){await api.put("/finance/payables/"+c.id+"/review",{action});load()}
async function pay(c){await api.put("/finance/payables/"+c.id+"/pay",{});load()}
onMounted(load)
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:8px}
.c-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}.c-name{font-size:14px;font-weight:700}.c-sub{font-size:11px;color:var(--text3)}.c-amount{font-size:16px;font-weight:700;margin-bottom:2px}.c-right{text-align:right}
.c-actions{display:flex;gap:6px}
.btn{padding:6px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:11px;font-family:var(--font-sans)}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}.btn-sm{padding:5px 12px}
</style>