<template>
  <div>
    <PageHeader title="我的 KPI" subtitle="本月績效追蹤" />

    <div class="gp-card">
      <div class="gp-grid">
        <div><div class="gp-val mono">{{ gp.total }}</div><div class="gp-label">本月 GP</div></div>
        <div><div class="gp-val mono" style="color:var(--green)">${{ reward.toLocaleString() }}</div><div class="gp-label">預估獎金</div></div>
        <div><div class="gp-val">{{ levelIcon }}</div><div class="gp-label">Lv{{ gp.level }}</div></div>
      </div>
      <ProgressBar :value="gp.total" :max="nextThreshold" color="linear-gradient(90deg,var(--green),#fff)" :label="'還差 '+(nextThreshold-gp.total)+' GP'" />
    </div>

    <div class="card"><div class="card-title">📊 KPI 達成</div>
      <div class="kpi-row" v-for="k in kpis" :key="k.label">
        <div class="kpi-label">{{ k.label }}</div>
        <ProgressBar :value="k.value" :max="k.target" :color="k.value>=k.target?'var(--green)':'var(--red)'" />
        <div class="kpi-val mono">{{ k.value }}/{{ k.target }}{{ k.unit }}</div>
      </div>
    </div>

    <div class="card"><div class="card-title">🏆 月排名</div>
      <div class="rank-row" v-for="(r,i) in ranking" :key="i">
        <span class="rank-pos">{{ ["🥇","🥈","🥉"][i] || "#"+(i+1) }}</span>
        <span class="rank-name" :style="{fontWeight:r.me?700:400}">{{ r.name }}</span>
        <span class="rank-gp mono">{{ r.gp }} GP</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, computed, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import ProgressBar from "@/components/common/ProgressBar.vue"
const gp = ref({total:0,level:3,earned:720,penalties:-26})
const reward = 6000
const nextThreshold = 900
const levelIcon = computed(()=>["🌱","🌿","⭐","🔥","💎","👑"][gp.value.level-1])
const kpis = ref([
  {label:"客戶資料完整率",value:95,target:95,unit:"%"},
  {label:"提案準時率",value:90,target:95,unit:"%"},
  {label:"回覆時效",value:88,target:90,unit:"%"},
  {label:"簽約率",value:67,target:60,unit:"%"},
  {label:"本月簽約",value:1,target:2,unit:"件"},
])
const ranking = ref([
  {name:"謝佳育",gp:780},{name:"鄭博文",gp:694,me:true},{name:"許名妤",gp:650},{name:"蔡宏霖",gp:520},
])
onMounted(async () => {
  try {
    const {data} = await api.get("/gp/my");
    if(data.total!==undefined) gp.value = {total:data.total||0,level:data.level||1,earned:data.earned||0,penalties:data.penalties||0};
    const {data:team} = await api.get("/gp/team").catch(()=>({data:[]}));
    if(team.length) ranking.value = team.slice(0,6).map(t=>({name:t.name,gp:t.total||0,me:t.name===gp.value.name}));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.gp-card{background:var(--black);border-radius:14px;padding:18px;margin-bottom:14px;color:#fff}
.gp-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center;margin-bottom:14px}.gp-val{font-size:28px;font-weight:900}.gp-label{font-size:10px;opacity:.5}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}.card-title{font-size:13px;font-weight:600;margin-bottom:10px}
.kpi-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}.kpi-label{width:100px;font-size:11px;flex-shrink:0}.kpi-val{font-size:11px;font-weight:600;width:60px;text-align:right}
.rank-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px}.rank-pos{width:24px;text-align:center}.rank-name{flex:1}.rank-gp{font-weight:700}
</style>