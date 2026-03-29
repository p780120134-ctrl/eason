<template>
  <div class="user-chip" v-if="user">
    <div class="uc-avatar" :style="{ background: avatarColor }">{{ user.avatar }}</div>
    <div class="uc-info">
      <div class="uc-name">{{ user.name }}</div>
      <div class="uc-role">{{ user.roleName }}</div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const user = computed(() => auth.user)
const avatarColor = computed(() => {
  const map = { boss:'#fff', staff:'#3A9668', worker:'#0A0A0A', manager:'#4A82B0', client:'#7060A0', finance:'#B87040' }
  return map[user.value?.role] || '#888'
})
</script>
<style scoped>.user-chip{display:flex;align-items:center;gap:8px;padding:4px 10px 4px 4px;border:1px solid rgba(255,255,255,.15);border-radius:20px;cursor:pointer}.uc-avatar{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--black)}.uc-name{font-size:12px;font-weight:500;color:#fff}.uc-role{font-size:10px;color:rgba(255,255,255,.5)}@media(max-width:768px){.uc-info{display:none}}</style>