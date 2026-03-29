<template>
  <div class="tabbar" v-if="isMobile">
    <div
      v-for="tab in tabs" :key="tab.id"
      class="tab-item" :class="{ active: currentNav === tab.id }"
      @click="navigate(tab.id)"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      <span class="tab-label">{{ tab.label }}</span>
    </div>
    <div class="tab-item" @click="$emit('toggle-menu')">
      <span class="tab-icon">☰</span>
      <span class="tab-label">更多</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNavStore } from '@/stores/nav'

const auth = useAuthStore()
const nav = useNavStore()
const currentNav = computed(() => nav.current)
const isMobile = ref(false)

const tabConfig = {
  boss:      [{id:'overview',icon:'📊',label:'總覽'},{id:'bweekly',icon:'📋',label:'週會'},{id:'brewardpool',icon:'🏦',label:'獎勵池'},{id:'bai',icon:'🤖',label:'AI'}],
  staff:     [{id:'shome',icon:'◉',label:'首頁'},{id:'sinspection',icon:'🔍',label:'巡查'},{id:'ssitecheckin',icon:'📍',label:'打卡'},{id:'sincentive',icon:'⚡',label:'GP'}],
  worker:    [{id:'wkhome',icon:'◉',label:'首頁'},{id:'sconstructlog',icon:'📝',label:'日誌'},{id:'ssitecheckin',icon:'📍',label:'打卡'},{id:'sincentive',icon:'⚡',label:'GP'}],
  manager:   [{id:'dept',icon:'📊',label:'總覽'},{id:'smonitor',icon:'📡',label:'監控'},{id:'dispatch',icon:'📋',label:'派工'},{id:'payreview',icon:'💰',label:'請款'}],
  client:    [{id:'chome',icon:'◉',label:'首頁'},{id:'cprogress',icon:'📋',label:'進度'},{id:'cchat',icon:'💬',label:'對話'},{id:'cpay',icon:'💰',label:'付款'}],
  contractor:[{id:'wjobs',icon:'◉',label:'派工'},{id:'ssitecheckin',icon:'📍',label:'打卡'},{id:'cwdailylog',icon:'📝',label:'日報'},{id:'cwclaim',icon:'💰',label:'請款'}],
}
const tabs = computed(() => tabConfig[auth.user?.role] || [{id:'overview',icon:'◉',label:'首頁'}])
function navigate(id) { nav.setCurrent(id) }

function checkMobile() { isMobile.value = window.innerWidth <= 768 }
onMounted(() => { checkMobile(); window.addEventListener('resize', checkMobile) })
onUnmounted(() => window.removeEventListener('resize', checkMobile))
</script>

<style scoped>
.tabbar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg2); border-top: 1px solid var(--border); display: flex; padding: 6px 0 calc(6px + var(--safe-bottom)); z-index: 100; }
.tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 0; cursor: pointer; }
.tab-icon { font-size: 20px; }
.tab-label { font-size: 9px; color: var(--text3); }
.tab-item.active .tab-label { color: var(--text); font-weight: 700; }
@media (min-width: 769px) { .tabbar { display: none !important; } }
</style>
