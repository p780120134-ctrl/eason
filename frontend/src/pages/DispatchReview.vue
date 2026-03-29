<template>
  <div>
    <PageHeader title="派工審核" subtitle="工班發包 · 排程確認 · 進場管理" />
    <div class="stat-row">
      <StatCard label="待確認" :value="pending.length" color="var(--red)" />
      <StatCard label="施工中" :value="active.length" color="var(--blue)" />
      <StatCard label="已完工" :value="completed.length" color="var(--green)" />
    </div>
    <div class="tab-bar"><button v-for="t in tabs" :key="t" :class="{active:tab===t}" @click="tab=t">{{ t }}</button></div>

    <div v-for="w in currentList" :key="w.id" class="card">
      <div class="w-top">
        <div><div class="w-name">{{ w.trade }} · {{ w.case_name }}</div><div class="w-sub mono">{{ w.order_no }} · {{ w.vendor }}</div></div>
        <div class="w-right"><div class="mono w-amount">${{ w.amount.toLocaleString() }}</div>
        <StatusTag :color="statusColor(w.status)" :label="w.status" /></div>
      </div>
      <div class="w-dates"><span>排程：{{ w.start }} ~ {{ w.end }}</span></div>
      <div class="w-actions" v-if="w.status==='待確認'">
        <button class="btn btn-sm btn-primary" @click="w.status='已確認'">✓ 核准</button>
        <button class="btn btn-sm" style="color:var(--red)" @click="w.status='已拒絕'">✕ 退回</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, computed, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
import StatusTag from "@/components/common/StatusTag.vue"
const tab = ref("待確認")
const tabs = ["待確認","施工中","已完工"]
const orders = ref([
  // TODO: load from API /api/finance/payables
 
  {id:1,trade:"木作",case_name:"大安張宅",order_no:"WO-047-001",vendor:"李明木作",amount:152500,start:"03/18",end:"04/05",status:"待確認"},
  {id:2,trade:"油漆",case_name:"大安張宅",order_no:"WO-047-002",vendor:"全誠油漆",amount:76800,start:"04/01",end:"04/10",status:"待確認"},
  {id:3,trade:"泥作",case_name:"信義李宅",order_no:"WO-043-001",vendor:"明達泥作",amount:98000,start:"03/15",end:"03/28",status:"施工中"},
  {id:4,trade:"水電",case_name:"信義李宅",order_no:"WO-043-002",vendor:"明達水電",amount:65000,start:"03/10",end:"03/20",status:"已完工"},
])
const pending = computed(()=>orders.value.filter(o=>o.status==="待確認"))
const active = computed(()=>orders.value.filter(o=>o.status==="施工中"))
const completed = computed(()=>orders.value.filter(o=>o.status==="已完工"))
const currentList = computed(()=>orders.value.filter(o=>o.status===tab.value))
function statusColor(s){return s==="已完工"?"green":s==="施工中"?"blue":s==="待確認"?"orange":"red"}
onMounted(async () => {
  try {
    const {data} = await api.get("/finance/payables");
    orders.value = (data.data||[]).map(d=>({id:d.id,trade:d.stage||"工程",case_name:d.case_name||"",order_no:d.claim_no,vendor:d.vendor_name||"",amount:d.amount||0,start:"",end:"",status:d.status}));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.tab-bar{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:14px}.tab-bar button{padding:8px 14px;border:none;background:transparent;font-size:12px;color:var(--text3);border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;font-family:var(--font-sans)}.tab-bar button.active{font-weight:700;color:var(--text);border-bottom-color:var(--text)}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px}
.w-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}.w-name{font-size:14px;font-weight:700}.w-sub{font-size:11px;color:var(--text3)}.w-amount{font-size:16px;font-weight:700;margin-bottom:2px}.w-right{text-align:right}
.w-dates{font-size:11px;color:var(--text3);margin-bottom:6px}
.w-actions{display:flex;gap:6px}
.btn{padding:6px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:11px;font-family:var(--font-sans)}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}.btn-sm{padding:5px 12px}
</style>