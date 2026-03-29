import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'

import './styles/tokens.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 登入
    { path: '/login', component: () => import('./pages/Login.vue'), meta: { public: true } },
    // 接單 + 案件
    { path: '/leads', component: () => import('./pages/LeadCenter.vue') },
    { path: '/cases', component: () => import('./pages/CaseList.vue') },
    { path: '/cases/:id', component: () => import('./pages/CaseDetail.vue') },
    // 設計師工作流
    { path: '/designer', component: () => import('./pages/DesignerHome.vue') },
    { path: '/designer/measure', component: () => import('./pages/MeasureBooking.vue') },
    { path: '/designer/contacts', component: () => import('./pages/ClientContacts.vue') },
    { path: '/designer/quote', component: () => import('./pages/DesignerQuote.vue') },
    { path: '/designer/docs', component: () => import('./pages/DesignerDocs.vue') },
    { path: '/designer/negotiate', component: () => import('./pages/NegotiateFlow.vue') },
    { path: '/designer/payments', component: () => import('./pages/DesignerPayments.vue') },
    { path: '/designer/kpi', component: () => import('./pages/DesignerKPI.vue') },
    // 主管管理面板
    { path: '/manager', component: () => import('./pages/ManagerDashboard.vue') },
    { path: '/manager/assign', component: () => import('./pages/CaseAssign.vue') },
    { path: '/manager/dispatch', component: () => import('./pages/DispatchReview.vue') },
    { path: '/manager/defects', component: () => import('./pages/DefectTracker.vue') },
    { path: '/manager/repairs', component: () => import('./pages/RepairOrders.vue') },
    { path: '/manager/tasks', component: () => import('./pages/TeamTasks.vue') },
    // 財務
    { path: '/finance', component: () => import('./pages/FinanceDashboard.vue') },
    { path: '/finance/receivables', component: () => import('./pages/Receivables.vue') },
    { path: '/finance/payables', component: () => import('./pages/Payables.vue') },
    { path: '/finance/pnl', component: () => import('./pages/ProfitLoss.vue') },
    { path: '/finance/cashflow', component: () => import('./pages/CashflowBoard.vue') },
    // 客戶端
    { path: '/client', component: () => import('./pages/ClientHome.vue') },
    { path: '/client/progress', component: () => import('./pages/ClientProgress.vue') },
    { path: '/client/photos', component: () => import('./pages/ClientPhotos.vue') },
    { path: '/client/addons', component: () => import('./pages/ClientAddons.vue') },
    { path: '/client/payments', component: () => import('./pages/ClientPayments.vue') },
    { path: '/client/repair', component: () => import('./pages/ClientRepair.vue') },
    // 電子簽章 + 檔案管理
    { path: '/esign', component: () => import('./pages/ESignCenter.vue') },
    { path: '/files', component: () => import('./pages/FileManager.vue') },
    // 舊版 fallback
    { path: '/:pathMatch(.*)*', component: () => import('./pages/LegacyBridge.vue') },
  ],
})

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)

// 路由守衛：未登入 → 跳轉登入頁
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('tongbao_token')
  if (!to.meta.public && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/cases') // 已登入不要再看登入頁
  } else {
    next()
  }
})

app.mount('#app')
