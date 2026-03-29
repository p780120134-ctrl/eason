<template>
  <div>
    <PageHeader title="丈量預約" subtitle="預約管理 · 行程安排" />
    <div class="tab-bar"><button v-for="t in tabs" :key="t" :class="{active:tab===t}" @click="tab=t">{{ t }}</button></div>

    <div v-if="tab==='待丈量'">
      <div class="card" v-for="m in pending" :key="m.id">
        <div class="m-row">
          <div><div class="m-name">{{ m.client }} · {{ m.district }}</div>
          <div class="m-sub mono">{{ m.case_no }} · {{ m.area }}坪 · {{ m.house_type }}</div></div>
          <div class="m-right">
            <div class="m-date" v-if="m.date">{{ m.date }} {{ m.time }}</div>
            <StatusTag v-if="m.date" color="blue" label="已約" />
            <StatusTag v-else color="red" label="未約" />
          </div>
        </div>
        <div class="m-actions">
          <button class="btn btn-sm btn-primary" v-if="!m.date" @click="bookMeasure(m)">排定日期</button>
          <button class="btn btn-sm" @click="m.showDetail=!m.showDetail">準備清單</button>
        </div>
        <div v-if="m.showDetail" class="prep-list">
          <div v-for="p in prepItems" :key="p" class="prep-item">☐ {{ p }}</div>
        </div>
      </div>
    </div>

    <div v-if="tab==='已完成'">
      <div class="card" v-for="m in completed" :key="m.id">
        <div class="m-row"><div><div class="m-name">{{ m.client }} · {{ m.district }}</div><div class="m-sub mono">{{ m.date }}</div></div>
        <StatusTag color="green" label="已丈量" /></div>
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatusTag from "@/components/common/StatusTag.vue"
const tab = ref("待丈量")
const tabs = ["待丈量","已完成"]
const pending = ref([
  // TODO: load from API /api/leads?status=已聯繫
 
  {id:1,client:"陳先生",district:"信義區",case_no:"L-2026-108",area:"31-40",house_type:"全新屋",date:null,time:null,showDetail:false},
  {id:2,client:"林小姐",district:"板橋區",case_no:"L-2026-107",area:"21-30",house_type:"中古屋",date:"03/30",time:"14:00",showDetail:false},
])
const completed = ref([
  {id:3,client:"吳先生",district:"大安區",date:"03/25"},
  {id:4,client:"黃先生",district:"松山區",date:"03/22"},
])
const prepItems = ["捲尺（雷射+手動）","平板/紙筆記錄","相機/手機拍照","鞋套","名片","公司簡介","相似案例3-5個"]
function bookMeasure(m){
  const date = prompt("請輸入丈量日期（MM/DD）：","03/31")
  const time = prompt("請輸入時間：","10:00")
  if(date && time){ m.date=date; m.time=time }
}
onMounted(async () => {
  try {
    const {data} = await api.get("/leads",{params:{status:"已聯繫",limit:20}});
    pending.value = (data.data||[]).map(l=>({id:l.id,client:l.name,district:l.district,case_no:l.lead_no,area:l.area||"",house_type:l.house_type||"",date:null,time:null,showDetail:false}));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.tab-bar{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:14px}.tab-bar button{padding:8px 14px;border:none;background:transparent;font-size:12px;font-weight:400;color:var(--text3);border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;font-family:var(--font-sans)}.tab-bar button.active{font-weight:700;color:var(--text);border-bottom-color:var(--text)}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px}
.m-row{display:flex;justify-content:space-between;align-items:center}
.m-name{font-size:14px;font-weight:600}.m-sub{font-size:11px;color:var(--text3);margin-top:2px}
.m-right{text-align:right}.m-date{font-size:12px;font-weight:600;margin-bottom:2px}
.m-actions{display:flex;gap:6px;margin-top:8px}
.prep-list{margin-top:8px;padding:8px;background:var(--bg3);border-radius:6px}.prep-item{font-size:11px;padding:2px 0}
.btn{padding:6px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:11px;font-family:var(--font-sans)}.btn-primary{background:var(--black);color:#fff;border-color:var(--black)}.btn-sm{padding:5px 12px}
</style>