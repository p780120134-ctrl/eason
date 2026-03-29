<template>
  <div class="app-shell">
    <TopBar @toggle-menu="sidebarOpen = !sidebarOpen" />
    <div class="app-body">
      <div class="sidebar-overlay" :class="{ show: sidebarOpen }" @click="sidebarOpen = false" />
      <SideBar :open="sidebarOpen" @navigate="sidebarOpen = false" />
      <main class="content">
        <EmployeeDashboard v-if="showDashboard" />
        <slot />
      </main>
    </div>
    <MobileTabBar />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import TopBar from './TopBar.vue'
import SideBar from './SideBar.vue'
import MobileTabBar from './MobileTabBar.vue'
import EmployeeDashboard from '@/components/business/EmployeeDashboard.vue'

const sidebarOpen = ref(false)
const auth = useAuthStore()
const homePaths = { staff: '/home', manager: '/home', worker: '/home', finance: '/home', admin: '/home' }
const showDashboard = computed(() => {
  const role = auth.user?.role
  return role && role !== 'boss' && role !== 'client' && homePaths[role]
})
</script>

<style scoped>
.app-shell { display: flex; flex-direction: column; height: 100vh; height: 100dvh; }
.app-body { display: flex; flex: 1; overflow: hidden; }
.content { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--bg); }
.sidebar-overlay { display: none; }

@media (max-width: 768px) {
  .content { padding: 14px 12px calc(var(--tabbar-h) + var(--safe-bottom) + 8px); }
  .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 998; }
  .sidebar-overlay.show { display: block; }
}
</style>
