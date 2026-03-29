<template>
  <div class="uploader">
    <input ref="fileInput" type="file" :accept="accept" :multiple="multiple" style="display:none" @change="onSelect" />
    <button class="upload-btn" @click="$refs.fileInput.click()"><span>{{ icon }}</span><span>{{ label }}</span></button>
    <div v-if="files.length" class="file-list">
      <div v-for="(f, i) in files" :key="i" class="file-item">
        <span class="file-name">{{ f.name }}</span>
        <span class="file-size">{{ formatSize(f.size) }}</span>
        <button class="file-remove" @click="remove(i)">✕</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const props = defineProps({ accept: { type: String, default: 'image/*' }, multiple: { type: Boolean, default: true }, label: { type: String, default: '上傳檔案' }, icon: { type: String, default: '📤' }, maxSize: { type: Number, default: 10485760 } })
const emit = defineEmits(['upload'])
const files = ref([])
function onSelect(e) { const fs = Array.from(e.target.files).filter(f => f.size <= props.maxSize); files.value.push(...fs); emit('upload', fs); e.target.value = '' }
function remove(i) { files.value.splice(i, 1) }
function formatSize(b) { return b > 1048576 ? (b/1048576).toFixed(1)+'MB' : Math.round(b/1024)+'KB' }
</script>
<style scoped>.upload-btn{display:flex;align-items:center;gap:6px;padding:10px 16px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);cursor:pointer;font-size:13px;font-family:var(--font-sans)}.upload-btn:active{background:var(--bg3)}.file-list{margin-top:8px}.file-item{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px}.file-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.file-size{color:var(--text3);font-family:var(--font-mono);font-size:10px}.file-remove{background:none;border:none;cursor:pointer;color:var(--red);font-size:14px}</style>