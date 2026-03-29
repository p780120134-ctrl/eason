<template>
  <div>
    <div class="welcome">
      <div><div class="welcome-name">{{ customer.name }} 你好</div>
      <div class="welcome-sub">{{ activeCase?.name || "您的裝修旅程" }}</div></div>
      <StatusTag color="blue" :label="activeCase?.stage || '—'" size="md" />
    </div>

    <!-- 進度環 -->
    <div class="progress-card">
      <div class="ring-wrap">
        <svg width="80" height="80"><circle cx="40" cy="40" r="32" fill="none" stroke="var(--bg3)" stroke-width="8"/>
        <circle cx="40" cy="40" r="32" fill="none" stroke="var(--black)" stroke-width="8"
          :stroke-dasharray="Math.round(progress*2.01)+' 201'" stroke-linecap="round"/></svg>
        <div class="ring-val mono">{{ progress }}%</div>
      </div>
      <div class="ring-info">
        <div class="ring-title">裝修進度 {{ progress }}%</div>
        <div class="ring-stage">目前階段：<strong>{{ activeCase?.stage }}</strong></div>
        <div class="ring-est">預計完工：{{ activeCase?.est_end_date || '待定' }}</div>
      </div>
    </div>

    <!-- 步驟條 -->
    <div class="steps">
      <div v-for="(s,i) in stages" :key="i" class="step" :class="{done:i<=currentStage,active:i===currentStage}">
        <div class="step-dot">{{ i<=currentStage && i!==currentStage ? '✓' : i===currentStage ? '●' : '' }}</div>
        <div class="step-label">{{ s }}</div>
      </div>
    </div>

    <!-- 快捷 -->
    <div class="quick-grid">
      <div class="quick-item" v-for="q in quickLinks" :key="q.path" @click="$router.push(q.path)">
        <span class="quick-icon">{{ q.icon }}</span><span class="quick-label">{{ q.label }}</span>
      </div>
    </div>

    <!-- 付款提醒 -->
    <div class="payment-alert" v-if="nextPayment" @click="$router.push('/client/payments')">
      <span>💰</span>
      <div class="pa-info"><div class="pa-title">{{ nextPayment.name }}待繳</div><div class="pa-sub">截止 {{ nextPayment.due_date }}</div></div>
      <div class="mono pa-amount">${{ (nextPayment.amount||0).toLocaleString() }}</div>
    </div>

    <!-- 最新動態 -->
    <div class="card">
      <div class="card-title">🔔 最新動態</div>
      <div v-for="n in news" :key="n.text" class="news-row">
        <div class="news-dot" :style="{background:n.color}"></div>
        <div><div class="news-text">{{ n.text }}</div><div class="news-time">{{ n.time }}</div></div>
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, computed, onMounted } from "vue"
import StatusTag from "@/components/common/StatusTag.vue"
const customer = ref({name:"張先生"})
const activeCase = ref({name:" 張宅全室翻修",case_no:"TM-2026-047",stage:"施工中",est_end_date:"2026/04/15",progress:68})
const progress = computed(()=>activeCase.value?.progress||0)
const stages = ["簽約","設計提案","開工","施工中","驗收","完工"]
const currentStage = 3
const quickLinks = [
  {icon:"💬",label:"與設計師對話",path:"/client/chat"},
  {icon:"📷",label:"施工照片",path:"/client/photos"},
  {icon:"📋",label:"追加減確認",path:"/client/addons"},
  {icon:"🔧",label:"報修服務",path:"/client/repair"},
]
const nextPayment = ref({name:"完工款 40%",due_date:"2026/04/05",amount:531200})
const news = ref([
  {text:"木工師傅進場，開始衣櫃製作",time:"今日",color:"var(--blue)"},
  {text:"系統確認第二期款已收款",time:"昨日",color:"var(--green)"},
  {text:"設計師更新了施工照片(3張)",time:"03/25",color:"var(--text3)"},
])
onMounted(async () => {
  try {
    const {data} = await api.get("/cases",{params:{limit:1}});
    if(data.data?.length) {
      const c = data.data[0];
      activeCase.value = {name:c.name,case_no:c.case_no,stage:c.stage||"施工中",est_end_date:c.est_end_date||"",progress:c.progress||0};
    }
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.welcome{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.welcome-name{font-size:18px;font-weight:800}.welcome-sub{font-size:12px;color:var(--text3)}
.progress-card{background:var(--bg2);border:1.5px solid var(--border);border-radius:14px;padding:16px;margin-bottom:14px;display:flex;align-items:center;gap:20px}
.ring-wrap{position:relative;flex-shrink:0}.ring-val{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}
.ring-title{font-size:14px;font-weight:700}.ring-stage{font-size:12px;color:var(--text2)}.ring-est{font-size:11px;color:var(--text3)}
.steps{display:flex;margin-bottom:16px;gap:0}.step{flex:1;text-align:center;position:relative}
.step-dot{width:16px;height:16px;border-radius:50%;background:var(--border);margin:0 auto 4px;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff}
.step.done .step-dot{background:var(--green)}.step.active .step-dot{background:var(--blue)}
.step-label{font-size:9px;color:var(--text3)}.step.active .step-label{color:var(--blue);font-weight:600}
.quick-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.quick-item{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px 8px;text-align:center;cursor:pointer;transition:border-color .15s}.quick-item:hover{border-color:var(--black)}
.quick-icon{font-size:22px;display:block;margin-bottom:4px}.quick-label{font-size:10px;color:var(--text2)}
.payment-alert{display:flex;align-items:center;gap:10px;background:var(--bg2);border:1.5px solid var(--border);border-left:3px solid var(--black);border-radius:10px;padding:12px;margin-bottom:14px;cursor:pointer}
.pa-info{flex:1}.pa-title{font-size:13px;font-weight:700}.pa-sub{font-size:11px;color:var(--text3)}.pa-amount{font-size:16px;font-weight:800}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}.card-title{font-size:13px;font-weight:600;margin-bottom:10px}
.news-row{display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)}.news-dot{width:6px;height:6px;border-radius:50%;margin-top:6px;flex-shrink:0}.news-text{font-size:12px}.news-time{font-size:10px;color:var(--text3)}
@media(max-width:768px){.quick-grid{grid-template-columns:repeat(2,1fr)}}
</style>