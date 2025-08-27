import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import UserProfile from '../components/UserProfile.vue'
import SwapPage from '../components/SwapPage.vue'
import CreateTokenPage from '../components/CreateTokenPage.vue'
import TrademarkGuidelines from '../components/TrademarkGuidelines.vue'
import TokenChart from '../components/TokenChart.vue'
import SettingsPage from '../components/SettingsPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/profile/:address',
    name: 'Portfolio',
    component: UserProfile
  },
  {
    path: '/profile',
    name: 'PortfolioDefault',
    component: UserProfile
  },
  {
    path: '/trading',
    name: 'Trading',
    component: SwapPage
  },
  {
    path: '/staking',
    name: 'Staking',
    component: TrademarkGuidelines
  },
  {
    path: '/create-token',
    name: 'CreateToken',
    component: CreateTokenPage
  },
  {
    path: '/coin/:mint_address',
    name: 'TokenChart',
    component: TokenChart
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsPage
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: {
      template: `
        <div class="page-placeholder">
          <h2>Page Not Found</h2>
          <p>The page you're looking for doesn't exist</p>
          <router-link to="/dashboard" class="back-link">Go back to Dashboard</router-link>
        </div>
      `,
      style: `
        .page-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          text-align: center;
        }
        .page-placeholder h2 {
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
        }
        .page-placeholder p {
          font-size: 16px;
          color: #9ca3af;
          margin-bottom: 20px;
        }
        .back-link {
          color: #42b883;
          text-decoration: none;
          font-weight: 600;
        }
        .back-link:hover {
          text-decoration: underline;
        }
      `
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
