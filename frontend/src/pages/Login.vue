<template>
  <div class="login-screen">
    <!-- 背景格線 -->
    <div class="grid-bg"></div>

    <div class="login-box">
      <!-- Logo -->
      <div class="logo-area">
        <div class="logo-mark">統</div>
        <div>
          <div class="logo-text">統包先生</div>
          <div class="logo-sub">MR.TURNKEY · 品牌管理平台</div>
        </div>
      </div>

      <h2 class="login-title">登入系統</h2>
      <p class="login-desc">請輸入帳號與密碼</p>

      <!-- 表單 -->
      <div class="field">
        <label>帳號</label>
        <input v-model="username" placeholder="username" @keyup.enter="doLogin" :class="{ error: errorMsg }" />
      </div>
      <div class="field">
        <label>密碼</label>
        <div class="pw-wrap">
          <input v-model="password" :type="showPw ? 'text' : 'password'" placeholder="••••" @keyup.enter="doLogin" :class="{ error: errorMsg }" />
          <span class="pw-toggle" @click="showPw=!showPw">{{ showPw ? '🙈' : '👁' }}</span>
        </div>
      </div>

      <div class="error-msg" v-if="errorMsg">{{ errorMsg }}</div>

      <button class="login-btn" @click="doLogin" :disabled="loading">
        <span class="spinner" v-if="loading"></span>
        {{ loading ? '登入中...' : '登入' }}
      </button>

      <!-- 快速登入 -->
      <div class="quick-login">
        <div class="quick-title">快速登入（Demo）</div>
        <div class="quick-grid">
          <div v-for="u in quickUsers" :key="u.username" class="quick-item" @click="quickLogin(u)">
            <div class="quick-avatar" :style="{ background: u.color }">{{ u.avatar }}</div>
            <div class="quick-name">{{ u.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="login-footer">統包先生 MR.TURNKEY © 2026</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavStore } from '@/stores/nav'

const router = useRouter()
const auth = useAuthStore()
const nav = useNavStore()

const username = ref('')
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const quickUsers = [
  { username: 'boss', label: '老闆', avatar: '昇', color: '#0A0A0A' },
  { username: 'staff', label: '設計師', avatar: '博', color: '#3A9668' },
  { username: 'worker', label: '工務', avatar: '源', color: '#555' },
  { username: 'manager', label: '店長', avatar: '誠', color: '#4A82B0' },
  { username: 'finance', label: '財務', avatar: '財', color: '#B87040' },
  { username: 'client', label: '客戶', avatar: '張', color: '#7060A0' },
]

async function doLogin() {
  if (!username.value || !password.value) { errorMsg.value = '請輸入帳號密碼'; return }
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await auth.login(username.value, password.value)
    nav.setDefault(data.user.role)
    // 依角色跳轉
    const routes = { boss: '/cases', staff: '/designer', worker: '/designer', manager: '/manager', finance: '/finance', client: '/client', admin: '/leads' }
    router.push(routes[data.user.role] || '/cases')
  } catch (e) {
    errorMsg.value = e.response?.data?.error || '登入失敗'
  } finally {
    loading.value = false
  }
}

function quickLogin(u) {
  username.value = u.username
  password.value = '1234'
  doLogin()
}
</script>

<style scoped>
.login-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; background: var(--bg); position: relative; padding: 24px; }
.grid-bg { position: absolute; inset: 0; background-image: linear-gradient(#EAEAEA 1px, transparent 1px), linear-gradient(90deg, #EAEAEA 1px, transparent 1px); background-size: 40px 40px; opacity: .5; pointer-events: none; }
.login-box { position: relative; z-index: 1; background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 36px; width: 100%; max-width: 400px; box-shadow: 0 12px 48px rgba(0,0,0,.1); }

.logo-area { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
.logo-mark { width: 44px; height: 44px; background: var(--black); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: #fff; flex-shrink: 0; }
.logo-text { font-size: 18px; font-weight: 800; }
.logo-sub { font-size: 11px; color: var(--text3); }

.login-title { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
.login-desc { font-size: 13px; color: var(--text3); margin-bottom: 24px; }

.field { margin-bottom: 14px; }
.field label { display: block; font-size: 12px; color: var(--text2); margin-bottom: 5px; font-weight: 500; }
.field input { width: 100%; padding: 11px 14px; background: var(--bg3); border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; outline: none; font-family: var(--font-sans); transition: border-color .15s; }
.field input:focus { border-color: var(--black); }
.field input.error { border-color: var(--red); }
.pw-wrap { position: relative; }
.pw-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 16px; user-select: none; }

.error-msg { color: var(--red); font-size: 12px; margin-bottom: 12px; }

.login-btn { width: 100%; padding: 13px; background: var(--black); border: none; border-radius: 9px; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: var(--font-sans); transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.login-btn:hover { background: #222; }
.login-btn:disabled { opacity: .6; cursor: default; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.quick-login { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
.quick-title { font-size: 11px; color: var(--text3); margin-bottom: 10px; text-align: center; letter-spacing: .5px; }
.quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.quick-item { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all .15s; }
.quick-item:hover { border-color: var(--black); background: var(--bg3); }
.quick-avatar { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; }
.quick-name { font-size: 11px; font-weight: 500; }

.login-footer { margin-top: 20px; font-size: 12px; color: var(--text3); }

@media (max-width: 768px) {
  .login-box { padding: 24px; }
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
