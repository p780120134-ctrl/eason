<template>
  <div class="photo-wall">
    <div v-for="(photo, i) in photos" :key="i" class="pw-item" @click="$emit('preview', i)">
      <img v-if="photo.url" :src="photo.url" :alt="photo.desc || ''" />
      <div v-else class="pw-placeholder">{{ photo.thumb || '📷' }}</div>
      <div class="pw-desc" v-if="photo.desc">{{ photo.desc }}</div>
    </div>
    <div v-if="showAdd" class="pw-item pw-add" @click="$emit('add')">
      <div class="pw-placeholder">+</div>
      <div class="pw-desc">{{ addLabel }}</div>
    </div>
  </div>
</template>
<script setup>
defineProps({ photos: { type: Array, default: () => [] }, showAdd: Boolean, addLabel: { type: String, default: '新增' }, cols: { type: Number, default: 4 } })
defineEmits(['preview', 'add'])
</script>
<style scoped>.photo-wall{display:grid;grid-template-columns:repeat(v-bind(cols),1fr);gap:8px}.pw-item{aspect-ratio:1;background:var(--bg3);border-radius:8px;overflow:hidden;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center}.pw-item img{width:100%;height:100%;object-fit:cover}.pw-placeholder{font-size:24px;color:var(--text3)}.pw-add{border:1.5px dashed var(--border)}.pw-desc{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.5);color:#fff;font-size:9px;padding:2px 4px;text-align:center}</style>