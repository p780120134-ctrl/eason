<template>
  <div class="timeline">
    <div v-for="(item, i) in items" :key="i" class="tl-item">
      <div class="tl-line">
        <div class="tl-dot" :style="{ background: item.done ? (item.active ? 'var(--blue)' : 'var(--green)') : 'var(--border)' }">
          {{ item.done && !item.active ? '✓' : item.active ? '●' : '' }}
        </div>
        <div class="tl-connector" v-if="i < items.length - 1" :style="{ background: item.done ? 'var(--green)' : 'var(--border)' }" />
      </div>
      <div class="tl-content">
        <div class="tl-title" :style="{ color: item.active ? 'var(--blue)' : item.done ? 'var(--text)' : 'var(--text3)' }">{{ item.title }}</div>
        <div class="tl-sub" v-if="item.sub">{{ item.sub }}</div>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({ items: { type: Array, default: () => [] } }) // [{title,sub,done,active}]
</script>
<style scoped>.timeline{padding:4px 0}.tl-item{display:flex;gap:10px;min-height:40px}.tl-line{display:flex;flex-direction:column;align-items:center;width:20px;flex-shrink:0}.tl-dot{width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;flex-shrink:0}.tl-connector{width:2px;flex:1;min-height:12px}.tl-content{padding-bottom:12px}.tl-title{font-size:12px;font-weight:500}.tl-sub{font-size:10px;color:var(--text3);margin-top:2px}</style>