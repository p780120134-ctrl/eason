<template>
  <router-view />
  <Toast :show="toastState.show" :message="toastState.message" :type="toastState.type" @close="toastState.show=false" />
</template>

<script setup>
import Toast from '@/components/common/Toast.vue'
import { useToast } from '@/composables/useToast'
const { toastState } = useToast()
</script>
