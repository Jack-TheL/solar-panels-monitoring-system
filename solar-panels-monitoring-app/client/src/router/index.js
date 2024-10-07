import { createRouter, createWebHistory } from 'vue-router'
// Impoart Rounts
import LoginView from '@/views/LoginView.vue'
import MainView from '@/views/MainView.vue'
import HomeView from '@/views/HomeView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ReportsView from '@/views/ReportsView.vue'
import LoginHistoryView from '@/views/LoginHistoryView.vue'
import PanelsView from '@/views/PanelsView.vue'
import NewPanelView from '@/views/NewPanelView.vue'
import ConfigPanelView from '@/views/ConfigPanelView.vue'
import NewUserView from '@/views/NewUserView.vue'
import EditUserView from '@/views/EditUserView.vue'
import AlertConfigView from '@/views/AlertConfigView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'login' } },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/',
      component: MainView,
      children: [
        { path: 'home', name: 'home', component: HomeView },
        { path: 'dashboard', name: 'dashboard', component: DashboardView },
        { path: 'reports', name: 'reports', component: ReportsView },
        { path: 'login-history', name: 'login-history', component: LoginHistoryView },
        { path: 'new-user', name: 'new-user', component: NewUserView},
        { path: ':userId/edit-user', name: 'edit-user', component: EditUserView },
        { path: 'panels', name: 'panels', component: PanelsView },
        { path: 'panels/new', name: 'new-panel', component: NewPanelView },
        { path: 'panels/:panelId/configuration', name: 'config-panel', component: ConfigPanelView },
        { path: 'alert-configuration', name: 'alert-configuration', component: AlertConfigView},
      ]
    }
  ]
})

export default router
