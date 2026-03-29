<template>
  <div class="sc"><div class="sl">{{ label }}</div><div class="sv" :style="{color}"><slot>{{ value }}</slot></div><div class="ss" v-if="sub">{{ sub }}</div></div>
</template>
<script setup>
defineProps({ label: String, value: [String,Number], sub: String, color: { type: String, default: 'var(--text)' } })
</script>
<style scoped>.sc{background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:16px;box-shadow:var(--shadow);text-align:center}.sl{font-size:11px;color:var(--text3);margin-bottom:5px}.sv{font-size:26px;font-weight:700;font-family:var(--font-mono);line-height:1}.ss{font-size:11px;color:var(--text3);margin-top:4px}@media(max-width:768px){.sv{font-size:20px}.sc{padding:12px}}</style>