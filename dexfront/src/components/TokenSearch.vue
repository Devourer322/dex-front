<template>
  <div class="token-search">
    <div class="search-container">
      <div class="search-input-wrapper">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="search for token"
          class="search-input"
          @input="handleSearch"
          @keyup.enter="performSearch"
        />
      </div>
      <button class="search-button" @click="performSearch">
        search
      </button>
    </div>
    
    <!-- Search Results -->
    <div v-if="showResults && searchResults.length > 0" class="search-results">
      <div 
        v-for="token in searchResults" 
        :key="token.id"
        class="search-result-item"
        @click="selectToken(token)"
      >
        <div class="result-avatar">
          <img :src="token.image" :alt="token.name" />
        </div>
        <div class="result-info">
          <span class="result-name">{{ token.name }}</span>
          <span class="result-ticker">({{ token.ticker }})</span>
          <span class="result-market-cap">{{ token.marketCap }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const searchQuery = ref('')
const showResults = ref(false)
const router = useRouter()

const emit = defineEmits(['token-selected'])

// Mock search results
const searchResults = ref([
  {
    id: 1,
    name: 'insider stock',
    ticker: 'insider',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=1',
    marketCap: '$33,692'
  },
  {
    id: 2,
    name: 'monke',
    ticker: 'monke',
    image: 'https://images.pexels.com/photos/33535/monkey-ape-thinking-mimic.jpg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=1',
    marketCap: '$2.7M'
  },
  {
    id: 3,
    name: 'HULK FUCKS',
    ticker: 'HULKED',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=1',
    marketCap: '$2.8M'
  }
])

const handleSearch = () => {
  // Show results when user types
  if (searchQuery.value.length > 0) {
    showResults.value = true
  } else {
    showResults.value = false
  }
  console.log('Searching for:', searchQuery.value)
}

const performSearch = () => {
  // Perform search action
  if (searchQuery.value.length > 0) {
    showResults.value = true
    console.log('Performing search for:', searchQuery.value)
  }
}

const selectToken = (token) => {
  console.log('Selected token from search:', token)
  searchQuery.value = ''
  showResults.value = false
  emit('token-selected', token)
  router.push('/coin')
}
</script>

<style scoped>
.token-search {
  margin-bottom: 48px;
  position: relative;
}

.search-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #6b7280;
  z-index: 1;
  display: block;
  width: 20px;
  height: 20px;
}

.search-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 400;
  outline: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.search-input::placeholder {
  color: #6b7280;
}

.search-input:focus {
  border-color: rgba(100, 108, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.search-button {
  padding: 16px 24px;
  background: linear-gradient(135deg, #42b883 0%, #369870 100%);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: lowercase;
  white-space: nowrap;
}

.search-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(66, 184, 131, 0.4);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  background: rgba(26, 27, 35, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 8px;
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.result-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.result-name {
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
}

.result-ticker {
  color: #9ca3af;
  font-size: 14px;
}

.result-market-cap {
  color: #42b883;
  font-size: 12px;
  font-weight: 500;
  margin-left: auto;
}

/* Tablet Styles */
@media (max-width: 1024px) {
  .token-search {
    margin-bottom: 40px;
  }
  
  .search-container {
    max-width: 500px;
    gap: 10px;
  }
  
  .search-input {
    padding: 14px 14px 14px 44px;
    font-size: 15px;
  }
  
  .search-icon {
    left: 14px;
    width: 18px;
    height: 18px;
  }
  
  .search-button {
    padding: 14px 20px;
    font-size: 15px;
  }
  
  .search-results {
    max-width: 500px;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .token-search {
    margin-bottom: 32px;
  }
  
  .search-container {
    flex-direction: column;
    gap: 16px;
    max-width: 100%;
    padding: 0 4px;
  }
  
  .search-input-wrapper {
    width: 100%;
  }
  
  .search-input {
    padding: 14px 14px 14px 42px;
    font-size: 16px;
    border-radius: 10px;
  }
  
  .search-icon {
    left: 12px;
    width: 18px;
    height: 18px;
  }
  
  .search-button {
    width: 100%;
    padding: 14px 20px;
    font-size: 16px;
    border-radius: 10px;
  }
  
  .search-results {
    width: calc(100% - 8px);
    max-width: none;
    left: 4px;
    transform: none;
  }
  
  .search-result-item {
    padding: 10px 12px;
  }
  
  .result-avatar {
    width: 36px;
    height: 36px;
  }
  
  .result-name,
  .result-ticker {
    font-size: 13px;
  }
  
  .result-market-cap {
    font-size: 11px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .token-search {
    margin-bottom: 24px;
  }
  
  .search-container {
    gap: 12px;
    padding: 0 2px;
  }
  
  .search-input {
    padding: 12px 12px 12px 38px;
    font-size: 15px;
  }
  
  .search-icon {
    left: 10px;
    width: 16px;
    height: 16px;
  }
  
  .search-button {
    padding: 12px 18px;
    font-size: 15px;
  }
  
  .search-results {
    width: calc(100% - 4px);
    left: 2px;
  }
  
  .search-result-item {
    padding: 8px 10px;
  }
  
  .result-avatar {
    width: 32px;
    height: 32px;
  }
  
  .result-name,
  .result-ticker {
    font-size: 12px;
  }
  
  .result-market-cap {
    font-size: 10px;
  }
}

/* Very Small Mobile */
@media (max-width: 360px) {
  .search-input {
    padding: 10px 10px 10px 34px;
    font-size: 14px;
  }
  
  .search-icon {
    left: 8px;
    width: 14px;
    height: 14px;
  }
  
  .search-button {
    padding: 10px 16px;
    font-size: 14px;
  }
}
</style>