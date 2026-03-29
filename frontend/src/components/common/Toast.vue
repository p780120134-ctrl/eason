<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast" :class="type">
        <span class="toast-icon">{{ icons[type] }}</span>
        <span class="toast-text">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  message: String,
  type: { type: String, default: 'info' }, // success/error/warning/info
  duration: { type: Number, default: 2500 },
  show: Boolean,
})

const emit = defineEmits(['close'])
const visible = ref(false)
const icons = { success: '✅', error: '❌', warning: '⚠', info: 'ℹ' }

watch(() => props.show, (val) => {
  if (val) {
    visible.value = true
    setTimeout(() => { visible.value = false; emit('close') }, props.duration)
  }
})
</script>

<style scoped>
.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: var(--black); color: #fff; border-radius: 12px; padding: 12px 20px; font-size: 13px; font-weight: 500; z-index: 99999; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 32px rgba(0,0,0,.2); max-width: 90vw; }
.toast.error { background: #D45050; }
.toast.warning { background: #B87040; }
.toast-enter-active, .toast-leave-active { transition: all .3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
</style>
