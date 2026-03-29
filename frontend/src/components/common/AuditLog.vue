<template>
  <div class="audit-log">
    <div class="al-title">{{ title || '操作紀錄' }}</div>
    <div v-for="(log, i) in logs" :key="i" class="al-item">
      <div class="al-dot" :style="{ background: log.color || 'var(--text3)' }"></div>
      <div class="al-body">
        <div class="al-text"><strong v-if="log.user">{{ log.user }}</strong> {{ log.action }}</div>
        <div class="al-time">{{ log.time }}</div>
      </div>
    </div>
    <div v-if="!logs.length" class="al-empty">暫無紀錄</div>
  </div>
</template>
<script setup>
defineProps({ logs: { type: Array, default: () => [] }, title: String }) // [{user,action,time,color}]
</script>
<style scoped>.audit-log{}.al-title{font-size:12px;font-weight:600;margin-bottom:8px}.al-item{display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)}.al-dot{width:6px;height:6px;border-radius:50%;margin-top:6px;flex-shrink:0}.al-text{font-size:12px}.al-time{font-size:10px;color:var(--text3);margin-top:2px}.al-empty{font-size:12px;color:var(--text3);text-align:center;padding:16px}</style>