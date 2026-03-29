<template>
  <div class="search-wrap" v-if="!isMobile">
    <input class="search-input" placeholder="🔍 搜尋案件、客戶..." v-model="query" @input="onSearch" @focus="open=true" @blur="setTimeout(()=>open=false,200)" />
    <div class="search-results" v-if="open && results.length">
      <div v-for="r in results" :key="r.id" class="sr-item" @mousedown="go(r)">
        <span class="sr-icon">{{ r.icon }}</span>
        <div><div class="sr-title">{{ r.title }}</div><div class="sr-sub">{{ r.sub }}</div></div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
const query = ref('')
const open = ref(false)
const results = ref([])
const isMobile = ref(window.innerWidth <= 768)
function onSearch() { /* TODO: API search */ results.value = [] }
function go(r) { open.value = false; /* TODO: navigate */ }
</script>
<style scoped>.search-wrap{flex:1;max-width:280px;margin:0 8px;position:relative}.search-input{width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:18px;padding:5px 14px;color:#fff;font-size:11px;outline:none;font-family:var(--font-sans)}.search-input::placeholder{color:rgba(255,255,255,.4)}.search-results{position:absolute;top:calc(100%+4px);left:0;right:0;background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;overflow:hidden;z-index:9999;max-height:280px;overflow-y:auto;box-shadow:var(--shadow-lg)}.sr-item{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;font-size:12px}.sr-item:hover{background:var(--bg3)}.sr-icon{font-size:16px}.sr-title{font-weight:500}.sr-sub{font-size:10px;color:var(--text3)}</style>