<template>
  <div>
    <PageHeader title="請款節點" subtitle="我的案件收款進度追蹤" />
    <div class="stat-row">
      <StatCard label="待收總額" :value="'$'+formatM(totalPending)+'萬'" color="var(--red)" />
      <StatCard label="已收" :value="'$'+formatM(totalCollected)+'萬'" color="var(--green)" />
      <StatCard label="逾期" :value="overdue" :color="overdue>0?'var(--red)':'var(--green)'" />
    </div>
    <div class="card" v-for="c in cases" :key="c.id">
      <div class="p-case">{{ c.name }} <span class="mono p-total">${{ c.total.toLocaleString() }}</span></div>
      <div class="p-node" v-for="n in c.nodes" :key="n.period">
        <div class="p-dot" :style="{background:n.received?'var(--green)':'var(--border)'}">{{ n.received?"✓":"" }}</div>
        <div class="p-info"><div class="p-name">{{ n.name }}</div><div class="p-date">{{ n.due_date || "待定" }}</div></div>
        <div class="mono p-amount" :style="{color:n.received?'var(--green)':'var(--text)'}">{{ n.received?"已收":"$"+n.amount.toLocaleString() }}</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, computed, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
const cases = ref([
  // TODO: load from API /api/finance/receivables
 
  {id:1,name:"大安張宅",total:1328000,nodes:[
    {period:1,name:"簽約款 30%",amount:398400,due_date:"02/10",received:true},
    {period:2,name:"開工款 30%",amount:398400,due_date:"03/01",received:true},
    {period:3,name:"完工款 40%",amount:531200,due_date:"04/05",received:false},
  ]},
  {id:2,name:"信義李宅",total:1820000,nodes:[
    {period:1,name:"簽約款 30%",amount:546000,due_date:"11/20",received:true},
    {period:2,name:"開工款 30%",amount:546000,due_date:"12/01",received:true},
    {period:3,name:"完工款 40%",amount:728000,due_date:"02/10",received:true},
  ]},
])
const totalPending = computed(()=>cases.value.reduce((s,c)=>s+c.nodes.filter(n=>!n.received).reduce((s2,n)=>s2+n.amount,0),0))
const totalCollected = computed(()=>cases.value.reduce((s,c)=>s+c.nodes.filter(n=>n.received).reduce((s2,n)=>s2+n.amount,0),0))
const overdue = computed(()=>cases.value.reduce((s,c)=>s+c.nodes.filter(n=>!n.received).length,0))
function formatM(n){return((n||0)/10000).toFixed(1)}
onMounted(async () => {
  try {
    const {data} = await api.get("/finance/receivables");
    // group by case
    const byCase = {};
    (data.data||[]).forEach(n=>{
      if(!byCase[n.case_no]) byCase[n.case_no]={id:n.case_id,name:n.case_name||n.case_no,total:0,nodes:[]};
      byCase[n.case_no].total+=n.amount||0;
      byCase[n.case_no].nodes.push({period:n.period,name:n.name,amount:n.amount,due_date:n.due_date?.slice(5,10)||"",received:n.received});
    });
    cases.value = Object.values(byCase);
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px}
.p-case{font-size:14px;font-weight:700;margin-bottom:10px;display:flex;justify-content:space-between}.p-total{color:var(--text3)}
.p-node{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)}
.p-dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;flex-shrink:0}
.p-info{flex:1}.p-name{font-size:12px;font-weight:500}.p-date{font-size:10px;color:var(--text3)}
.p-amount{font-size:13px;font-weight:600}
</style>