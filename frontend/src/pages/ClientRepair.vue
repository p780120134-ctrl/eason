<template>
  <div>
    <PageHeader title="售後報修" subtitle="保固期內免費 · 照片加速派工" />
    <div class="tab-bar"><button v-for="t in tabs" :key="t.id" :class="{active:tab===t.id}" @click="tab=t.id">{{ t.label }}</button></div>

    <template v-if="tab==='list'">
      <div class="card" v-for="w in workOrders" :key="w.id" :style="{borderLeft:'3px solid '+(w.status==='處理中'?'var(--blue)':w.status==='已完成'?'var(--green)':'var(--red)')}">
        <div class="w-top"><div><div class="w-issue">{{ w.issue }}</div><div class="w-sub mono">{{ w.wo_no }} · {{ w.type }}</div></div>
        <StatusTag :color="w.status==='已完成'?'green':w.status==='處理中'?'blue':'red'" :label="w.status" /></div>
        <Timeline :items="w.timeline" />
        <div class="w-actions" v-if="w.status==='處理中'"><button class="btn btn-sm" @click="contactCS">💬 聯繫客服</button></div>
        <div v-if="w.status==='已完成'&&!w.rated" class="w-rate"><button class="btn btn-sm btn-primary" @click="rateRepair(w)">⭐ 給評分</button></div>
        <div v-if="w.rated" class="w-rated">✓ 已評 {{ w.score }} ★</div>
      </div>
    </template>

    <template v-if="tab==='new'">
      <div class="card">
        <div class="card-title">📋 報修申請</div>
        <div class="field"><label>問題類型 *</label>
          <div class="type-grid">
            <div v-for="t in issueTypes" :key="t" class="type-item" :class="{selected:form.type===t}" @click="form.type=t">{{ t }}</div>
          </div>
        </div>
        <div class="field"><label>問題說明 *</label><textarea v-model="form.desc" rows="3" placeholder="請描述問題位置與狀況"></textarea></div>
        <div class="field"><label>照片/影片</label>
          <FileUploader accept="image/*,video/*" label="📷 上傳照片" @upload="onUpload" />
        </div>
        <div class="field"><label>緊急程度</label>
          <div class="urgency-grid">
            <div v-for="u in urgencies" :key="u[0]" class="urgency-item" :class="{selected:form.urgency===u[0]}" @click="form.urgency=u[0]">
              <div class="u-label">{{ u[0] }}</div><div class="u-desc">{{ u[1] }}</div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" @click="submitRepair" :disabled="!form.type||!form.desc">送出報修申請</button>
      </div>
    </template>
  </div>
</template>
<script setup>
import api from "@/utils/api"
import { ref, onMounted } from "vue"
import PageHeader from "@/components/common/PageHeader.vue"
import StatusTag from "@/components/common/StatusTag.vue"
import Timeline from "@/components/common/Timeline.vue"
import FileUploader from "@/components/common/FileUploader.vue"
const tab = ref("list")
const tabs = [{id:"list",label:"📋 我的工單"},{id:"new",label:"+ 新增報修"}]
const workOrders = ref([
  // TODO: load from API /api/cases (complaints)
 
  {id:1,wo_no:"WO-2026-031",issue:"浴室矽利康龜裂",type:"保固內",status:"處理中",rated:false,score:0,
   timeline:[{title:"申請報修",sub:"03/10",done:true},{title:"客服確認",sub:"03/10",done:true},{title:"安排派工",sub:"03/10",done:true},{title:"師傅到府",sub:"03/30(預約)",done:false,active:true},{title:"完工確認",done:false}]},
  {id:2,wo_no:"WO-2025-118",issue:"廚房燈具更換",type:"點數兌換",status:"已完成",rated:true,score:5,
   timeline:[{title:"申請",done:true},{title:"確認",done:true},{title:"派工",done:true},{title:"完成",done:true}]},
])
const form = ref({type:"",desc:"",urgency:"一般"})
const issueTypes = ["矽利康龜裂","油漆剝落","門窗異常","漏水問題","燈具異常","其他"]
const urgencies = [["一般","不影響日常"],["較緊急","影響部分功能"],["非常緊急","需立即處理"]]
function submitRepair(){alert("✅ 報修已送出！\n\nAI 判斷：矽利康/泥作工種\n客服將於 1 小時內回覆")}
function contactCS(){alert("開啟客服對話")}
function rateRepair(w){w.rated=true;w.score=5;alert("感謝評分！")}
function onUpload(files){alert("已上傳 "+files.length+" 個檔案")}
onMounted(async () => {
  // TODO: load from complaints API
})
</script>
<style scoped>
.tab-bar{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:14px}.tab-bar button{padding:8px 14px;border:none;background:transparent;font-size:12px;color:var(--text3);border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;font-family:var(--font-sans)}.tab-bar button.active{font-weight:700;color:var(--text);border-bottom-color:var(--text)}
.card{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px}.card-title{font-size:13px;font-weight:600;margin-bottom:10px}
.w-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}.w-issue{font-size:14px;font-weight:700}.w-sub{font-size:11px;color:var(--text3)}
.w-actions,.w-rate{margin-top:8px}.w-rated{font-size:11px;color:var(--green);margin-top:4px}
.field{margin-bottom:14px}.field label{display:block;font-size:12px;color:var(--text2);margin-bottom:5px;font-weight:500}
.field textarea{width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;outline:none;resize:none;font-family:var(--font-sans);background:var(--bg3)}
.type-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.type-item{padding:8px;text-align:center;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;font-size:12px;background:var(--bg3);transition:all .15s}
.type-item.selected{border-color:var(--black);background:var(--black);color:#fff}
.urgency-grid{display:flex;gap:8px}.urgency-item{flex:1;padding:8px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;text-align:center;transition:all .15s}
.urgency-item.selected{border-color:var(--black);background:rgba(10,10,10,.04)}.u-label{font-size:12px;font-weight:600}.u-desc{font-size:10px;color:var(--text3)}
.btn{padding:14px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font-sans);width:100%}.btn-primary{background:var(--black);color:#fff}.btn-sm{padding:8px 14px;font-size:12px;width:auto;border:1.5px solid var(--border);border-radius:8px;background:var(--bg)}
.btn:disabled{opacity:.4;cursor:not-allowed}
</style>