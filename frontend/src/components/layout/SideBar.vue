<template>
  <aside class="sidebar" :class="{ open }">
    <div class="user-info">
      <div class="avatar" :style="{ background: roleColor }">{{ auth.user?.avatar }}</div>
      <div>
        <div class="name">{{ auth.user?.name }}</div>
        <div class="role-label">{{ auth.user?.roleName }}</div>
      </div>
    </div>
    <nav>
      <div
        v-for="item in navItems" :key="item.id"
        class="nav-item" :class="{ active: currentNav === item.id }"
        @click="navigate(item.id)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
        <span v-if="item.badge" class="badge">{{ item.badge }}</span>
      </div>
    </nav>
    <div class="sidebar-footer">
      <button class="logout-btn" @click="logout">登出</button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavStore } from '@/stores/nav'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['navigate'])
const router = useRouter()
const auth = useAuthStore()
const nav = useNavStore()

const currentNav = computed(() => nav.current)
const navItems = computed(() => nav.getItems(auth.user?.role))
const roleColor = computed(() => {
  const map = { boss:'#fff', staff:'#3A9668', worker:'#0A0A0A', manager:'#4A82B0', client:'#7060A0' }
  return map[auth.user?.role] || '#888'
})
function navigate(id) { nav.setCurrent(id); emit('navigate'); }
function logout() { auth.logout(); router.push('/login'); }
</script>

<style scoped>
.sidebar { width: var(--sidebar-w); background: var(--black); flex-shrink: 0; overflow-y: auto; padding: 12px 0; color: rgba(255,255,255,.6); }
.user-info { display: flex; align-items: center; gap: 9px; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,.1); margin-bottom: 8px; }
.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: var(--black); flex-shrink: 0; }
.name { font-size: 13px; font-weight: 500; color: #fff; }
.role-label { font-size: 11px; color: rgba(255,255,255,.4); }
.nav-item { display: flex; align-items: center; gap: 9px; padding: 8px 14px; cursor: pointer; font-size: 13px; transition: all .12s; border-left: 3px solid transparent; }
.nav-item:hover { background: rgba(255,255,255,.08); color: rgba(255,255,255,.9); }
.nav-item.active { background: rgba(255,255,255,.12); color: #fff; border-left-color: #fff; }
.nav-icon { width: 15px; text-align: center; font-size: 13px; }
.badge { margin-left: auto; font-size: 10px; padding: 1px 5px; border-radius: 10px; background: #fff; color: var(--black); font-weight: 600; }
.sidebar-footer { padding: 12px 14px; border-top: 1px solid rgba(255,255,255,.1); margin-top: auto; }
.logout-btn { width: 100%; padding: 8px; border: 1px solid rgba(255,255,255,.2); border-radius: 6px; background: rgba(255,255,255,.08); color: rgba(255,255,255,.6); cursor: pointer; font-size: 12px; font-family: var(--font-sans); }
@media (max-width: 768px) {
  .sidebar { position: fixed; left: -260px; top: 0; bottom: 0; width: 260px; z-index: 999; transition: left .3s; padding-top: calc(var(--safe-top) + var(--topbar-h)); }
  .sidebar.open { left: 0; }
}
</style>
