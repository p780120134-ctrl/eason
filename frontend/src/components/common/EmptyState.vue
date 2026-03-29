<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <div class="empty-title">{{ title || '暫無資料' }}</div>
    <div class="empty-desc" v-if="desc">{{ desc }}</div>
    <slot />
  </div>
</template>

<script setup>
defineProps({ icon: { type: String, default: '📋' }, title: String, desc: String })
</script>

<style scoped>
.empty-state { text-align: center; padding: 40px 20px; }
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-title { font-size: 14px; font-weight: 600; color: var(--text3); }
.empty-desc { font-size: 12px; color: var(--text3); margin-top: 4px; }
</style>
