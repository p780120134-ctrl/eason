<template>
  <div>
    <PageHeader title="部門總覽" :subtitle="storeName + ' · ' + today">
      <template #actions><StatusTag color="black" :label="'達成率 ' + achieveRate + '%'" size="md" /></template>
    </PageHeader>

    <!-- KPI 卡 -->
    <div class="stat-grid">
      <StatCard label="本月營收" :value="'$'+formatM(revenue)+'萬'" color="var(--black)" :sub="'目標 $'+formatM(target)+'萬'" />
      <StatCard label="簽約率" :value="signRate+'%'" :color="signRate>=60?'var(--green)':'var(--red)'" />
      <StatCard label="待收款" :value="'$'+formatM(pending)+'萬'" :color="pending>0?'var(--red)':'var(--green)'" />
      <StatCard label="紅燈案件" :value="redCases" :color="redCases>0?'var(--red)':'var(--green)'" />
    </div>

    <!-- 團隊 GP 排名 -->
    <div class="card">
      <div class="card-title">🏆 團隊 GP 排名</div>
      <div v-for="(m,i) in teamRank" :key="m.name" class="rank-row">
        <span class="rank-pos">{{ ["🥇","🥈","🥉"][i] || "#"+(i+1) }}</span>
        <div class="rank-avatar" :style="{background:m.color}">{{ m.name[0] }}</div>
        <div class="rank-info"><div class="rank-name">{{ m.name }}</div><div class="rank-role">{{ m.role }}</div></div>
        <div class="rank-right">
          <div class="mono rank-gp">{{ m.gp }}</div>
          <ProgressBar :value="m.gp" :max="maxGP" :show-pct="false" style="width:60px;margin:0" />
        </div>
      </div>
    </div>

    <!-- 健康度分佈 -->
    <div class="card">
      <div class="card-title">🚦 案件健康度</div>
      <div class="health-bar">
        <div class="hb-seg" :style="{width:healthPct.green+'%',background:'var(--green)'}">{{ healthCount.green }}</div>
        <div class="hb-seg" :style="{width:healthPct.yellow+'%',background:'var(--orange)'}">{{ healthCount.yellow }}</div>
        <div class="hb-seg" :style="{width:healthPct.red+'%',background:'var(--red)'}">{{ healthCount.red }}</div>
      </div>
      <div class="health-legend">
        <span>🟢 正常 {{ healthCount.green }}</span>
        <span>🟡 警示 {{ healthCount.yellow }}</span>
        <span>🔴 異常 {{ healthCount.red }}</span>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="quick-row">
      <button class="btn btn-primary" @click="$router.push('/manager/assign')">📋 案件分配</button>
      <button class="btn" @click="$router.push('/manager/dispatch')">📦 派工審核</button>
      <button class="btn" @click="$router.push('/manager/defects')">✅ 驗收缺失</button>
      <button class="btn" @click="$router.push('/manager/repairs')">🔧 售後工單</button>
      <button class="btn" @click="$router.push('/manager/tasks')">👥 人員任務</button>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, computed, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
import StatusTag from "@/components/common/StatusTag.vue"
import ProgressBar from "@/components/common/ProgressBar.vue"
const storeName = "台北東門店"
const today = new Date().toLocaleDateString("zh-TW",{month:"long",day:"numeric"})
const revenue = ref(0); const target = ref(0); const pending = ref(0); const redCases = ref(0)
const achieveRate = computed(()=>target.value?Math.round(revenue.value/target.value*100):0)
const signRate = ref(67)
const teamRank = ref([
  {name:"鄭博文",role:"設計師",gp:694,color:"var(--green)"},
  {name:"許名妤",role:"設計師",gp:650,color:"var(--green)"},
  {name:"王源",role:"工務",gp:575,color:"var(--black)"},
  {name:"蔡宏霖",role:"設計師",gp:520,color:"var(--green)"},
])
const maxGP = computed(()=>Math.max(...teamRank.value.map(m=>m.gp),1))
const healthCount = {green:8,yellow:3,red:1}
const totalHealth = healthCount.green+healthCount.yellow+healthCount.red
const healthPct = {green:Math.round(healthCount.green/totalHealth*100),yellow:Math.round(healthCount.yellow/totalHealth*100),red:Math.round(healthCount.red/totalHealth*100)}
function formatM(n){return((n||0)/10000).toFixed(1)}
onMounted(async () => {
  try {
    const {data:stats} = await api.get("/finance/dashboard");
    revenue.value = stats.totalContract||0; target.value = 2000000;
    pending.value = stats.totalPending||0; redCases.value = stats.overdueCount||0;
    signRate.value = 67; // TODO: calculate from leads
    const {data:team} = await api.get("/gp/team").catch(()=>({data:[]}));
    if(team.length) teamRank.value = team.slice(0,6).map(t=>({name:t.name,role:t.role_name||t.role,gp:t.total||0,color:'var(--green)'}));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}.card-title{font-size:13px;font-weight:600;margin-bottom:10px}
.rank-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)}
.rank-pos{width:24px;text-align:center;font-size:16px}.rank-avatar{width:32px;height:32px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0}
.rank-info{flex:1}.rank-name{font-size:13px;font-weight:600}.rank-role{font-size:10px;color:var(--text3)}
.rank-right{text-align:right;display:flex;align-items:center;gap:8px}.rank-gp{font-size:14px;font-weight:700;width:40px}
.health-bar{display:flex;height:16px;border-radius:8px;overflow:hidden;margin-bottom:8px}.hb-seg{display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700}
.health-legend{display:flex;gap:16px;font-size:11px;color:var(--text3)}
.quick-row{display:flex;gap:8px;flex-wrap:wrap}
.btn{padding:10px 16px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:12px;font-family:var(--font-sans)}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}
@media(max-width:768px){.stat-grid{grid-template-columns:repeat(2,1fr)}.quick-row{flex-direction:column}.quick-row .btn{width:100%}}
</style>