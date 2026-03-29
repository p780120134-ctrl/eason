<template>
  <button class="bell" @click="toggle" :title="unread + ' 則未讀'">
    🔔<span class="dot" v-if="unread > 0" />
  </button>
  <div class="notif-panel" v-if="open">
    <div class="np-header">通知中心 <span class="np-count">{{ unread }}</span></div>
    <div v-for="n in notifications" :key="n.id" class="np-item" :class="{ unread: !n.read }">
      <div class="np-text">{{ n.body }}</div>
      <div class="np-time">{{ n.time }}</div>
    </div>
    <div v-if="!notifications.length" class="np-empty">無通知</div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
const open = ref(false)
const notifications = ref([
  { id: 1, body: '王源 已在大安張宅打卡', time: '08:15', read: false },
  { id: 2, body: '新客訴：TM-2026-047', time: '昨天', read: true },
])
const unread = computed(() => notifications.value.filter(n => !n.read).length)
function toggle() { open.value = !open.value }
</script>
<style scoped>.bell{width:30px;height:30px;border:1px solid rgba(255,255,255,.2);border-radius:6px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font-size:14px;position:relative;display:flex;align-items:center;justify-content:center}.dot{position:absolute;top:5px;right:5px;width:6px;height:6px;border-radius:50%;background:var(--red)}.notif-panel{position:absolute;top:calc(var(--topbar-h)+4px);right:12px;width:300px;background:var(--bg2);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow-lg);z-index:9999;max-height:400px;overflow-y:auto}.np-header{font-size:13px;font-weight:700;padding:12px 16px;border-bottom:1px solid var(--border)}.np-count{font-size:10px;background:var(--red);color:#fff;padding:1px 6px;border-radius:8px;margin-left:4px}.np-item{padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer}.np-item:hover{background:var(--bg3)}.np-item.unread{border-left:3px solid var(--blue)}.np-text{font-size:12px}.np-time{font-size:10px;color:var(--text3);margin-top:2px}.np-empty{padding:20px;text-align:center;color:var(--text3);font-size:12px}</style>