<template>
  <span class="tag" :style="style"><slot>{{ label }}</slot></span>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ label: String, color: { type: String, default: 'gray' }, size: { type: String, default: 'sm' } })
const colors = { green:{bg:'rgba(58,150,104,.12)',c:'#3A9668'}, red:{bg:'rgba(212,80,80,.12)',c:'#D45050'}, blue:{bg:'rgba(74,130,176,.12)',c:'#4A82B0'}, orange:{bg:'rgba(184,112,64,.12)',c:'#B87040'}, purple:{bg:'rgba(112,96,160,.12)',c:'#7060A0'}, gray:{bg:'rgba(0,0,0,.06)',c:'#888'}, black:{bg:'#0A0A0A',c:'#fff'} }
const style = computed(() => { const cc = colors[props.color]||colors.gray; return { background:cc.bg, color:cc.c, fontSize: props.size==='lg'?'13px':props.size==='md'?'12px':'10px' } })
</script>
<style scoped>.tag{display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;font-weight:600;white-space:nowrap}</style>