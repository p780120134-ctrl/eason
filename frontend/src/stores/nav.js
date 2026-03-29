import { defineStore } from 'pinia'
import { ref } from 'vue'

// 導覽設定（從前端 NAV_MAP 遷移，未來改從後端 roles.nav_config 讀取）
const NAV_CONFIG = {
  boss: [
    { id: 'overview', icon: '📊', label: '營運總覽' },
    { id: 'bweekly', icon: '📋', label: '週會戰情室' },
    { id: 'bai', icon: '🤖', label: 'AI 智慧派案' },
    { id: 'brewardpool', icon: '🏦', label: 'GP 獎勵池' },
    { id: 'breports', icon: '📊', label: '報表中心' },
    { id: 'blinenotify', icon: '📱', label: 'LINE 推播' },
    { id: 'bpermissions', icon: '🔐', label: '權限管理' },
    { id: 'erpbridge', icon: '🔗', label: 'ERP 串接' },
    { id: 'bfiles', icon: '☁', label: '檔案管理' },
    { id: 'aischedule', icon: '📅', label: 'AI 工期預測' },
    { id: 'aiquote', icon: '🤖', label: 'AI 報價' },
    { id: 'einvoice', icon: '🧾', label: '電子發票' },
    { id: 'esign', icon: '✍', label: '電子簽章' },
  ],
  staff: [
    { id: 'shome', icon: '◉', label: '我的首頁' },
    { id: 'schat', icon: '💬', label: '群組對話', badge: '1' },
    { id: 'scases', icon: '📁', label: '我的案件' },
    { id: 'stasks', icon: '◆', label: '今日任務' },
    { id: 'sincentive', icon: '⚡', label: '激勵中心' },
    { id: 'sinspection', icon: '🔍', label: '工地巡查' },
    { id: 'aistyle', icon: '🎨', label: 'AI 風格推薦' },
    { id: 'aiquote', icon: '🤖', label: 'AI 報價' },
    { id: 'lineoa', icon: '💬', label: 'LINE 客服' },
    { id: 'ssitecheckin', icon: '📍', label: '工地打卡' },
    { id: 'esign', icon: '✍', label: '電子簽章' },
    { id: 'smeetings', icon: '🎙', label: 'AI 會議錄音' },
  ],
  // TODO: 其他 12 個角色的導覽設定
}

const DEFAULTS = { boss: 'overview', staff: 'shome', manager: 'dept', worker: 'wkhome', client: 'chome', finance: 'finhome', admin: 'adminhome' }

export const useNavStore = defineStore('nav', () => {
  const current = ref('')

  function getItems(role) { return NAV_CONFIG[role] || [] }
  function setCurrent(id) { current.value = id }
  function setDefault(role) { current.value = DEFAULTS[role] || 'overview' }

  return { current, getItems, setCurrent, setDefault }
})
