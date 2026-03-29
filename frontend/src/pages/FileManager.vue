<template>
  <div>
    <PageHeader title="檔案管理" :subtitle="totalFiles + ' 個檔案 · ' + usedMB + ' MB'" />
    <div class="stat-row">
      <StatCard label="照片" :value="photos.length" color="var(--blue)" />
      <StatCard label="文件" :value="documents.length" color="var(--black)" />
      <StatCard label="簽名" :value="signatures.length" color="var(--green)" />
    </div>

    <div class="upload-row">
      <FileUploader accept="image/*" label="📷 上傳照片" @upload="onUpload" />
      <FileUploader accept=".pdf,.doc,.docx" label="📄 上傳文件" @upload="onUpload" />
    </div>

    <div class="tab-bar"><button v-for="t in tabs" :key="t.id" :class="{active:tab===t.id}" @click="tab=t.id">{{ t.label }}</button></div>

    <div v-for="f in currentFiles" :key="f.id" class="file-row">
      <div class="file-icon">{{ f.icon }}</div>
      <div class="file-info">
        <div class="file-name">{{ f.name }}</div>
        <div class="file-meta">{{ f.category }} · {{ f.case_name }} · {{ f.date }}</div>
      </div>
      <div class="file-right">
        <div class="mono file-size">{{ f.sizeStr }}</div>
        <button class="btn btn-sm" @click="downloadFile(f)">⬇</button>
      </div>
    </div>
    <div v-if="!currentFiles.length" class="empty">無檔案</div>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, computed, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatCard from "@/components/common/StatCard.vue"
import FileUploader from "@/components/common/FileUploader.vue"
const tab = ref("all")
const tabs = [{id:"all",label:"📁 全部"},{id:"photo",label:"📷 照片"},{id:"doc",label:"📄 文件"}]
const files = ref([
  // TODO: load from API /api/upload
 
  {id:1,name:"天花板完工.jpg",type:"photo",icon:"📷",category:"施工照片",case_name:"大安張宅",date:"03/27",size:1240000},
  {id:2,name:"衣櫃骨架.jpg",type:"photo",icon:"📷",category:"施工照片",case_name:"大安張宅",date:"03/27",size:980000},
  {id:3,name:"巡查全景.jpg",type:"photo",icon:"📷",category:"巡查照片",case_name:"大安張宅",date:"03/25",size:1560000},
  {id:4,name:"簽名_張先生.png",type:"signature",icon:"✍",category:"電子簽章",case_name:"大安張宅",date:"03/08",size:45000},
  {id:5,name:"工程合約.pdf",type:"doc",icon:"📄",category:"合約文件",case_name:"大安張宅",date:"02/10",size:1200000},
  {id:6,name:"報價單v3.pdf",type:"doc",icon:"💰",category:"報價單",case_name:"大安張宅",date:"03/08",size:800000},
])
files.value.forEach(f=>{f.sizeStr=f.size>1048576?(f.size/1048576).toFixed(1)+"MB":Math.round(f.size/1024)+"KB"})
const photos = computed(()=>files.value.filter(f=>f.type==="photo"))
const documents = computed(()=>files.value.filter(f=>f.type==="doc"))
const signatures = computed(()=>files.value.filter(f=>f.type==="signature"))
const totalFiles = computed(()=>files.value.length)
const usedMB = computed(()=>(files.value.reduce((s,f)=>s+f.size,0)/1048576).toFixed(1))
const currentFiles = computed(()=>tab.value==="photo"?photos.value:tab.value==="doc"?[...documents.value,...signatures.value]:files.value)
function onUpload(fs){alert("已上傳 "+fs.length+" 個檔案")}
function downloadFile(f){alert("下載："+f.name)}
onMounted(async () => {
  try {
    const {data} = await api.get("/upload");
    files.value = (data.data||[]).map(d=>({
      id:d.id,name:d.name,type:d.type==="photo"?"photo":d.type==="document"?"doc":"signature",
      icon:d.type==="photo"?"📷":d.type==="document"?"📄":"✍",
      category:d.category||"其他",case_name:"",date:d.created_at?.slice(5,10)||"",size:d.size||0,
      sizeStr:d.size>1048576?(d.size/1048576).toFixed(1)+"MB":Math.round((d.size||0)/1024)+"KB"
    }));
  } catch(e){console.error(e)}
})
</script>
<style scoped>
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.upload-row{display:flex;gap:8px;margin-bottom:14px}
.tab-bar{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:14px}.tab-bar button{padding:8px 14px;border:none;background:transparent;font-size:12px;color:var(--text3);border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;font-family:var(--font-sans)}.tab-bar button.active{font-weight:700;color:var(--text);border-bottom-color:var(--text)}
.file-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}
.file-icon{width:36px;height:36px;background:var(--bg3);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.file-info{flex:1;min-width:0}.file-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.file-meta{font-size:10px;color:var(--text3)}
.file-right{display:flex;align-items:center;gap:8px}.file-size{font-size:11px;color:var(--text3)}
.empty{text-align:center;padding:30px;color:var(--text3);font-size:12px}
.btn{padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;background:var(--bg);cursor:pointer;font-size:11px}.btn-sm{padding:4px 8px}
</style>