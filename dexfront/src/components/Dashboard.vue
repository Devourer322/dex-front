<template>
  <div class="dashboard">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <span class="loading-text">Loading tokens...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-content">
        <svg class="error-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 class="error-title">Failed to load tokens</h3>
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="loadTokens">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
          Retry
        </button>
      </div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Token Search -->
      <TokenSearch @token-selected="navigateToTokenChart" :tokens="tokens" />
      
      <!-- Now Trending Section -->
      <TrendingTokens @token-selected="navigateToTokenChart" :tokens="trendingTokens" />
      
      <!-- All Tokens Section -->
      <AllTokens @token-selected="navigateToTokenChart" :tokens="allTokens" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TokenSearch from './TokenSearch.vue'
import TrendingTokens from './TrendingTokens.vue'
import AllTokens from './AllTokens.vue'

const router = useRouter()

// Loading states
const isLoading = ref(true)
const error = ref(null)

// Token data
const tokens = ref([])
const trendingTokens = ref([])
const allTokens = ref([])

// Load tokens from API
const loadTokens = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await fetch('http://localhost:3000/api/token/all')
    
    if (!response.ok) {
      throw new Error(`Failed to load tokens: ${response.status}`)
    }

    const responseData = await response.json()
    
    // Проверяем новую структуру ответа: data.tokens вместо tokens
    if (responseData.success && responseData.data && responseData.data.tokens) {
      const apiTokens = responseData.data.tokens.map(token => ({
        id: token.id,
        name: token.name,
        ticker: token.symbol,
        symbol: token.symbol,
        description: token.description,
        image: token.image_url && token.image_url !== 'placeholder' 
          ? token.image_url 
          : 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/sol.svg',
        marketCap: generateMarketCap(),
        replies: Math.floor(Math.random() * 500),
        creator: token.user_pubkey ? token.user_pubkey.slice(0, 6) : 'Unknown',
        timeAgo: formatTimeAgo(token.createdAt),
        status: token.status,
        mintAddress: token.mint_address,
        isLive: token.status === 'created' && token.mint_address,
        supply: token.supply,
        decimals: token.decimals,
        telegram: token.telegram,
        twitter: token.twitter,
        website: token.website
      }))

      tokens.value = apiTokens
      
      // Разделяем токены: trending - это токены со статусом 'created' и mint_address
      trendingTokens.value = apiTokens
        .filter(token => token.status === 'created' && token.mintAddress)
        .slice(0, 6)
      
      // Все остальные токены
      allTokens.value = apiTokens
      
      console.log('Tokens loaded successfully:', {
        total: apiTokens.length,
        trending: trendingTokens.value.length,
        message: responseData.message
      })
    } else {
      console.warn('Unexpected response structure:', responseData)
      throw new Error('Invalid response structure from server')
    }
  } catch (err) {
    console.error('Failed to load tokens:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

// Helper functions
const generateMarketCap = () => {
  const value = Math.random() * 50000000 // До 50M
  if (value > 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value > 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  } else {
    return `$${value.toFixed(0)}`
  }
}

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }
}

const navigateToTokenChart = (token) => {
  if (token.mintAddress) {
    router.push(`/coin/${token.mintAddress}`)
  } else {
    console.warn('Token has no mint address:', token)
  }
}

// Load tokens on component mount
onMounted(() => {
  loadTokens()
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 32px;
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

/* Mobile Styles */
@media (max-width: 768px) {
  .dashboard {
    gap: 24px;
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
}
</style>
