import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('tongbao_user') || 'null'))
  const token = ref(localStorage.getItem('tongbao_token') || '')
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  async function login(username, password) {
    const { data } = await api.post('/auth/login', { username, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('tongbao_token', data.token)
    localStorage.setItem('tongbao_user', JSON.stringify(data.user))
    return data
  }

  async function fetchMe() {
    const { data } = await api.get('/auth/me')
    user.value = data
    localStorage.setItem('tongbao_user', JSON.stringify(data))
  }

  function logout() {
    api.post('/auth/logout').catch(() => {})
    token.value = ''
    user.value = null
    localStorage.removeItem('tongbao_token')
    localStorage.removeItem('tongbao_user')
  }

  function hasPermission(permCode, action = 'read') {
    if (!user.value) return false
    if (user.value.role === 'boss') return true
    const perm = (user.value.permissions || []).find(p => p.code === permCode)
    if (!perm) return false
    const map = { create: 'can_create', read: 'can_read', update: 'can_update', delete: 'can_delete' }
    return perm[map[action]] !== false
  }

  return { user, token, isLoggedIn, login, fetchMe, logout, hasPermission }
})
