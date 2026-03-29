<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="menu-btn" @click="$emit('toggle-menu')">☰</button>
      <div class="logo">
        <div class="logo-mark">統</div>
        <span class="logo-text">統包先生</span>
      </div>
    </div>
    <GlobalSearch />
    <div class="topbar-right">
      <span class="time mono">{{ time }}</span>
      <NotificationBell />
      <UserChip />
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import GlobalSearch from '@/components/common/GlobalSearch.vue'
import NotificationBell from '@/components/common/NotificationBell.vue'
import UserChip from '@/components/common/UserChip.vue'

defineEmits(['toggle-menu'])

const time = ref('--:--')
let timer
onMounted(() => {
  const tick = () => { const d = new Date(); time.value = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
  tick(); timer = setInterval(tick, 30000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.topbar { background: var(--black); color: #fff; padding: 0 16px; height: var(--topbar-h); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; padding-top: var(--safe-top); }
.topbar-left, .topbar-right { display: flex; align-items: center; gap: 10px; }
.logo { display: flex; align-items: center; gap: 8px; }
.logo-mark { width: 28px; height: 28px; background: #fff; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; color: var(--black); }
.logo-text { font-size: 15px; font-weight: 700; letter-spacing: .5px; }
.time { font-size: 12px; opacity: .5; }
.menu-btn { display: none; width: 32px; height: 32px; border: 1px solid rgba(255,255,255,.2); border-radius: 6px; background: rgba(255,255,255,.08); color: #fff; cursor: pointer; font-size: 18px; }
@media (max-width: 768px) { .menu-btn { display: flex; align-items: center; justify-content: center; } .logo-text, .time { display: none; } }
</style>
