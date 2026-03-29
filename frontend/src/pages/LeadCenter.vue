<template>
  <div>
    <PageHeader title="接單中心" subtitle="客戶填單 → 指派設計師 → 轉案件">
      <template #actions>
        <button class="btn btn-primary" @click="showForm = true">+ 新增填單</button>
      </template>
    </PageHeader>

    <!-- 統計 -->
    <div class="stat-grid">
      <StatCard label="今日填單" :value="stats.today" color="var(--blue)" />
      <StatCard label="待處理" :value="stats.unprocessed" color="var(--red)" />
      <StatCard label="未指派" :value="stats.unassigned" color="var(--orange)" />
      <StatCard label="總填單" :value="stats.total" />
    </div>

    <!-- 篩選 -->
    <div class="filter-row">
      <select v-model="filter.status" @change="loadLeads" class="filter-select">
        <option value="">全部狀態</option>
        <option v-for="s in ['未處理','已聯繫','跟進中','已成交','流失']" :key="s" :value="s">{{ s }}</option>
      </select>
      <label class="filter-check">
        <input type="checkbox" v-model="filter.unassigned" @change="loadLeads" /> 僅未指派
      </label>
      <input v-model="filter.search" @input="loadLeads" class="filter-input" placeholder="搜尋姓名/電話/區域..." />
    </div>

    <!-- 列表 -->
    <div v-for="lead in leads" :key="lead.id" class="lead-card" @click="selectLead(lead)">
      <div class="lead-header">
        <div>
          <div class="lead-name">
            <span class="urgency-dot" :style="{ background: urgencyColor(lead.urgency) }" />
            {{ lead.name }} · {{ lead.district }}
          </div>
          <div class="lead-meta mono">{{ lead.lead_no }} · {{ lead.house_type }} · {{ lead.area }} · {{ lead.budget }}</div>
        </div>
        <div class="lead-right">
          <StatusTag v-if="lead.designer_name" color="green" :label="lead.designer_name" />
          <StatusTag v-else color="red" label="未指派" />
        </div>
      </div>
      <div class="lead-actions" v-if="!lead.assigned_to">
        <button class="btn btn-sm btn-primary" @click.stop="openAssign(lead)">指派設計師</button>
        <button class="btn btn-sm" @click.stop="convertToCase(lead)">轉為案件</button>
      </div>
    </div>

    <div v-if="!leads.length" class="empty">暫無填單</div>

    <!-- 新增填單 Modal -->
    <div class="modal-overlay" v-if="showForm" @click.self="showForm = false">
      <div class="modal">
        <h3>新增客戶填單</h3>
        <div class="form-grid">
          <div class="field"><label>姓名 *</label><input v-model="form.name" /></div>
          <div class="field"><label>電話 *</label><input v-model="form.phone" /></div>
          <div class="field"><label>LINE ID</label><input v-model="form.line_id" /></div>
          <div class="field"><label>區域</label><input v-model="form.district" placeholder="大安區" /></div>
          <div class="field"><label>地址</label><input v-model="form.address" /></div>
          <div class="field">
            <label>屋況</label>
            <select v-model="form.house_type">
              <option>全新屋裝潢</option><option>中古屋翻新</option><option>預售客變</option><option>局部裝修</option>
            </select>
          </div>
          <div class="field"><label>坪數</label><input v-model="form.area" /></div>
          <div class="field">
            <label>預算</label>
            <select v-model="form.budget">
              <option>50萬以下</option><option>50~80萬</option><option>80~150萬</option><option>150~300萬</option><option>300萬以上</option>
            </select>
          </div>
          <div class="field"><label>來源</label><input v-model="form.source" placeholder="官網/LINE/廣告/轉介紹" /></div>
          <div class="field"><label>門市</label>
            <select v-model="form.store_id">
              <option :value="null">請選擇</option>
              <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>
        <div class="field"><label>備注</label><textarea v-model="form.note" rows="2" /></div>
        <div class="modal-actions">
          <button class="btn" @click="showForm = false">取消</button>
          <button class="btn btn-primary" @click="submitLead" :disabled="!form.name || !form.phone">建立填單</button>
        </div>
      </div>
    </div>

    <!-- 指派設計師 Modal -->
    <div class="modal-overlay" v-if="showAssignModal" @click.self="showAssignModal=false">
      <div class="modal">
        <h3>指派設計師</h3>
        <p style="font-size:12px;color:var(--text3);margin-bottom:12px">{{ assignTarget?.name }} · {{ assignTarget?.district }}</p>
        <div class="field"><label>選擇設計師</label>
          <select v-model="selectedDesigner" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none;background:var(--bg3)">
            <option :value="null">請選擇</option>
            <option v-for="d in designerList" :key="d.id" :value="d.id">{{ d.name }} · {{ d.role_name }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showAssignModal=false">取消</button>
          <button class="btn btn-primary" @click="confirmAssign" :disabled="!selectedDesigner">確認指派</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { useToast } from "@/composables/useToast"
const toast = useToast()
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import StatusTag from '@/components/common/StatusTag.vue'

const leads = ref([])
const stats = ref({ total: 0, unprocessed: 0, unassigned: 0, today: 0 })
const stores = ref([])
const showForm = ref(false)
const filter = ref({ status: '', unassigned: false, search: '' })
const form = ref({ name: '', phone: '', line_id: '', district: '', address: '', house_type: '中古屋翻新', area: '', budget: '80~150萬', source: '', store_id: null, note: '' })

async function loadLeads() {
  const params = { ...filter.value }
  if (params.unassigned) params.unassigned = 'true'
  const { data } = await api.get('/leads', { params })
  leads.value = data.data || []
}

async function loadStats() {
  const { data } = await api.get('/leads/stats')
  stats.value = data
}

async function submitLead() {
  await api.post('/leads', form.value)
  showForm.value = false
  form.value = { name: '', phone: '', line_id: '', district: '', address: '', house_type: '中古屋翻新', area: '', budget: '80~150萬', source: '', store_id: null, note: '' }
  loadLeads()
  loadStats()
}

function openAssign(lead) {
  assignTarget.value = lead
  showAssignModal.value = true
}

async function convertToCase(lead) {
  if(!confirm('確定將 '+lead.name+' 轉為正式案件？')) return
  try {
    const {data} = await api.post('/leads/'+lead.id+'/convert', {store_id:lead.store_id})
    toast.success('✅ 案件 '+data.case?.case_no+' 已建立')
    loadLeads(); loadStats()
  } catch(e) { toast.error(e.response?.data?.error || '轉換失敗') }
}

function selectLead(lead) { /* view detail */ }

// 指派 Modal
const showAssignModal = ref(false)
const assignTarget = ref(null)
const designerList = ref([])
const selectedDesigner = ref(null)

async function loadDesigners() {
  try { const {data} = await api.get('/users'); designerList.value = data.filter(u=>u.role==='staff') } catch(e){}
}

async function confirmAssign() {
  if(!selectedDesigner.value || !assignTarget.value) return
  try {
    await api.post('/leads/'+assignTarget.value.id+'/assign', {designer_id: selectedDesigner.value})
    showAssignModal.value = false
    toast.success('✅ 已指派')
    loadLeads(); loadStats()
  } catch(e) { toast.error(e.response?.data?.error || '指派失敗') }
}

function urgencyColor(u) { return u === 'hot' ? 'var(--red)' : u === 'warm' ? 'var(--orange)' : 'var(--text3)' }

onMounted(async () => {
  try { const { data } = await api.get('/users/meta/roles'); } catch(e) {}
  try { stores.value = (await api.get('/leads')).data?.stores || []; } catch(e) {}
  loadLeads()
  loadStats()
})
</script>

<style scoped>
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.filter-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.filter-select, .filter-input { padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 12px; background: var(--bg2); outline: none; font-family: var(--font-sans); }
.filter-input { flex: 1; min-width: 150px; }
.filter-check { display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; }
.lead-card { background: var(--bg2); border: 1.5px solid var(--border); border-radius: 10px; padding: 14px; margin-bottom: 8px; cursor: pointer; transition: border-color .15s; }
.lead-card:hover { border-color: var(--text); }
.lead-header { display: flex; justify-content: space-between; align-items: flex-start; }
.lead-name { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.lead-meta { font-size: 11px; color: var(--text3); margin-top: 2px; }
.urgency-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.lead-actions { display: flex; gap: 6px; margin-top: 8px; }
.empty { text-align: center; padding: 40px; color: var(--text3); }
.btn { padding: 8px 16px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--bg); cursor: pointer; font-size: 12px; font-family: var(--font-sans); }
.btn-primary { background: var(--black); color: #fff; border-color: var(--black); }
.btn-sm { padding: 5px 12px; font-size: 11px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal { background: var(--bg2); border-radius: 14px; padding: 24px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
.modal h3 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.field { margin-bottom: 10px; }
.field label { display: block; font-size: 12px; color: var(--text2); margin-bottom: 4px; font-weight: 500; }
.field input, .field select, .field textarea { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 13px; outline: none; font-family: var(--font-sans); background: var(--bg3); }
.field textarea { resize: none; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
@media (max-width: 768px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } .form-grid { grid-template-columns: 1fr; } }
</style>
