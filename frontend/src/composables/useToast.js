import { ref } from 'vue'

const toastState = ref({ show: false, message: '', type: 'info' })

export function useToast() {
  function toast(message, type = 'success') {
    toastState.value = { show: true, message, type }
    setTimeout(() => { toastState.value.show = false }, 2800)
  }
  function success(msg) { toast(msg, 'success') }
  function error(msg) { toast(msg, 'error') }
  function warning(msg) { toast(msg, 'warning') }
  function info(msg) { toast(msg, 'info') }

  return { toastState, toast, success, error, warning, info }
}
