<template>
  <div>
    <PageHeader title="案件管理" :subtitle="`共 ${total} 件案件`">
      <template #actions>
        <button class="btn btn-primary" @click="$router.push('/cases/new')">+ 建立案件</button>
      </template>
    </PageHeader>

    <!-- 統計 -->
    <div class="stat-grid">
      <StatCard label="進行中" :value="stats.active" color="var(--blue)" />
      <StatCard label="合約總額" :value="'$' + formatM(stats.contract) + '萬'" color="var(--black)" />
      <StatCard label="已收款" :value="'$' + formatM(stats.collected) + '萬'" color="var(--green)" />
      <StatCard label="待收款" :value="'$' + formatM(stats.pending) + '萬'" color="var(--red)" />
    </div>

    <!-- 階段漏斗 -->
    <div class="stage-bar">
      <div v-for="s in stageList" :key="s.name" class="stage-item"
           :class="{ active: filter.stage === s.name }"
           @click="filter.stage = filter.stage === s.name ? '' : s.name; load()">
        <span class="stage-count mono">{{ s.count }}</span>
        <span class="stage-name">{{ s.name }}</span>
      </div>
    </div>

    <!-- 篩選 -->
    <div class="filter-row">
      <select v-model="filter.health" @change="load" class="f-select">
        <option value="">全部健康度</option>
        <option value="green">🟢 正常</option>
        <option value="yellow">🟡 警示</option>
        <option value="red">🔴 異常</option>
      </select>
      <select v-model="filter.store_id" @change="load" class="f-select" v-if="isManager">
        <option value="">全部門市</option>
        <option v-for="s in stores" :key="s.store" :value="s.store">{{ s.store }}</option>
      </select>
      <input v-model="filter.search" @input="debounceLoad" class="f-input" placeholder="搜尋案件號/客戶/地址..." />
    </div>

    <!-- 案件列表 -->
    <div v-for="c in cases" :key="c.id" class="case-card" @click="$router.push('/cases/' + c.id)">
      <div class="case-top">
        <div>
          <div class="case-title">
            <span class="health-dot" :style="{ background: healthColor(c.health) }" />
            {{ c.name }}
          </div>
          <div class="case-meta mono">{{ c.case_no }} · {{ c.client_name }} · {{ c.store_name || '' }}</div>
        </div>
        <div class="case-amount">
          <div class="mono" style="font-size:18px;font-weight:800">${{ (c.contract_amount || c.quote_amount || 0).toLocaleString() }}</div>
          <StatusTag :color="stageColor(c.stage)" :label="c.stage" />
        </div>
      </div>

      <!-- 進度條 -->
      <ProgressBar :value="c.progress || 0" :show-pct="false" />

      <div class="case-bottom">
        <span>🎨 {{ c.designer_name || '—' }}</span>
        <span>🔧 {{ c.worker_name || '—' }}</span>
        <span v-if="c.pending > 0" style="color:var(--red)">待收 ${{ c.pending.toLocaleString() }}</span>
        <span v-if="c.est_end_date" class="mono">預計 {{ c.est_end_date }}</span>
      </div>
    </div>

    <div v-if="!cases.length" class="empty">無符合條件的案件</div>

    <!-- 分頁 -->
    <div class="pagination" v-if="totalPages > 1">
      <button v-for="p in totalPages" :key="p" :class="{ active: p === page }" @click="page = p; load()">{{ p }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'

const auth = useAuthStore()
const isManager = computed(() => ['boss','manager','supervisor','designmgr','workmgr'].includes(auth.user?.role))

const cases = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const totalPages = computed(() => Math.ceil(total.value / limit))
const stats = ref({ active: 0, contract: 0, collected: 0, pending: 0 })
const stageList = ref([])
const stores = ref([])
const filter = ref({ stage: '', health: '', store_id: '', search: '' })

let debounceTimer
function debounceLoad() { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 300) }

async function load() {
  try {
    const params = { page: page.value, limit, ...filter.value }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const { data } = await api.get('/cases', { params })
    cases.value = data.data || []
    total.value = data.total || 0
  } catch (e) { console.error(e) }
}

async function loadStats() {
  try {
    const { data } = await api.get('/cases/stats')
    stats.value = data
    stageList.value = (data.byStage || []).map(s => ({ name: s.stage, count: parseInt(s.n) }))
    stores.value = data.byStore || []
  } catch (e) { console.error(e) }
}

function formatM(n) { return ((n || 0) / 10000).toFixed(1) }
function healthColor(h) { return h === 'red' ? 'var(--red)' : h === 'yellow' ? 'var(--orange)' : 'var(--green)' }
function stageColor(s) {
  const map = { '名單建立':'gray','丈量完成':'blue','提案報價':'orange','成功簽約':'green','設計深化':'blue','發包施工':'purple','驗收請款':'orange','結案評分':'green' }
  return map[s] || 'gray'
}

onMounted(() => { load(); loadStats() })
</script>

<style scoped>
.stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 16px; }
.stage-bar { display: flex; gap: 4px; margin-bottom: 16px; overflow-x: auto; scrollbar-width: none; }
.stage-item { padding: 6px 12px; border-radius: 8px; background: var(--bg2); border: 1.5px solid var(--border); cursor: pointer; text-align: center; flex-shrink: 0; transition: all .15s; }
.stage-item:hover, .stage-item.active { border-color: var(--black); background: var(--black); color: #fff; }
.stage-item.active .stage-count { color: #fff; }
.stage-count { font-size: 16px; font-weight: 800; display: block; }
.stage-name { font-size: 10px; color: var(--text3); }
.stage-item.active .stage-name { color: rgba(255,255,255,.6); }
.filter-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.f-select, .f-input { padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 12px; background: var(--bg2); outline: none; font-family: var(--font-sans); }
.f-input { flex: 1; min-width: 150px; }
.case-card { background: var(--bg2); border: 1.5px solid var(--border); border-radius: 10px; padding: 14px 16px; margin-bottom: 8px; cursor: pointer; transition: border-color .15s; }
.case-card:hover { border-color: var(--black); }
.case-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.case-title { font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
.case-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }
.case-amount { text-align: right; }
.health-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.case-bottom { display: flex; gap: 12px; font-size: 11px; color: var(--text3); margin-top: 6px; }
.empty { text-align: center; padding: 40px; color: var(--text3); font-size: 13px; }
.pagination { display: flex; gap: 4px; justify-content: center; margin-top: 16px; }
.pagination button { width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg2); cursor: pointer; font-size: 12px; }
.pagination button.active { background: var(--black); color: #fff; border-color: var(--black); }
.btn { padding: 8px 16px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--bg); cursor: pointer; font-size: 12px; font-family: var(--font-sans); }
.btn-primary { background: var(--black); color: #fff; border-color: var(--black); }
@media (max-width: 768px) { .stat-grid { grid-template-columns: repeat(2,1fr); } }
</style>
