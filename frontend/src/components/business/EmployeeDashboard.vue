<template>
  <div class="emp-dashboard" v-if="user">
    <!-- 歡迎 + 打卡狀態 -->
    <div class="welcome-row">
      <div>
        <div class="welcome-name">{{ user.name }} 你好</div>
        <div class="welcome-sub">{{ user.roleName }} · {{ user.store || '' }} · {{ levelIcon }} Lv{{ gp.level }}</div>
      </div>
      <div class="checkin-status">
        <StatusTag :color="checkedIn ? 'green' : 'red'" :label="checkedIn ? '✓ 已打卡' : '⚠ 未打卡'" />
      </div>
    </div>

    <!-- GP + 獎金（黑底卡）-->
    <div class="gp-card">
      <div class="gp-grid">
        <div class="gp-item"><div class="gp-val">{{ gp.total }}</div><div class="gp-label">本月 GP</div></div>
        <div class="gp-item"><div class="gp-val" style="color:var(--green)">{{ formatMoney(reward) }}</div><div class="gp-label">預估獎金</div></div>
        <div class="gp-item"><div class="gp-val">{{ levelIcon }}</div><div class="gp-label">Lv{{ gp.level }}</div></div>
      </div>
      <ProgressBar v-if="nextThreshold" :value="gp.total" :max="nextThreshold" color="linear-gradient(90deg,var(--green),#fff)" :label="'還差 ' + (nextThreshold - gp.total) + ' GP'" />
    </div>

    <!-- 薪資（隱藏式）-->
    <div class="salary-card" @click="showSalary = !showSalary">
      <span>💰</span>
      <div class="salary-info">
        <div class="salary-title">本月預估收入</div>
        <div class="salary-sub">底薪 + GP 獎金</div>
      </div>
      <div v-if="showSalary" class="salary-amount mono">{{ formatMoney(totalPay) }}</div>
      <div v-else class="salary-hidden">點擊查看 👁</div>
    </div>

    <!-- 出勤 + 特休 -->
    <div class="two-col">
      <StatCard label="本月打卡" :value="monthCheckins" :color="monthCheckins > 0 ? 'var(--green)' : 'var(--red)'" />
      <StatCard label="特休剩餘" :value="leaveRemaining + '天'" color="var(--blue)" :sub="'已用 ' + user.used_leave + ' / ' + user.annual_leave" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import StatusTag from '@/components/common/StatusTag.vue'
import StatCard from '@/components/common/StatCard.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'

const auth = useAuthStore()
const user = computed(() => auth.user)
const showSalary = ref(false)

// TODO: 從 API 取得真實資料
const gp = ref({ total: 694, level: 3, earned: 720, penalties: -26, streak: 2 })
const reward = ref(6000)
const nextThreshold = ref(900)
const checkedIn = ref(false)
const monthCheckins = ref(22)
const leaveRemaining = computed(() => (user.value?.annual_leave || 0) - (user.value?.used_leave || 0))
const totalPay = computed(() => (user.value?.base_salary || 0) + reward.value)
const levelIcon = computed(() => ['🌱','🌿','⭐','🔥','💎','👑'][gp.value.level - 1] || '🌱')

function formatMoney(n) { return '$' + (n || 0).toLocaleString() }
</script>

<style scoped>
.welcome-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.welcome-name { font-size: 18px; font-weight: 800; }
.welcome-sub { font-size: 12px; color: var(--text3); margin-top: 2px; }
.gp-card { background: var(--black); border-radius: 14px; padding: 18px; margin-bottom: 14px; color: #fff; }
.gp-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; text-align: center; margin-bottom: 12px; }
.gp-val { font-size: 28px; font-weight: 900; font-family: var(--font-mono); }
.gp-label { font-size: 10px; opacity: .5; }
.salary-card { display: flex; align-items: center; gap: 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-bottom: 14px; cursor: pointer; }
.salary-info { flex: 1; }
.salary-title { font-size: 13px; font-weight: 600; }
.salary-sub { font-size: 10px; color: var(--text3); }
.salary-amount { font-size: 22px; font-weight: 800; }
.salary-hidden { font-size: 14px; color: var(--text3); }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
@media (max-width: 768px) { .gp-val { font-size: 22px; } }
</style>
