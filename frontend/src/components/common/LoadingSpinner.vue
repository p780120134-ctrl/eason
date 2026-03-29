<template>
  <div class="loading-wrap" v-if="loading">
    <div class="spinner"></div>
    <div class="loading-text" v-if="text">{{ text }}</div>
  </div>
</template>

<script setup>
defineProps({ loading: Boolean, text: { type: String, default: '載入中...' } })
</script>

<style scoped>
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; gap: 12px; }
.spinner { width: 24px; height: 24px; border: 3px solid var(--bg3); border-top-color: var(--black); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 12px; color: var(--text3); }
</style>
