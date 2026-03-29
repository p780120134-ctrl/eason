<template>
  <div class="ph">
    <div class="ph-row"><h1 class="pt"><slot name="title">{{ title }}</slot></h1><slot name="actions" /></div>
    <p class="ps" v-if="subtitle || $slots.subtitle"><slot name="subtitle">{{ subtitle }}</slot></p>
  </div>
</template>
<script setup>
defineProps({ title: String, subtitle: String })
</script>
<style scoped>.ph{margin-bottom:22px}.ph-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}.pt{font-size:21px;font-weight:700;letter-spacing:-.3px}.ps{font-size:12px;color:var(--text3);margin-top:3px}@media(max-width:768px){.pt{font-size:18px}}</style>