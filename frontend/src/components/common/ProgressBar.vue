<template>
  <div class="pw">
    <div class="pm" v-if="label||showPct"><span>{{ label }}</span><span class="mono">{{ percent }}%</span></div>
    <div class="pb"><div class="pf" :style="{ width: percent+'%', background: barColor }"></div></div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ value: { type: Number, default: 0 }, max: { type: Number, default: 100 }, label: String, color: String, showPct: { type: Boolean, default: true } })
const percent = computed(() => Math.min(100, Math.round(props.value / props.max * 100)))
const barColor = computed(() => props.color || 'var(--black)')
</script>
<style scoped>.pw{margin-bottom:10px}.pm{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;color:var(--text2)}.pb{height:6px;background:var(--bg3);border-radius:3px;overflow:hidden}.pf{height:100%;border-radius:3px;transition:width .4s}</style>