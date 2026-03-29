import { io } from 'socket.io-client'
import { ref } from 'vue'

let socket = null
export const connected = ref(false)

export function connectSocket() {
  const token = localStorage.getItem('tongbao_token')
  if (!token || socket?.connected) return

  const baseURL = import.meta.env.PROD ? '' : 'http://localhost:3000'
  socket = io(baseURL, { auth: { token }, transports: ['websocket', 'polling'] })

  socket.on('connect', () => { connected.value = true; console.log('[Socket] Connected') })
  socket.on('disconnect', () => { connected.value = false })
  socket.on('connect_error', (err) => { console.warn('[Socket] Error:', err.message) })

  return socket
}

export function getSocket() { return socket }

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; connected.value = false }
}
