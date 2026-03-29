<template>
  <div>
    <PageHeader title="客戶聯繫" subtitle="追蹤所有客戶溝通狀態" />
    <div class="stat-row">
      <StatCard label="待回覆" :value="contacts.filter(c=>!c.replied).length" color="var(--red)" />
      <StatCard label="本週聯繫" :value="contacts.filter(c=>c.replied).length" color="var(--green)" />
      <StatCard label="總客戶" :value="contacts.length" />
    </div>
    <div class="card" v-for="c in contacts" :key="c.id">
      <div class="c-row">
        <div class="c-avatar" :style="{background:c.replied?'var(--green)':'var(--red)'}">{{ c.name[0] }}</div>
        <div class="c-info">
          <div class="c-name">{{ c.name }}</div>
          <div class="c-case mono">{{ c.case }} · {{ c.nextAction }}</div>
          <div class="c-last">上次聯繫：{{ c.lastContact }}</div>
        </div>
        <div class="c-actions">
          <button class="btn btn-sm" @click="call(c)">📞</button>
          <button class="btn btn-sm" @click="line(c)">💬</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
const contacts = ref([
  // TODO: load from API /api/leads + /api/cases
 
  {id:1,name:"張先生",case:"TM-2026-047 大安張宅",phone:"0912-345-678",lastContact:"03/27",nextAction:"確認追加減",replied:true},
  {id:2,name:"李先生",case:"TM-2026-043 信義李宅",phone:"0923-456-789",lastContact:"03/25",nextAction:"確認磁磚花色",replied:false},
  {id:3,name:"林小姐",case:"L-2026-107",phone:"0934-567-890",lastContact:"03/24",nextAction:"約丈量時間",replied:false},
  {id:4,name:"吳先生",case:"L-2026-106",phone:"0945-678-901",lastContact:"03/22",nextAction:"送出報價單",replied:false},
])
function call(c){alert("撥打 "+c.phone)}
function line(c){alert("開啟 LINE 聯繫 "+c.name)}
onMounted(async () => {
  try {
    const {data} = await api.get("/leads",{params:{limit:20}});
    contacts.value = (data.data||[]).map(l=>({id:l.id,name:l.name,case:l.lead_no+" "+(l.district||""),phone:l.phone||"",lastContact:l.updated_at?.slice(5,10)||"",nextAction:l.note||"跟進",replied:l.status!=="未處理"}));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:8px}
.c-row{display:flex;align-items:center;gap:10px}
.c-avatar{width:36px;height:36px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}
.c-info{flex:1}.c-name{font-size:14px;font-weight:600}.c-case{font-size:11px;color:var(--text3);margin-top:1px}.c-last{font-size:10px;color:var(--text3)}
.c-actions{display:flex;gap:4px}
.btn{padding:6px 10px;border:1.5px solid var(--border);border-radius:6px;background:var(--bg);cursor:pointer;font-size:14px}.btn-sm{padding:5px 8px}
</style>