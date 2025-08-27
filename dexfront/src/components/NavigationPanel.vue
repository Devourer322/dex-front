<template>
  <nav :class="['navigation-panel', { 'mobile-open': isMobileMenuOpen }]">
    <!-- Logo Section -->
    <div class="logo-section">
      <div class="logo">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="8" fill="url(#gradient)"/>
          <path d="M12 20L18 14L26 22L32 16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stop-color="#646cff"/>
              <stop offset="1" stop-color="#42b883"/>
            </linearGradient>
          </defs>
        </svg>
        <span class="logo-text">DApp</span>
      </div>
    </div>

    <!-- Navigation Links -->
    <div class="nav-links">
      <router-link 
        v-for="item in navigationItems" 
        :key="item.id"
        :to="item.path"
        :class="['nav-item']"
        active-class="active"
      >
        <component :is="item.icon" class="nav-icon" />
        <span class="nav-text">{{ item.label }}</span>
      </router-link>
    </div>

    <!-- Create Token Button -->
    <div class="create-token-section">
      <router-link to="/create-token" class="create-token-btn">
        <svg class="token-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        <span>Create Token</span>
      </router-link>
    </div>
  </nav>
</template>

<script>
import { ref, inject, computed, onMounted } from 'vue'

export default {
  name: 'NavigationPanel',
  setup() {
    // Inject mobile menu state
    const isMobileMenuOpen = inject('isMobileMenuOpen', ref(false))
    
    // Wallet connection state
    const walletAddress = ref(null)
    
    // Get wallet address from Phantom
    const getWalletAddress = () => {
      if (window.solana && window.solana.isConnected && window.solana.publicKey) {
        return window.solana.publicKey.toString()
      }
      return null
    }
    
    // Update wallet address
    const updateWalletAddress = () => {
      walletAddress.value = getWalletAddress()
    }
    
    // Navigation items with dynamic paths
    const navigationItems = computed(() => {
      const profilePath = walletAddress.value ? `/profile/${walletAddress.value}` : '/profile'
      
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'DashboardIcon', path: '/dashboard' },
        { id: 'portfolio', label: 'Profile', icon: 'PortfolioIcon', path: profilePath },
        { id: 'trading', label: 'Swap', icon: 'TradingIcon', path: '/trading' },
        { id: 'staking', label: 'Trademark Guidelines', icon: 'StakingIcon', path: '/staking' },
        { id: 'settings', label: 'Settings', icon: 'SettingsIcon', path: '/settings' }
      ]
    })

    // Listen for wallet connection changes
    onMounted(() => {
      updateWalletAddress()
      
      // Listen for wallet connection events
      if (window.solana) {
        window.solana.on('connect', updateWalletAddress)
        window.solana.on('disconnect', updateWalletAddress)
      }
    })

    return {
      navigationItems,
      isMobileMenuOpen
    }
  }
}
</script>

<style scoped>
.navigation-panel {
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #1a1b23 0%, #16171d 100%);
  border-right: 1px solid #2a2d3a;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: transform 0.3s ease;
}

.logo-section {
  padding: 0 24px 32px;
  border-bottom: 1px solid #2a2d3a;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.5px;
}

.nav-links {
  flex: 1;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  text-decoration: none;
}

.nav-item:hover {
  background: rgba(100, 108, 255, 0.1);
  color: #646cff;
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(135deg, #646cff 0%, #42b883 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.3);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-text {
  white-space: nowrap;
}

.create-token-section {
  padding: 24px 16px 0;
  border-top: 1px solid #2a2d3a;
}

.create-token-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #42b883 0%, #369870 100%);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.create-token-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(66, 184, 131, 0.4);
}

.token-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Tablet Styles */
@media (max-width: 1024px) {
  .navigation-panel {
    width: 260px;
  }
  
  .logo-section {
    padding: 0 20px 28px;
  }
  
  .nav-links {
    padding: 0 12px;
  }
  
  .create-token-section {
    padding: 20px 12px 0;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .navigation-panel {
    width: 280px;
    transform: translateX(-100%);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
  }
  
  .navigation-panel.mobile-open {
    transform: translateX(0);
  }
  
  .logo-section {
    padding: 0 24px 24px;
    margin-bottom: 24px;
  }
  
  .logo-text {
    font-size: 22px;
  }
  
  .nav-links {
    padding: 0 16px;
    gap: 6px;
  }
  
  .nav-item {
    padding: 14px 16px;
    font-size: 15px;
  }
  
  .nav-item:hover {
    transform: none;
  }
  
  .create-token-section {
    padding: 20px 16px 0;
  }
  
  .create-token-btn {
    padding: 14px 16px;
    font-size: 15px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .navigation-panel {
    width: 260px;
  }
  
  .logo-section {
    padding: 0 20px 20px;
    margin-bottom: 20px;
  }
  
  .logo-text {
    font-size: 20px;
  }
  
  .nav-links {
    padding: 0 12px;
  }
  
  .nav-item {
    padding: 12px 14px;
    font-size: 14px;
  }
  
  .create-token-section {
    padding: 16px 12px 0;
  }
  
  .create-token-btn {
    padding: 12px 14px;
    font-size: 14px;
  }
}
</style>