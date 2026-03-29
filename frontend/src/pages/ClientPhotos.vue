<template>
  <div>
    <PageHeader title="施工照片" subtitle="每日施工紀錄 · 由設計師審核後顯示" />
    <div class="stat-row">
      <StatCard label="照片總數" :value="allPhotos.length" color="var(--black)" />
      <StatCard label="施工天數" :value="dates.length" color="var(--blue)" />
    </div>
    <div class="card" v-for="d in dates" :key="d.date">
      <div class="card-title">{{ d.date }} · {{ d.stage }}</div>
      <PhotoWall :photos="d.photos" :cols="4" @preview="previewPhoto" />
    </div>
    <div v-if="!dates.length" class="empty">照片審核後將顯示在這裡</div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, computed, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
import PhotoWall from "@/components/common/PhotoWall.vue"
const allPhotos = ref([
  // TODO: load from API /api/upload?case_id=X&type=photo
 
  {url:"",thumb:"📷",desc:"天花板完工",date:"03/27",stage:"木作"},
  {url:"",thumb:"📷",desc:"衣櫃安裝",date:"03/27",stage:"木作"},
  {url:"",thumb:"📷",desc:"油漆底漆",date:"03/27",stage:"木作"},
  {url:"",thumb:"📷",desc:"水電完成",date:"03/25",stage:"水電"},
  {url:"",thumb:"📷",desc:"泥作壁磚",date:"03/22",stage:"泥作"},
])
const dates = computed(()=>{
  const groups={}
  allPhotos.value.forEach(p=>{if(!groups[p.date])groups[p.date]={date:p.date,stage:p.stage,photos:[]};groups[p.date].photos.push(p)})
  return Object.values(groups).sort((a,b)=>b.date.localeCompare(a.date))
})
function previewPhoto(i){alert("預覽照片 #"+i)}
onMounted(async () => {
  try {
    const {data} = await api.get("/upload",{params:{type:"photo"}});
    allPhotos.value = (data.data||[]).map(d=>({url:d.url||"",thumb:"📷",desc:d.name,date:d.created_at?.slice(5,10)||"",stage:d.category||"施工"}));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}.card-title{font-size:13px;font-weight:700;margin-bottom:8px}
.empty{text-align:center;padding:30px;color:var(--text3)}
</style>