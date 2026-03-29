<template>
  <div>
    <PageHeader title="設計師工作台" :subtitle="user?.name + ' · ' + today">
      <template #actions><StatusTag color="green" :label="'Lv' + gp.level" /></template>
    </PageHeader>

    <!-- 快捷入口 -->
    <div class="quick-grid">
      <div class="quick-item" v-for="q in quickLinks" :key="q.path" @click="$router.push(q.path)">
        <span class="quick-icon">{{ q.icon }}</span>
        <span class="quick-label">{{ q.label }}</span>
        <span class="quick-badge" v-if="q.badge">{{ q.badge }}</span>
      </div>
    </div>

    <!-- 我的案件摘要 -->
    <div class="card">
      <div class="card-title">📁 我的案件</div>
      <div v-for="c in myCases" :key="c.id" class="case-row" @click="$router.push('/cases/'+c.id)">
        <div><div class="case-name">{{ c.name }}</div><div class="case-sub mono">{{ c.case_no }} · {{ c.stage }}</div></div>
        <ProgressBar :value="c.progress" :show-pct="true" style="width:80px;margin:0" />
      </div>
      <div v-if="!myCases.length" class="empty">無進行中案件</div>
    </div>

    <!-- 今日待辦 -->
    <div class="card">
      <div class="card-title">⚡ 今日待辦</div>
      <div v-for="t in todos" :key="t.id" class="todo-row">
        <input type="checkbox" :checked="t.done" @change="toggleTodo(t)" />
        <span :class="{done:t.done}">{{ t.text }}</span>
        <span class="mono todo-gp">+{{ t.gp }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue"
import api from "@/utils/api"
import { useAuthStore } from "@/stores/auth"
import PageHeader from "@/components/common/PageHeader.vue"
import StatusTag from "@/components/common/StatusTag.vue"
import ProgressBar from "@/components/common/ProgressBar.vue"

const auth = useAuthStore()
const user = computed(() => auth.user)
const today = new Date().toLocaleDateString("zh-TW",{month:"long",day:"numeric",weekday:"short"})
const gp = ref({level:3,total:694})
const myCases = ref([])
const quickLinks = [
  {icon:"📐",label:"丈量預約",path:"/designer/measure",badge:""},
  {icon:"👥",label:"客戶聯繫",path:"/designer/contacts",badge:"3"},
  {icon:"💰",label:"報價系統",path:"/designer/quote",badge:""},
  {icon:"📁",label:"圖面文件",path:"/designer/docs",badge:"2"},
  {icon:"🤝",label:"談約流程",path:"/designer/negotiate",badge:"1"},
  {icon:"💳",label:"請款節點",path:"/designer/payments",badge:""},
  {icon:"📊",label:"我的KPI",path:"/designer/kpi",badge:""},
  {icon:"🎨",label:"AI風格",path:"/designer/style",badge:""},
]
const todos = ref([
  {id:1,text:"回覆張先生 LINE",gp:5,done:false},
  {id:2,text:"上傳大安張宅丈量照片",gp:3,done:true},
  {id:3,text:"完成中山林宅報價單",gp:8,done:false},
  {id:4,text:"工地巡查 · NFC打卡",gp:15,done:false},
])
function toggleTodo(t){t.done=!t.done}
onMounted(async()=>{
  try{ const {data}=await api.get("/cases",{params:{limit:5}}); myCases.value=data.data||[] }catch(e){}
})
</script>
<style scoped>
.quick-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
.quick-item{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px 8px;text-align:center;cursor:pointer;transition:border-color .15s;position:relative}
.quick-item:hover{border-color:var(--black)}
.quick-icon{font-size:24px;display:block;margin-bottom:4px}
.quick-label{font-size:11px;color:var(--text2)}
.quick-badge{position:absolute;top:6px;right:8px;background:var(--red);color:#fff;font-size:9px;padding:1px 5px;border-radius:8px;font-weight:700}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}
.card-title{font-size:13px;font-weight:600;margin-bottom:10px}
.case-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer}
.case-name{font-size:13px;font-weight:600}
.case-sub{font-size:10px;color:var(--text3)}
.todo-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px}
.todo-row .done{text-decoration:line-through;color:var(--text3)}
.todo-gp{margin-left:auto;color:var(--green);font-weight:600;font-size:11px}
.empty{text-align:center;padding:16px;color:var(--text3);font-size:12px}
@media(max-width:768px){.quick-grid{grid-template-columns:repeat(4,1fr);gap:6px}.quick-item{padding:10px 4px}.quick-icon{font-size:20px}}
</style>