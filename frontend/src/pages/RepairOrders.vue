<template>
  <div>
    <PageHeader title="售後工單" subtitle="客訴 · 保固報修 · 處理追蹤" />
    <div class="stat-row">
      <StatCard label="待處理" :value="orders.filter(o=>o.status==='待處理').length" color="var(--red)" />
      <StatCard label="處理中" :value="orders.filter(o=>o.status==='處理中').length" color="var(--blue)" />
      <StatCard label="已完成" :value="orders.filter(o=>o.status==='已完成').length" color="var(--green)" />
    </div>
    <div class="card" v-for="o in orders" :key="o.id" :style="{borderLeft:'3px solid '+(o.status==='待處理'?'var(--red)':o.status==='處理中'?'var(--blue)':'var(--green)')}">
      <div class="o-top">
        <div><div class="o-name">{{ o.issue }}</div><div class="o-sub mono">{{ o.wo_no }} · {{ o.client }} · {{ o.case_name }}</div></div>
        <StatusTag :color="o.status==='已完成'?'green':o.status==='處理中'?'blue':'red'" :label="o.status" />
      </div>
      <div class="o-info"><span>類型：{{ o.type }}</span><span>緊急度：{{ o.urgency }}</span><span v-if="o.scheduled">排定：{{ o.scheduled }}</span></div>
      <div class="o-actions" v-if="o.status!=='已完成'">
        <button class="btn btn-sm btn-primary" v-if="o.status==='待處理'" @click="o.status='處理中'">開始處理</button>
        <button class="btn btn-sm btn-primary" v-if="o.status==='處理中'" @click="o.status='已完成'">完成結案</button>
        <button class="btn btn-sm" @click="assignRepair(o)">指派人員</button>
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
const orders = ref([
  // TODO: load from API /api/cases (complaints)
 
  {id:1,wo_no:"WO-2026-031",client:"張先生",case_name:"大安張宅",issue:"浴室矽利康龜裂",type:"保固內",urgency:"一般",status:"處理中",scheduled:"03/30"},
  {id:2,wo_no:"WO-2026-032",client:"李先生",case_name:"信義李宅",issue:"廚房燈具閃爍",type:"保固內",urgency:"較緊急",status:"待處理",scheduled:null},
  {id:3,wo_no:"WO-2025-118",client:"張先生",case_name:"北投張宅",issue:"廚房燈具更換",type:"點數兌換",urgency:"一般",status:"已完成",scheduled:null},
])
function assignRepair(o){alert("指派維修人員："+o.wo_no)}
onMounted(async () => {
  // TODO: load from complaints API when implemented
})
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px}
.o-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}.o-name{font-size:14px;font-weight:700}.o-sub{font-size:11px;color:var(--text3)}
.o-info{display:flex;gap:12px;font-size:11px;color:var(--text3);margin-bottom:8px}
.o-actions{display:flex;gap:6px}
.btn{padding:6px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:11px;font-family:var(--font-sans)}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}.btn-sm{padding:5px 12px}
</style>