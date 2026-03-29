import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 自動帶 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tongbao_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 統一錯誤處理
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const message = err.response?.data?.error || err.message

    if (status === 401) {
      localStorage.removeItem('tongbao_token')
      localStorage.removeItem('tongbao_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (status === 403) {
      console.warn('[API] 權限不足:', message)
    } else if (status >= 500) {
      console.error('[API] 伺服器錯誤:', message)
    }

    return Promise.reject(err)
  }
)

export default api
