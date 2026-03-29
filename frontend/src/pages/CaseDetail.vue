<template>
  <div v-if="c">
    <!-- 標題列 -->
    <div class="detail-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <div class="detail-title">
        <span class="health-dot" :style="{ background: healthColor(c.health) }" />
        <h1>{{ c.name }}</h1>
        <StatusTag :color="stageColor(c.stage)" :label="c.stage" size="md" />
      </div>
      <div class="detail-meta mono">{{ c.case_no }} · {{ c.client_name }} · {{ c.store_name }}</div>
    </div>

    <!-- Tab 導覽 -->
    <div class="tab-bar">
      <button v-for="t in tabs" :key="t.id" :class="{ active: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
    </div>

    <!-- ═══ Tab 1：總覽 ═══ -->
    <div v-if="tab === 'overview'">
      <!-- 金額統計 -->
      <div class="stat-grid-4">
        <StatCard label="合約金額" :value="'$' + fmt(c.contract_amount || c.quote_amount)" color="var(--black)" />
        <StatCard label="已收款" :value="'$' + fmt(c.collected)" color="var(--green)" />
        <StatCard label="待收款" :value="'$' + fmt(c.pending)" :color="c.pending > 0 ? 'var(--red)' : 'var(--text3)'" />
        <StatCard label="進度" :value="c.progress + '%'" color="var(--blue)" />
      </div>

      <!-- 進度條 + 階段推進 -->
      <div class="card">
        <div class="card-title">📋 案件階段</div>
        <Timeline :items="stageTimeline" />
        <div class="stage-actions" v-if="canEdit">
          <button class="btn btn-primary btn-sm" @click="advanceStage" v-if="nextStage">推進至「{{ nextStage }}」</button>
        </div>
      </div>

      <!-- 負責人 -->
      <div class="card">
        <div class="card-title">👥 負責人</div>
        <div class="people-grid">
          <div class="person-card" v-for="p in people" :key="p.role">
            <div class="person-avatar" :style="{ background: p.color }">{{ p.initial }}</div>
            <div><div class="person-name">{{ p.name || '未指派' }}</div><div class="person-role">{{ p.role }}</div></div>
          </div>
        </div>
      </div>

      <!-- 基本資訊 -->
      <div class="card">
        <div class="card-title">📐 基本資訊</div>
        <div class="info-grid">
          <div class="info-item" v-for="f in infoFields" :key="f.label">
            <div class="info-label">{{ f.label }}</div>
            <div class="info-value">{{ f.value || '—' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Tab 2：付款 ═══ -->
    <div v-if="tab === 'payments'">
      <div class="card" v-for="p in c.payments" :key="p.id">
        <div class="payment-row">
          <div>
            <div class="payment-name">{{ p.name }}</div>
            <div class="payment-meta">{{ p.due_date || '待定' }} · {{ p.percentage }}%</div>
          </div>
          <div class="payment-right">
            <div class="mono payment-amount">${{ (p.amount || 0).toLocaleString() }}</div>
            <StatusTag :color="p.received ? 'green' : 'red'" :label="p.received ? '已收款' : '待收款'" />
          </div>
        </div>
        <button v-if="!p.received && canEdit" class="btn btn-sm btn-primary" style="margin-top:8px" @click="confirmPayment(p)">✓ 確認收款</button>
      </div>
      <div v-if="!c.payments?.length" class="empty">尚無付款節點</div>
    </div>

    <!-- ═══ Tab 3：追加減 ═══ -->
    <div v-if="tab === 'addons'">
      <div class="card" v-for="a in c.addons" :key="a.id">
        <div class="addon-row">
          <div>
            <StatusTag :color="a.type === '追加' ? 'blue' : 'orange'" :label="a.type" />
            <span class="addon-item">{{ a.item }}</span>
          </div>
          <div class="mono addon-amount" :style="{ color: a.amount >= 0 ? 'var(--red)' : 'var(--green)' }">
            {{ a.amount >= 0 ? '+' : '' }}${{ Math.abs(a.amount).toLocaleString() }}
          </div>
        </div>
        <div class="addon-reason" v-if="a.reason">{{ a.reason }}</div>
        <StatusTag :color="a.status === '已確認' ? 'green' : a.status === '已拒絕' ? 'red' : 'gray'" :label="a.status" />
      </div>
      <button v-if="canEdit" class="btn btn-primary" @click="showAddonForm = true" style="width:100%;margin-top:8px">+ 新增追加減</button>
    </div>

    <!-- ═══ Tab 4：文件 ═══ -->
    <div v-if="tab === 'docs'">
      <FileUploader accept="image/*,.pdf" label="上傳文件" @upload="onUpload" />
      <div class="doc-list">
        <div v-for="d in docs" :key="d.id" class="doc-item">
          <span class="doc-icon">{{ d.file_type === 'pdf' ? '📄' : '📷' }}</span>
          <div class="doc-info">
            <div class="doc-name">{{ d.name }}</div>
            <div class="doc-meta">{{ d.category }} · {{ d.created_at }}</div>
          </div>
          <button class="btn btn-sm" @click="downloadDoc(d)">⬇</button>
        </div>
      </div>
    </div>

    <!-- ═══ Tab 5：評分 ═══ -->
    <div v-if="tab === 'ratings'">
      <div v-for="r in c.ratings" :key="r.id" class="card" style="border-left:3px solid var(--green)">
        <div class="rating-row">
          <div>
            <div class="rating-stage">{{ r.stage_label || r.stage }}</div>
            <div class="rating-date">{{ r.rated_at }}</div>
          </div>
          <div class="rating-score mono">{{ r.rating }} ★</div>
        </div>
        <div class="rating-comment" v-if="r.comment">💬 {{ r.comment }}</div>
      </div>
      <div v-if="!c.ratings?.length" class="empty">尚無客戶評分</div>
    </div>

    <!-- ═══ Tab 6：紀錄 ═══ -->
    <div v-if="tab === 'logs'">
      <AuditLog :logs="auditLogs" title="操作紀錄" />
    </div>
  </div>
  <div v-else class="loading">載入中...</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from "@/composables/useToast"
const toast = useToast()
import { useRoute } from 'vue-router'
import api from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import Timeline from '@/components/common/Timeline.vue'
import FileUploader from '@/components/common/FileUploader.vue'
import AuditLog from '@/components/common/AuditLog.vue'

const route = useRoute()
const auth = useAuthStore()
const c = ref(null)
const docs = ref([])
const auditLogs = ref([])
const tab = ref('overview')
const showAddonForm = ref(false)
const addonForm = ref({type:'追加',item:'',reason:'',amount:0})

async function submitAddon() {
  if(!addonForm.value.item||!addonForm.value.amount) return
  try {
    await api.post('/cases/'+route.params.id+'/addons', addonForm.value)
    showAddonForm.value = false
    addonForm.value = {type:'追加',item:'',reason:'',amount:0}
    loadCase()
    toast.success('✅ 追加減已新增')
  } catch(e) { toast.error(e.response?.data?.error||'失敗') }
}

const canEdit = computed(() => auth.hasPermission('cases', 'update'))
const tabs = [
  { id: 'overview', label: '📊 總覽' },
  { id: 'payments', label: '💰 付款' },
  { id: 'addons', label: '📋 追加減' },
  { id: 'docs', label: '📁 文件' },
  { id: 'ratings', label: '⭐ 評分' },
  { id: 'logs', label: '📜 紀錄' },
]

const STAGES = ['名單建立','丈量完成','提案報價','成功簽約','設計深化','發包施工','驗收請款','結案評分']

const stageTimeline = computed(() => {
  if (!c.value) return []
  const current = STAGES.indexOf(c.value.stage)
  return STAGES.map((s, i) => ({
    title: s,
    sub: i <= current ? '✓' : '',
    done: i <= current,
    active: i === current,
  }))
})

const nextStage = computed(() => {
  if (!c.value) return null
  const idx = STAGES.indexOf(c.value.stage)
  return idx < STAGES.length - 1 ? STAGES[idx + 1] : null
})

const people = computed(() => {
  if (!c.value) return []
  return [
    { role: '設計師', name: c.value.designer_name, initial: c.value.designer_name?.[0], color: 'var(--green)' },
    { role: '工務', name: c.value.worker_name, initial: c.value.worker_name?.[0], color: 'var(--black)' },
    { role: '店長', name: c.value.manager_name, initial: c.value.manager_name?.[0], color: 'var(--blue)' },
    { role: '客戶', name: c.value.client_name, initial: c.value.client_name?.[0], color: 'var(--purple)' },
  ]
})

const infoFields = computed(() => {
  if (!c.value) return []
  return [
    { label: '案件編號', value: c.value.case_no },
    { label: '坪數', value: c.value.area ? c.value.area + ' 坪' : '' },
    { label: '屋況', value: c.value.house_type },
    { label: '風格', value: c.value.style },
    { label: '地址', value: c.value.address },
    { label: '簽約日', value: c.value.sign_date },
    { label: '開工日', value: c.value.start_date },
    { label: '預計完工', value: c.value.est_end_date },
    { label: '保固到期', value: c.value.warranty_end },
  ]
})

async function loadCase() {
  const { data } = await api.get('/cases/' + route.params.id)
  c.value = data
}

async function advanceStage() {
  if (!nextStage.value) return
  await api.put('/cases/' + route.params.id + '/stage', { stage: nextStage.value })
  loadCase()
}

async function confirmPayment(p) {
  // TODO: API call
  alert('確認收款：$' + p.amount.toLocaleString())
}

function onUpload(files) { /* TODO: upload to S3 + save to documents */ }
function downloadDoc(d) { window.open(d.url, '_blank') }
function fmt(n) { return ((n || 0) / 10000).toFixed(1) }
function healthColor(h) { return h === 'red' ? 'var(--red)' : h === 'yellow' ? 'var(--orange)' : 'var(--green)' }
function stageColor(s) {
  const map = { '名單建立':'gray','丈量完成':'blue','提案報價':'orange','成功簽約':'green','設計深化':'blue','發包施工':'purple','驗收請款':'orange','結案評分':'green' }
  return map[s] || 'gray'
}

onMounted(loadCase)
</script>

<style scoped>
.detail-header { margin-bottom: 20px; }
.back-btn { background: none; border: none; cursor: pointer; font-size: 13px; color: var(--text3); margin-bottom: 8px; padding: 0; }
.detail-title { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.detail-title h1 { font-size: 22px; font-weight: 800; }
.detail-meta { font-size: 12px; color: var(--text3); }
.health-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

.tab-bar { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 16px; overflow-x: auto; scrollbar-width: none; }
.tab-bar button { padding: 8px 14px; border: none; background: transparent; font-size: 12px; font-weight: 400; color: var(--text3); border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; font-family: var(--font-sans); white-space: nowrap; }
.tab-bar button.active { font-weight: 700; color: var(--text); border-bottom-color: var(--text); }

.stat-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 16px; }
.card { background: var(--bg2); border: 1.5px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 12px; }
.card-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; }

.people-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
.person-card { display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg3); border-radius: 8px; }
.person-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0; }
.person-name { font-size: 12px; font-weight: 600; }
.person-role { font-size: 10px; color: var(--text3); }

