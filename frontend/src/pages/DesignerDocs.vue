<template>
  <div>
    <PageHeader title="圖面文件" subtitle="施工圖 · 合約 · 報價單 · 版本管理" />
    <FileUploader accept="image/*,.pdf,.dwg" label="上傳圖面/文件" @upload="onUpload" />
    <div class="doc-grid">
      <div class="doc-card" v-for="d in docs" :key="d.id">
        <div class="doc-icon">{{ d.icon }}</div>
        <div class="doc-name">{{ d.name }}</div>
        <div class="doc-meta">{{ d.case }} · {{ d.date }} · {{ d.size }}</div>
        <StatusTag :color="d.status==='使用中'?'green':d.status==='已簽署'?'green':'gray'" :label="d.status" />
      </div>
    </div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import FileUploader from "@/components/common/FileUploader.vue"
import StatusTag from "@/components/common/StatusTag.vue"
const docs = ref([
  // TODO: load from API /api/upload
 
  {id:1,name:"TM-2026-047 施工圖（最終版）",case:"大安張宅",date:"03/05",size:"8.2MB",status:"使用中",icon:"📐"},
  {id:2,name:"TM-2026-047 合約書",case:"大安張宅",date:"02/10",size:"1.1MB",status:"已簽署",icon:"📝"},
  {id:3,name:"Q-2026-047 報價單 v3",case:"大安張宅",date:"03/08",size:"0.8MB",status:"已核准",icon:"💰"},
  {id:4,name:"TM-2026-043 施工圖 v2",case:"信義李宅",date:"02/20",size:"6.5MB",status:"使用中",icon:"📐"},
])
function onUpload(files){alert("已上傳 "+files.length+" 個檔案")}
onMounted(async () => {
  try {
    const {data} = await api.get("/upload");
    docs.value = (data.data||[]).map(d=>({id:d.id,name:d.name,case:d.case_name||"",date:d.created_at?.slice(5,10)||"",size:(d.size>1048576?(d.size/1048576).toFixed(1)+"MB":Math.round(d.size/1024)+"KB"),status:d.type==="document"?"使用中":"上傳",icon:d.type==="photo"?"📷":"📄"}));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.doc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px}
.doc-card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:12px;cursor:pointer;transition:border-color .15s}.doc-card:hover{border-color:var(--black)}
.doc-icon{font-size:28px;margin-bottom:6px}.doc-name{font-size:12px;font-weight:600;margin-bottom:2px}.doc-meta{font-size:10px;color:var(--text3);margin-bottom:4px}
@media(max-width:768px){.doc-grid{grid-template-columns:1fr}}
</style>