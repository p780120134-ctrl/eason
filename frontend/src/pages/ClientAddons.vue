<template>
  <div>
    <PageHeader title="追加減確認" subtitle="工程變更需您的書面確認才能施作" />
    <div class="tab-bar"><button v-for="t in tabs" :key="t.id" :class="{active:tab===t.id}" @click="tab=t.id">{{ t.label }}</button></div>

    <template v-if="tab==='pending'">
      <div v-if="!pending.length" class="empty">✅ 目前無待確認項目</div>
      <div class="card" v-for="a in pending" :key="a.id" style="border-left:3px solid var(--red)">
        <div class="a-top">
          <div><StatusTag :color="a.type==='追加'?'blue':'orange'" :label="a.type" /><span class="a-item">{{ a.item }}</span></div>
          <div class="mono a-amount" :style="{color:a.amount>=0?'var(--red)':'var(--green)'}">{{ a.amount>=0?'+':'' }}${{ Math.abs(a.amount).toLocaleString() }}</div>
        </div>
        <div class="a-reason">📝 {{ a.reason }}</div>
        <div class="a-actions">
          <button class="btn btn-sm" style="color:var(--red)" @click="reject(a)">✕ 拒絕</button>
          <button class="btn btn-sm btn-primary" @click="confirm(a)">✓ 同意確認</button>
        </div>
      </div>
    </template>

    <template v-if="tab==='confirmed'">
      <div class="card" v-for="a in confirmed" :key="a.id">
        <div class="a-top">
          <div><StatusTag :color="a.type==='追加'?'blue':'orange'" :label="a.type" /><span class="a-item">{{ a.item }}</span></div>
          <div class="mono a-amount">{{ a.amount>=0?'+':'' }}${{ Math.abs(a.amount).toLocaleString() }}</div>
        </div>
        <StatusTag color="green" label="已確認" />
      </div>
    </template>

    <template v-if="tab==='summary'">
      <div class="stat-row">
        <StatCard label="已確認追加減" :value="'$'+totalConfirmed.toLocaleString()" :color="totalConfirmed>=0?'var(--red)':'var(--green)'" />
        <StatCard label="待確認" :value="pending.length" :color="pending.length?'var(--red)':'var(--green)'" />
        <StatCard label="原合約" :value="'$1,328,000'" color="var(--black)" />
      </div>
      <div class="card">
        <div class="summary-row"><span>原合約金額</span><span class="mono">$1,328,000</span></div>
        <div class="summary-row"><span>已確認追加減</span><span class="mono" :style="{color:totalConfirmed>=0?'var(--red)':'var(--green)'}">{{ totalConfirmed>=0?'+':'' }}${{ Math.abs(totalConfirmed).toLocaleString() }}</span></div>
        <div class="summary-row total"><span>預估最終金額</span><span class="mono">${{ (1328000+totalConfirmed).toLocaleString() }}</span></div>
      </div>
    </template>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, computed, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
import StatusTag from "@/components/common/StatusTag.vue"
const tab = ref("pending")
const tabs = [{id:"pending",label:"⏳ 待確認(1)"},{id:"confirmed",label:"✅ 已確認"},{id:"summary",label:"💰 總覽"}]
const allAddons = ref([
  // TODO: load from API /api/cases/:id (addons)
 
  {id:1,type:"追加",item:"主臥增設嵌燈×4",reason:"原設計未含，業主現場確認追加",amount:12000,status:"待確認"},
  {id:2,type:"追加",item:"客廳電視牆加高20cm",reason:"業主希望延伸至天花板",amount:8500,status:"已確認"},
  {id:3,type:"減項",item:"主臥電視平台取消",reason:"業主決定不安裝電視",amount:-15000,status:"已確認"},
])
const pending = computed(()=>allAddons.value.filter(a=>a.status==="待確認"))
const confirmed = computed(()=>allAddons.value.filter(a=>a.status==="已確認"))
const totalConfirmed = computed(()=>confirmed.value.reduce((s,a)=>s+a.amount,0))
function confirm(a){a.status="已確認";alert("✓ 已確認："+a.item)}
function reject(a){a.status="已拒絕";alert("已拒絕："+a.item)}
onMounted(async () => {
  try {
    const {data} = await api.get("/cases",{params:{limit:1}});
    if(data.data?.length){
      const cs = data.data[0];
      const detail = await api.get("/cases/"+cs.id);
      if(detail.data?.addons) allAddons.value = detail.data.addons.map(a=>({id:a.id,type:a.type,item:a.item,reason:a.reason||"",amount:a.amount,status:a.status}));
    }
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.tab-bar{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:14px}.tab-bar button{padding:8px 14px;border:none;background:transparent;font-size:12px;color:var(--text3);border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;font-family:var(--font-sans)}.tab-bar button.active{font-weight:700;color:var(--text);border-bottom-color:var(--text)}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px}
.a-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.a-item{font-size:14px;font-weight:700;margin-left:6px}.a-amount{font-size:18px;font-weight:800}
.a-reason{font-size:11px;color:var(--text2);background:var(--bg3);padding:6px 8px;border-radius:6px;margin-bottom:8px}
.a-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.summary-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px}.summary-row.total{font-size:16px;font-weight:800;border:none;padding-top:12px}
.empty{text-align:center;padding:20px;color:var(--green);font-size:13px;font-weight:600}
.btn{padding:8px 16px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:12px;font-family:var(--font-sans);width:100%}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}.btn-sm{padding:8px 12px}
</style>