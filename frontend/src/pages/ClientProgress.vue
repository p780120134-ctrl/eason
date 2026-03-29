<template>
  <div>
    <PageHeader title="案件進度" :subtitle="c.case_no + ' · 設計師：' + c.designer" />
    <div class="stat-row">
      <StatCard label="合約金額" :value="'$'+fmtM(c.contract)+'萬'" color="var(--black)" />
      <StatCard label="目前進度" :value="c.stage" color="var(--blue)" />
      <StatCard label="已付款" :value="paidPct+'%'" color="var(--green)" :sub="'$'+fmtM(c.collected)" />
    </div>
    <div class="card"><div class="card-title">📋 案件時間軸</div><Timeline :items="timeline" /></div>
    <div class="card"><div class="card-title">💰 付款節點</div>
      <div v-for="p in payments" :key="p.period" class="pay-row">
        <div class="pay-dot" :style="{background:p.received?'var(--green)':'var(--border)'}">{{ p.received?'✓':'' }}</div>
        <div class="pay-info"><div class="pay-name">{{ p.name }}</div><div class="pay-date">{{ p.date }}</div></div>
        <div class="mono pay-amount" :style="{color:p.received?'var(--green)':'var(--text)'}">{{ p.received?'已收':'$'+(p.amount||0).toLocaleString() }}</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, computed, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
import Timeline from "@/components/common/Timeline.vue"
const c = ref({case_no:"",designer:"鄭博文",contract:1328000,collected:796800,stage:"施工中"})
const paidPct = computed(()=>Math.round((c.value.collected||0)/(c.value.contract||1)*100))
function fmtM(n){return((n||0)/10000).toFixed(1)}
const timeline = ref([
  {title:"客戶諮詢建檔",sub:"01/08",done:true},{title:"丈量需求訪談",sub:"01/15",done:true},
  {title:"提案報價確認",sub:"02/01",done:true},{title:"簽約完成",sub:"02/14",done:true},
  {title:"▶ 施工進行中",sub:"03/01 開工",done:true,active:true},
  {title:"驗收",sub:"預計 04/10",done:false},{title:"結案保固",sub:"預計 04/15",done:false},
])
const payments = ref([
  {period:1,name:"簽約款 30%",amount:398400,date:"02/14",received:true},
  {period:2,name:"開工款 30%",amount:398400,date:"03/01",received:true},
  {period:3,name:"完工款 40%",amount:531200,date:"預計 04/15",received:false},
])
onMounted(async () => {
  try {
    const {data} = await api.get("/cases",{params:{limit:1}});
    if(data.data?.length){
      const cs = data.data[0];
      c.value = {case_no:cs.case_no,designer:cs.designer_name||"",contract:cs.contract_amount||0,collected:cs.collected||0,stage:cs.stage||""};
    }
    const {data:pay} = await api.get("/finance/receivables",{params:{status:"all"}});
    if(pay.data?.length) payments.value = pay.data.slice(0,5).map(p=>({period:p.period,name:p.name,amount:p.amount,date:p.due_date?.slice(5,10)||"",received:p.received}));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}.card-title{font-size:13px;font-weight:600;margin-bottom:10px}
.pay-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)}
.pay-dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;flex-shrink:0}
.pay-info{flex:1}.pay-name{font-size:12px;font-weight:500}.pay-date{font-size:10px;color:var(--text3)}.pay-amount{font-size:13px;font-weight:600}
</style>