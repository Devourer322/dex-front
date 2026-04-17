<script setup>
import { ref } from 'vue'
import NavigationPanel from './components/NavigationPanel.vue'
import PhantomWalletButton from './components/PhantomWalletButton.vue'
import { 
  DashboardIcon, 
  PortfolioIcon, 
  TradingIcon, 
  StakingIcon, 
  SettingsIcon,
  PhantomIcon,
  DisconnectIcon 
} from './components/Icons.vue'

// Make icons globally available
import { provide } from 'vue'
provide('DashboardIcon', DashboardIcon)
provide('PortfolioIcon', PortfolioIcon)
provide('TradingIcon', TradingIcon)
provide('StakingIcon', StakingIcon)
provide('SettingsIcon', SettingsIcon)
provide('PhantomIcon', PhantomIcon)
provide('DisconnectIcon', DisconnectIcon)

// Mobile menu state
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Global SOL balance state
const solBalance = ref('0.0000')
const solPriceUSD = ref(198) // SOL price in USD

const updateSolBalance = (balance) => {
  solBalance.value = balance
}

const updateSolPrice = (price) => {
  solPriceUSD.value = price
}

// Provide mobile menu functionality
provide('toggleMobileMenu', toggleMobileMenu)
provide('isMobileMenuOpen', isMobileMenuOpen)

// Provide global SOL balance state
provide('solBalance', solBalance)
provide('solPriceUSD', solPriceUSD)
provide('updateSolBalance', updateSolBalance)
provide('updateSolPrice', updateSolPrice)
</script>

<template>
  <div class="app-container">
    <!-- Mobile Menu Button -->
    <button class="mobile-menu-btn" @click="toggleMobileMenu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <!-- Mobile Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      class="mobile-overlay" 
      @click="toggleMobileMenu"
    ></div>
    
    <NavigationPanel />
    
    <!-- Phantom Wallet Button in top right -->
    <PhantomWalletButton />
    
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Router View для отображения компонентов в зависимости от маршрута -->
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
}

.mobile-menu-btn {
  display: none;
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1002;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
  justify-content: center;
}

.mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 999;
}

.main-content {
  flex: 1;
  margin-left: 280px;
  padding: 40px;
  overflow-y: auto;
  min-height: 100vh;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Tablet Styles */
@media (max-width: 1024px) {
  .main-content {
    margin-left: 260px;
    padding: 30px;
  }
  
  .content-wrapper {
    max-width: 100%;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }
  
  .mobile-overlay {
    display: block;
  }
  
  .main-content {
    margin-left: 0;
    padding: 80px 16px 20px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .main-content {
    padding: 70px 12px 16px;
  }
  
  .mobile-menu-btn {
    top: 16px;
    left: 16px;
    width: 40px;
    height: 40px;
  }
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0f0f23;
  color: #ffffff;
  overflow-x: hidden;
}

#app {
  width: 100%;
  min-height: 100vh;
}

/* Improved scrollbar for mobile */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 108, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 108, 255, 0.5);
}

/* Mobile scrollbar */
@media (max-width: 768px) {
  ::-webkit-scrollbar {
    width: 4px;
  }
}
</style>