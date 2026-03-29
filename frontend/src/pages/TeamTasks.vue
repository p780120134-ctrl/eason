<template>
  <div>
    <PageHeader title="人員任務" subtitle="團隊今日工作追蹤 · GP 達標狀態" />

    <div v-for="m in members" :key="m.name" class="card member-card">
      <div class="m-top">
        <div class="m-left">
          <div class="m-avatar" :style="{background:m.color}">{{ m.name[0] }}</div>
          <div><div class="m-name">{{ m.name }}</div><div class="m-role">{{ m.role }} · GP {{ m.gp }}</div></div>
        </div>
        <div class="m-right">
          <StatusTag :color="m.checkedIn?'green':'red'" :label="m.checkedIn?'已打卡':'未打卡'" />
          <StatusTag :color="m.logDone?'green':'red'" :label="m.logDone?'日誌 ✓':'日誌 ✕'" />
        </div>
      </div>
      <ProgressBar :value="m.tasksDone" :max="m.tasksTotal" :label="'任務 '+m.tasksDone+'/'+m.tasksTotal" />
      <div class="m-tasks">
        <div v-for="t in m.tasks" :key="t" class="task-item" :class="{done:t.done}">
          <span>{{ t.done ? "✓" : "○" }}</span> {{ t.name }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatusTag from "@/components/common/StatusTag.vue"
import ProgressBar from "@/components/common/ProgressBar.vue"
const members = ref([
  // TODO: load from API /api/gp/team + /api/checkin/stats
 
  {name:"鄭博文",role:"設計師",gp:694,color:"var(--green)",checkedIn:true,logDone:false,tasksDone:5,tasksTotal:8,
   tasks:[{name:"回覆張先生",done:true},{name:"丈量照片上傳",done:true},{name:"報價單製作",done:false},{name:"工地巡查",done:false}]},
  {name:"王源",role:"工務",gp:575,color:"var(--black)",checkedIn:true,logDone:true,tasksDone:6,tasksTotal:8,
   tasks:[{name:"工地打卡",done:true},{name:"工程日誌",done:true},{name:"巡檢回報",done:true},{name:"工班確認",done:false}]},
  {name:"許名妤",role:"設計師",gp:650,color:"var(--green)",checkedIn:false,logDone:false,tasksDone:3,tasksTotal:8,
   tasks:[{name:"客戶回覆",done:true},{name:"3D模型",done:true},{name:"提案準備",done:false},{name:"報價確認",done:false}]},
])
onMounted(async () => {
  try {
    const {data:team} = await api.get("/gp/team").catch(()=>({data:[]}));
    if(team.length) members.value = team.map(t=>({
      name:t.name,role:t.role_name||t.role,gp:t.total||0,color:'var(--green)',
      checkedIn:false,logDone:false,tasksDone:0,tasksTotal:8,tasks:[]
    }));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px}
.member-card{}.m-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.m-left{display:flex;align-items:center;gap:8px}.m-avatar{width:36px;height:36px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0}
.m-name{font-size:14px;font-weight:700}.m-role{font-size:11px;color:var(--text3)}
.m-right{display:flex;gap:4px}
.m-tasks{margin-top:8px}.task-item{font-size:12px;padding:3px 0;color:var(--text2)}.task-item.done{color:var(--text3);text-decoration:line-through}
</style>