.info-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
.info-item { padding: 8px; background: var(--bg3); border-radius: 6px; }
.info-label { font-size: 10px; color: var(--text3); margin-bottom: 2px; }
.info-value { font-size: 13px; font-weight: 500; }

.payment-row { display: flex; justify-content: space-between; align-items: center; }
.payment-name { font-size: 13px; font-weight: 600; }
.payment-meta { font-size: 11px; color: var(--text3); }
.payment-amount { font-size: 16px; font-weight: 700; margin-bottom: 4px; }

.addon-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.addon-item { font-size: 13px; font-weight: 600; margin-left: 6px; }
.addon-amount { font-size: 16px; font-weight: 700; }
.addon-reason { font-size: 11px; color: var(--text2); background: var(--bg3); padding: 6px 8px; border-radius: 6px; margin-bottom: 6px; }

.doc-list { margin-top: 12px; }
.doc-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.doc-icon { font-size: 20px; }
.doc-info { flex: 1; }
.doc-name { font-size: 12px; font-weight: 600; }
.doc-meta { font-size: 10px; color: var(--text3); }

.rating-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.rating-stage { font-size: 13px; font-weight: 600; }
.rating-date { font-size: 10px; color: var(--text3); }
.rating-score { font-size: 20px; font-weight: 800; color: var(--black); }
.rating-comment { font-size: 11px; color: var(--text2); background: var(--bg3); padding: 6px 8px; border-radius: 6px; }

.stage-actions { margin-top: 12px; }
.empty { text-align: center; padding: 30px; color: var(--text3); font-size: 12px; }
.loading { text-align: center; padding: 60px; color: var(--text3); }
.btn { padding: 8px 16px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--bg); cursor: pointer; font-size: 12px; font-family: var(--font-sans); }
.btn-primary { background: var(--black); color: #fff; border-color: var(--black); }
.btn-sm { padding: 5px 12px; font-size: 11px; }

@media (max-width: 768px) {
  .stat-grid-4 { grid-template-columns: repeat(2,1fr); }
  .people-grid { grid-template-columns: repeat(2,1fr); }
  .info-grid { grid-template-columns: 1fr 1fr; }
}
</style>
