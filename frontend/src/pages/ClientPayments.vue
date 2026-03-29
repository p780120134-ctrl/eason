<template>
  <div>
    <PageHeader title="付款管理" :subtitle="'待繳 $' + (nextPay?.amount||0).toLocaleString()" />
    <div class="pay-card" v-if="nextPay">
      <div class="pay-header">💰 {{ nextPay.name }}</div>
      <div class="pay-amount mono">${{ nextPay.amount.toLocaleString() }}</div>
      <div class="pay-info">
        <div v-for="f in payFields" :key="f[0]" class="pay-field"><span class="pay-label">{{ f[0] }}</span><span class="pay-val">{{ f[1] }}</span></div>
      </div>
      <div class="pay-upload">
        <div class="upload-area" @click="uploadReceipt">📷<br><span>點擊上傳匯款截圖</span></div>
      </div>
      <button class="btn btn-primary" @click="confirmPay">確認已付款</button>
    </div>
    <div class="card"><div class="card-title">📋 付款紀錄</div>
      <div v-for="p in allPayments" :key="p.period" class="history-row">
        <div class="h-dot" :style="{background:p.received?'var(--green)':'var(--border)'}">{{ p.received?'✓':'' }}</div>
        <div class="h-info"><div class="h-name">{{ p.name }}</div><div class="h-date">{{ p.date }}</div></div>
        <div class="mono h-amount">${{ p.amount.toLocaleString() }}</div>
        <StatusTag :color="p.received?'green':'orange'" :label="p.received?'已付':'待付'" />
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, computed, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatusTag from "@/components/common/StatusTag.vue"
const allPayments = ref([
  // TODO: load from API /api/finance/receivables
 
  {period:1,name:"簽約款 30%",amount:398400,date:"02/14",received:true},
  {period:2,name:"開工款 30%",amount:398400,date:"03/01",received:true},
  {period:3,name:"完工款 40%",amount:531200,date:"04/05(預計)",received:false},
])
const nextPay = computed(()=>allPayments.value.find(p=>!p.received))
const payFields = computed(()=>nextPay.value?[
  ["案件","大安 張宅全室翻修"],["款項",nextPay.value.name],["金額","$"+nextPay.value.amount.toLocaleString()],
  ["截止",nextPay.value.date],["銀行","玉山銀行"],["帳號","808-025-1234567"],["戶名","統包先生裝修有限公司"]
]:[])
function uploadReceipt(){alert("開啟相簿選擇匯款截圖")}
function confirmPay(){alert("✓ 已送出付款通知\n財務收到後將確認並開立收據")}
onMounted(async () => {
  try {
    const {data} = await api.get("/finance/receivables");
    allPayments.value = (data.data||[]).slice(0,5).map(p=>({period:p.period,name:p.name,amount:p.amount,date:p.due_date?.slice(5,10)||"",received:p.received}));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.pay-card{background:var(--bg2);border:1.5px solid var(--border);border-radius:14px;padding:20px;margin-bottom:14px}
.pay-header{font-size:14px;font-weight:700;margin-bottom:4px}.pay-amount{font-size:32px;font-weight:900;margin-bottom:12px}
.pay-info{margin-bottom:14px}.pay-field{display:flex;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px}.pay-label{width:60px;color:var(--text3)}.pay-val{font-weight:500}
.pay-upload{margin-bottom:12px}.upload-area{background:var(--bg3);border:1.5px dashed var(--border);border-radius:10px;padding:20px;text-align:center;cursor:pointer;font-size:24px;color:var(--text3)}
.upload-area span{font-size:12px;display:block;margin-top:4px}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}.card-title{font-size:13px;font-weight:600;margin-bottom:10px}
.history-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)}
.h-dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;flex-shrink:0}
.h-info{flex:1}.h-name{font-size:12px;font-weight:500}.h-date{font-size:10px;color:var(--text3)}.h-amount{font-size:13px;font-weight:600}
.btn{padding:14px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font-sans);width:100%}.btn-primary{background:var(--black);color:#fff}
</style>