<template>
  <div>
    <PageHeader title="談約流程" subtitle="從接洽到簽約的完整追蹤" />
    <div class="card" v-for="c in pipeline" :key="c.id">
      <div class="n-top">
        <div><div class="n-name">{{ c.client }} · {{ c.district }}</div>
        <div class="n-sub mono">{{ c.case_no }} · {{ c.type }} · {{ c.budget }}</div></div>
        <StatusTag :color="stageColor(c.stage)" :label="c.stage" />
      </div>
      <ProgressBar :value="c.progress" :label="c.stage" />
      <Timeline :items="c.steps" />
      <div class="n-next" v-if="c.nextAction">📌 下一步：{{ c.nextAction }}</div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatusTag from "@/components/common/StatusTag.vue"
import ProgressBar from "@/components/common/ProgressBar.vue"
import Timeline from "@/components/common/Timeline.vue"
const pipeline = ref([
  // TODO: load from API /api/leads + /api/cases (pipeline)
 
  {id:1,client:"陳先生",district:"信義區",case_no:"L-2026-108",type:"全新屋",budget:"150~300萬",stage:"提案中",progress:40,
   nextAction:"週三前送出報價單",
   steps:[{title:"初談完成",sub:"03/20",done:true},{title:"丈量完成",sub:"03/23",done:true},{title:"提案準備中",sub:"進行中",done:true,active:true},{title:"報價確認",done:false},{title:"簽約",done:false}]},
  {id:2,client:"吳先生",district:"大安區",case_no:"L-2026-106",type:"中古屋",budget:"300萬以上",stage:"報價中",progress:60,
   nextAction:"客戶考慮中，週五跟進",
   steps:[{title:"初談",sub:"03/18",done:true},{title:"丈量",sub:"03/20",done:true},{title:"提案",sub:"03/24",done:true},{title:"報價送出",sub:"03/26",done:true,active:true},{title:"簽約",done:false}]},
])
function stageColor(s){const m={"初談中":"gray","丈量中":"blue","提案中":"orange","報價中":"purple","簽約中":"green"};return m[s]||"gray"}
onMounted(async () => {
  try {
    const {data} = await api.get("/leads",{params:{limit:10}});
    pipeline.value = (data.data||[]).filter(l=>l.status!=="流失"&&l.status!=="已成交").map(l=>({
      id:l.id,client:l.name,district:l.district||"",case_no:l.lead_no,type:l.house_type||"",budget:l.budget||"",
      stage:l.status==="未處理"?"初談中":l.status==="已聯繫"?"丈量中":"提案中",progress:l.status==="未處理"?20:l.status==="已聯繫"?40:60,
      nextAction:l.note||"持續跟進",
      steps:[{title:"初談",done:true},{title:"丈量",done:l.status!=="未處理"},{title:"提案",done:false,active:l.status==="跟進中"},{title:"報價",done:false},{title:"簽約",done:false}]
    }));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px}
.n-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.n-name{font-size:14px;font-weight:700}.n-sub{font-size:11px;color:var(--text3);margin-top:2px}
.n-next{font-size:12px;color:var(--text2);background:var(--bg3);padding:8px 10px;border-radius:6px;margin-top:8px}
</style>