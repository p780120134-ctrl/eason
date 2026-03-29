<template>
  <!-- 過渡期：載入舊版 SPA，逐步將頁面遷移為 Vue 元件 -->
  <iframe
    ref="legacy"
    src="/legacy/tongbao_app_complete_final.html"
    style="width:100%;height:100vh;border:none"
  />
</template>

<script setup>
// 未來可透過 postMessage 與舊版 SPA 溝通
// window.addEventListener('message', (e) => { ... })
</script>
