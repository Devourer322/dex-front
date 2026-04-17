<template>
  <div class="trending-tokens">
    <div class="section-header">
      <h2 class="section-title">now trending</h2>
      <div class="navigation-arrows">
        <button class="nav-arrow" @click="scrollLeft">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        <button class="nav-arrow" @click="scrollRight">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="trending-container">
      <div v-if="tokens.length === 0" class="no-tokens">
        <p>No trending tokens available</p>
      </div>
      <div class="trending-grid">
        <div 
          v-for="token in displayedTokens" 
          :key="token.id"
          class="trending-card"
          @click="selectToken(token)"
        >
          <div class="token-header">
            <div class="token-avatar">
              <img :src="token.image" :alt="token.name" />
            </div>
            <div class="token-info">
              <h3 class="token-name">{{ token.name }}</h3>
              <span class="token-ticker">({{ token.ticker }})</span>
            </div>
          </div>
          
          <div class="token-stats">
            <div class="stat-item">
              <span class="stat-label">market cap:</span>
              <span class="stat-value">{{ token.marketCap }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">replies:</span>
              <span class="stat-value">{{ token.replies }}</span>
            </div>
          </div>
          
          <p class="token-description">{{ token.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  tokens: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['token-selected'])

// Reactive window width
const windowWidth = ref(window.innerWidth)

// Update window width on resize
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

// Computed property to limit displayed tokens based on screen size
const displayedTokens = computed(() => {
  let maxTokens = 4 // Default for desktop
  
  if (windowWidth.value < 360) {
    maxTokens = 1 // Very small mobile
  } else if (windowWidth.value < 480) {
    maxTokens = 2 // Small mobile
  } else if (windowWidth.value < 768) {
    maxTokens = 2 // Mobile
  } else if (windowWidth.value < 1024) {
    maxTokens = 3 // Tablet
  }
  
  return props.tokens.slice(0, maxTokens)
})

const selectToken = (token) => {
  console.log('Selected token:', token)
  emit('token-selected', token)
}

// Keep navigation functions for potential future use
const scrollLeft = () => {
  // Functionality can be added later if needed
}

const scrollRight = () => {
  // Functionality can be added later if needed
}
</script>

<style scoped>
.trending-tokens {
  margin-bottom: 48px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  text-transform: lowercase;
}

.navigation-arrows {
  display: flex;
  gap: 8px;
}

.nav-arrow {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #9ca3af;
}

.nav-arrow:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.trending-container {
  width: 100%;
}

.trending-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.no-tokens {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.trending-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.trending-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(100, 108, 255, 0.3);
  box-shadow: 0 12px 24px rgba(100, 108, 255, 0.1);
}

.token-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.token-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.token-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.token-info {
  flex: 1;
  min-width: 0;
}

.token-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-ticker {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 500;
}

.token-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: #ffffff;
  font-weight: 600;
}

.token-description {
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Tablet Styles */
@media (max-width: 1024px) {
  .trending-tokens {
    margin-bottom: 40px;
  }
  
  .section-title {
    font-size: 22px;
  }
  
  .trending-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
  
  .trending-card {
    padding: 18px;
  }
  
  .token-header {
    margin-bottom: 14px;
  }
  
  .token-avatar {
    width: 44px;
    height: 44px;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .trending-tokens {
    margin-bottom: 32px;
  }
  
  .section-header {
    margin-bottom: 20px;
    padding: 0 4px;
  }
  
  .section-title {
    font-size: 20px;
  }
  
  .navigation-arrows {
    gap: 6px;
  }
  
  .nav-arrow {
    width: 32px;
    height: 32px;
  }
  
  .trending-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .trending-card {
    padding: 16px;
  }
  
  .token-header {
    gap: 10px;
    margin-bottom: 12px;
  }
  
  .token-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }
  
  .token-name {
    font-size: 15px;
  }
  
  .token-ticker {
    font-size: 13px;
  }
  
  .token-stats {
    gap: 12px;
    margin-bottom: 10px;
  }
  
  .stat-label {
    font-size: 11px;
  }
  
  .stat-value {
    font-size: 13px;
  }
  
  .token-description {
    font-size: 13px;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .section-header {
    padding: 0 2px;
  }
  
  .section-title {
    font-size: 18px;
  }
  
  .nav-arrow {
    width: 28px;
    height: 28px;
  }
  
  .trending-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .trending-card {
    padding: 14px;
  }
  
  .token-header {
    gap: 8px;
    margin-bottom: 10px;
  }
  
  .token-avatar {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }
  
  .token-name {
    font-size: 14px;
  }
  
  .token-ticker {
    font-size: 12px;
  }
  
  .token-stats {
    gap: 10px;
    margin-bottom: 8px;
  }
  
  .token-description {
    font-size: 12px;
  }
}

/* Very Small Mobile */
@media (max-width: 360px) {
  .trending-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .trending-card {
    padding: 12px;
  }
  
  .token-avatar {
    width: 32px;
    height: 32px;
  }
  
  .token-name {
    font-size: 13px;
  }
  
  .token-ticker {
    font-size: 11px;
  }
}
</style>