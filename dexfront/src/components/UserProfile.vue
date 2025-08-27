<template>
  <div class="user-profile">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <span class="loading-text">Загрузка профиля...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-content">
        <svg class="error-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 class="error-title">Ошибка загрузки профиля</h3>
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="loadUserProfile">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
          Попробовать снова
        </button>
      </div>
    </div>

    <!-- Profile Content -->
    <div v-else-if="userProfile" class="profile-container">
      <!-- Left Side - Profile Info -->
      <div class="profile-main">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-avatar">
            <img 
              :src="userProfile.avatar_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&dpr=1'" 
              :alt="userProfile.username || 'Profile'" 
            />
          </div>
          
          <div class="profile-info">
            <div class="profile-name-section">
              <h1 class="profile-name">{{ userProfile.username || 'Unnamed User' }}</h1>
              <button class="edit-btn">edit</button>
            </div>
            
            <div class="profile-address">
              <span class="address-text">{{ formatWalletAddress(userProfile.wallet_address) }}</span>
              <svg 
                class="copy-icon" 
                width="16" height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
                @click="copyAddress"
                style="cursor: pointer;"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <a 
                :href="`https://solscan.io/account/${userProfile.wallet_address}`" 
                target="_blank" 
                class="view-link"
              >
                view on solscan
              </a>
              <svg class="external-link" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15,3 21,3 21,9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-number">{{ userProfile.followers_count || 0 }}</span>
            <span class="stat-label">followers</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ userProfile.following_count || 0 }}</span>
            <span class="stat-label">following</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">0</span>
            <span class="stat-label">created coins</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="profile-tabs">
          <button 
            :class="['tab', { active: activeTab === 'balances' }]"
            @click="setActiveTab('balances')"
          >
            balances
          </button>
          <button 
            :class="['tab', { active: activeTab === 'replies' }]"
            @click="setActiveTab('replies')"
          >
            replies
          </button>
          <button 
            :class="['tab', { active: activeTab === 'notifications' }]"
            @click="setActiveTab('notifications')"
          >
            notifications
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <div v-if="activeTab === 'balances'" class="balances-content">
            <div class="balance-header">
              <span class="balance-label">coins</span>
              <span class="balance-label">mcap</span>
              <span class="balance-label">value</span>
            </div>
            
            <div class="balance-item">
              <div class="balance-coin">
                <div class="coin-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="16" fill="url(#solana-gradient)"/>
                    <path d="M8 12h16l-2-2H10l-2 2zm0 8h16l-2 2H10l-2-2zm16-4H8l2-2h12l2 2z" fill="white"/>
                    <defs>
                      <linearGradient id="solana-gradient" x1="0" y1="0" x2="32" y2="32">
                        <stop stop-color="#9945FF"/>
                        <stop offset="1" stop-color="#14F195"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div class="coin-info">
                  <span class="coin-name">Solana balance</span>
                  <span class="coin-amount">0.0459 SOL</span>
                </div>
              </div>
              <div class="balance-mcap">-</div>
              <div class="balance-value">$7</div>
            </div>
          </div>
          
          <div v-else-if="activeTab === 'replies'" class="replies-content">
            <div class="empty-state">
              <p>No replies yet</p>
            </div>
          </div>
          
          <div v-else-if="activeTab === 'notifications'" class="notifications-content">
            <div class="empty-state">
              <p>No notifications</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Who to Follow -->
      <div class="who-to-follow">
        <h3 class="follow-title">who to follow</h3>
        
        <div class="follow-suggestions">
          <div 
            v-for="user in suggestedUsers" 
            :key="user.id"
            class="follow-suggestion"
          >
            <div class="suggestion-info">
              <div class="suggestion-avatar">
                <img :src="user.avatar" :alt="user.name" />
              </div>
              <div class="suggestion-details">
                <span class="suggestion-name">{{ user.name }}</span>
                <span class="suggestion-followers">{{ user.followers }} followers</span>
              </div>
            </div>
            <button class="follow-btn">follow</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeTab = ref('balances')

// User profile state
const userProfile = ref(null)
const isLoading = ref(true)
const error = ref(null)

// Suggested users
const suggestedUsers = ref([
  {
    id: 1,
    name: 'Sol_reaper',
    followers: '1904',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=1'
  },
  {
    id: 2,
    name: 'tecro',
    followers: '1899',
    avatar: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=1'
  },
  {
    id: 3,
    name: 'fwogcto',
    followers: '1899',
    avatar: 'https://images.pexels.com/photos/33535/monkey-ape-thinking-mimic.jpg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=1'
  },
  {
    id: 4,
    name: 'TrojansDad',
    followers: '1894',
    avatar: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=1'
  },
  {
    id: 5,
    name: 'mogbrah',
    followers: '1891',
    avatar: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=1'
  }
])

// Get wallet address from route params or Phantom
const getWalletAddress = () => {
  // Сначала пробуем получить из параметров маршрута
  if (route.params.address) {
    return route.params.address
  }
  
  // Если нет в URL, пробуем получить из Phantom Wallet
  if (window.solana && window.solana.isConnected && window.solana.publicKey) {
    return window.solana.publicKey.toString()
  }
  
  return null
}

// Load user profile from backend
const loadUserProfile = async () => {
  try {
    isLoading.value = true
    error.value = null

    const walletAddress = getWalletAddress()
    
    if (!walletAddress) {
      error.value = 'Адрес кошелька не найден. Пожалуйста, подключите Phantom Wallet или укажите адрес в URL.'
      return
    }

    console.log('🔍 Загрузка профиля пользователя:', walletAddress)

    const response = await fetch(`http://localhost:3000/api/user/profile/${walletAddress}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Профиль пользователя загружен:', result.data.user)
      userProfile.value = result.data.user
    } else {
      throw new Error(result.message || 'Ошибка загрузки профиля')
    }
    
  } catch (err) {
    console.error('❌ Ошибка загрузки профиля:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

// Copy wallet address to clipboard
const copyAddress = async () => {
  if (userProfile.value?.wallet_address) {
    try {
      await navigator.clipboard.writeText(userProfile.value.wallet_address)
      console.log('✅ Адрес кошелька скопирован в буфер обмена')
    } catch (err) {
      console.error('❌ Ошибка копирования адреса:', err)
    }
  }
}

// Format wallet address for display
const formatWalletAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const setActiveTab = (tab) => {
  activeTab.value = tab
}

// Load profile on component mount
onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.user-profile {
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(66, 184, 131, 0.2);
  border-top: 3px solid #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #9ca3af;
  font-size: 16px;
  font-weight: 500;
}

/* Error State */
.error-container {
  display: flex;
  justify-content: center;
  padding: 64px 20px;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 400px;
}

.error-icon {
  color: #ef4444;
  width: 48px;
  height: 48px;
}

.error-title {
  color: #ffffff;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.error-message {
  color: #9ca3af;
  font-size: 16px;
  margin: 0;
  line-height: 1.5;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #42b883;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #369870;
  transform: translateY(-1px);
}

.retry-btn:active {
  transform: translateY(0);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profile-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 40px;
}

.profile-main {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 32px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.profile-name {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  word-break: break-word;
}

.edit-btn {
  padding: 8px 16px;
  background: rgba(100, 108, 255, 0.1);
  border: 1px solid rgba(100, 108, 255, 0.3);
  border-radius: 8px;
  color: #646cff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.edit-btn:hover {
  background: rgba(100, 108, 255, 0.2);
}

.profile-address {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 14px;
  flex-wrap: wrap;
}

.address-text {
  font-family: 'Monaco', 'Menlo', monospace;
}

.copy-icon,
.external-link {
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.copy-icon:hover,
.external-link:hover {
  color: #9ca3af;
}

.view-link {
  color: #42b883;
  text-decoration: none;
  font-weight: 500;
}

.view-link:hover {
  text-decoration: underline;
}

.profile-stats {
  display: flex;
  gap: 48px;
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
}

.stat-label {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 500;
  white-space: nowrap;
}

.profile-tabs {
  display: flex;
  gap: 2px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 24px;
}

.tab {
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  white-space: nowrap;
}

.tab.active {
  background: #42b883;
  color: #ffffff;
}

.tab-content {
  min-height: 200px;
}

.balance-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 20px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.balance-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  text-transform: lowercase;
}

.balance-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 20px;
  align-items: center;
  padding: 16px 0;
}

.balance-coin {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.coin-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.coin-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.coin-name {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
}

.coin-amount {
  font-size: 12px;
  color: #9ca3af;
  font-family: 'Monaco', 'Menlo', monospace;
}

.balance-mcap,
.balance-value {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
  font-size: 16px;
}

.who-to-follow {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  height: fit-content;
}

.follow-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 20px;
}

.follow-suggestions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.follow-suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.suggestion-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.suggestion-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.suggestion-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.suggestion-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.suggestion-name {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
  word-break: break-word;
}

.suggestion-followers {
  font-size: 12px;
  color: #9ca3af;
}

.follow-btn {
  padding: 6px 12px;
  background: #42b883;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.follow-btn:hover {
  background: #369870;
  transform: translateY(-1px);
}

/* Tablet Styles */
@media (max-width: 1024px) {
  .user-profile {
    padding: 30px;
  }
  
  .profile-container {
    gap: 30px;
  }
  
  .who-to-follow {
    width: 280px;
  }
  
  .profile-main {
    padding: 28px;
  }
  
  .profile-name {
    font-size: 28px;
  }
  
  .stat-number {
    font-size: 28px;
  }
  
  .profile-stats {
    gap: 40px;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .user-profile {
    padding: 20px;
  }
  
  .loading-container,
  .error-container {
    padding: 48px 20px;
  }
  
  .error-title {
    font-size: 20px;
  }
  
  .error-message {
    font-size: 14px;
  }
  
  .profile-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .profile-main {
    padding: 24px;
  }
  
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }
  
  .profile-info {
    width: 100%;
  }
  
  .profile-name-section {
    justify-content: center;
    gap: 12px;
  }
  
  .profile-name {
    font-size: 24px;
  }
  
  .profile-address {
    justify-content: center;
    gap: 6px;
    font-size: 13px;
  }
  
  .profile-stats {
    justify-content: center;
    gap: 32px;
    margin-bottom: 24px;
    padding-bottom: 24px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 13px;
  }
  
  .profile-tabs {
    margin-bottom: 20px;
  }
  
  .tab {
    padding: 10px 16px;
    font-size: 13px;
  }
  
  .balance-header,
  .balance-item {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .balance-header {
    display: none;
  }
  
  .balance-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 16px;
  }
  
  .balance-coin {
    gap: 10px;
  }
  
  .coin-icon {
    width: 28px;
    height: 28px;
  }
  
  .who-to-follow {
    padding: 20px;
  }
  
  .follow-title {
    font-size: 16px;
  }
  
  .follow-suggestions {
    gap: 14px;
  }
  
  .suggestion-avatar {
    width: 36px;
    height: 36px;
  }
  
  .suggestion-name {
    font-size: 13px;
  }
  
  .suggestion-followers {
    font-size: 11px;
  }
  
  .follow-btn {
    padding: 5px 10px;
    font-size: 11px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .user-profile {
    padding: 16px;
  }
  
  .profile-main {
    padding: 20px;
  }
  
  .profile-avatar {
    width: 70px;
    height: 70px;
  }
  
  .profile-name {
    font-size: 22px;
  }
  
  .edit-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .profile-address {
    font-size: 12px;
    gap: 4px;
  }
  
  .profile-stats {
    gap: 24px;
  }
  
  .stat-number {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .tab {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .balance-item {
    padding: 14px;
  }
  
  .coin-icon {
    width: 24px;
    height: 24px;
  }
  
  .coin-name {
    font-size: 13px;
  }
  
  .coin-amount {
    font-size: 11px;
  }
  
  .who-to-follow {
    padding: 16px;
  }
  
  .follow-title {
    font-size: 15px;
  }
  
  .suggestion-avatar {
    width: 32px;
    height: 32px;
  }
  
  .suggestion-name {
    font-size: 12px;
  }
  
  .suggestion-followers {
    font-size: 10px;
  }
}

/* Very Small Mobile */
@media (max-width: 360px) {
  .profile-main {
    padding: 16px;
  }
  
  .profile-avatar {
    width: 60px;
    height: 60px;
  }
  
  .profile-name {
    font-size: 20px;
  }
  
  .profile-stats {
    gap: 20px;
  }
  
  .stat-number {
    font-size: 18px;
  }
  
  .balance-item {
    padding: 12px;
  }
  
  .who-to-follow {
    padding: 14px;
  }
}
</style>