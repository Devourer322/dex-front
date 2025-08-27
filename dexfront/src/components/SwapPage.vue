<template>
  <div class="swap-page">
    <div class="swap-container">
      <!-- Settings Button -->
      <div class="swap-header">
        <button class="settings-btn" @click="openSettings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6"/>
            <path d="m21 12-6-6-6 6-6-6"/>
          </svg>
        </button>
      </div>

      <!-- Swap Form -->
      <div class="swap-form">
        <!-- Sell Section -->
        <div class="swap-section">
          <div class="section-header">
            <span class="section-label">Sell</span>
          </div>
          <div class="input-container">
            <input 
              v-model="sellAmount"
              type="number" 
              placeholder="0"
              class="amount-input"
            />
            <div class="token-selector" @click="openTokenSelector('sell')">
              <div class="token-info">
                <div class="token-icon">
                  <img v-if="selectedSellToken.image" :src="selectedSellToken.image" :alt="selectedSellToken.name" />
                  <svg v-else width="20" height="20" viewBox="0 0 32 32" fill="none">
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
                <span class="token-symbol">{{ selectedSellToken.symbol }}</span>
              </div>
              <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Swap Arrow -->
        <div class="swap-arrow-container">
          <button class="swap-arrow-btn" @click="swapTokens">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <polyline points="19,12 12,19 5,12"/>
            </svg>
          </button>
        </div>

        <!-- Buy Section -->
        <div class="swap-section">
          <div class="section-header">
            <span class="section-label">Buy</span>
          </div>
          <div class="input-container">
            <input 
              v-model="buyAmount"
              type="number" 
              placeholder="0"
              class="amount-input"
              readonly
            />
            <div class="token-selector" @click="openTokenSelector('buy')">
              <div class="token-info">
                <div v-if="selectedBuyToken" class="token-icon">
                  <img v-if="selectedBuyToken.image" :src="selectedBuyToken.image" :alt="selectedBuyToken.name" />
                  <div v-else class="token-placeholder">{{ selectedBuyToken.symbol.charAt(0) }}</div>
                </div>
                <span class="token-symbol">{{ selectedBuyToken ? selectedBuyToken.symbol : 'Select token' }}</span>
              </div>
              <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="swapError" class="error-message">
          {{ swapError }}
        </div>

        <!-- Swap Button -->
        <button 
          v-if="getWalletPublicKey()"
          class="swap-btn" 
          @click="executeSwap"
          :disabled="!canSwap"
        >
          <span v-if="isSwapping">
            <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            Swapping...
          </span>
          <span v-else>
            {{ canSwap ? 'Swap' : 'Enter amount' }}
          </span>
        </button>

        <!-- Connect Wallet Button -->
        <button v-else class="connect-wallet-btn" @click="connectWallet">
          Connect wallet
        </button>

        <!-- Init Pool Button -->
        <!--<button class="init-pool-btn" @click="initPool" :disabled="isInitializingPool">
          <span v-if="isInitializingPool">
            <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            Initializing Pool...
          </span>
          <span v-else>
            Initialize Pool
          </span>
        </button>-->

        <!-- Swap Details (when tokens are selected) -->
        <div v-if="showSwapDetails" class="swap-details">
          <div class="detail-row">
            <span class="detail-label">Rate</span>
            <span class="detail-value">1 {{ selectedSellToken.symbol }} = {{ exchangeRate }} {{ selectedBuyToken?.symbol }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Price Impact</span>
            <span class="detail-value">< 0.1%</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Minimum received</span>
            <span class="detail-value">{{ minimumReceived }} {{ selectedBuyToken?.symbol }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Network fee</span>
            <span class="detail-value">~0.00025 SOL</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettings" class="settings-modal" @click="closeSettings">
      <div class="settings-content" @click.stop>
        <div class="settings-header">
          <h3>swap settings</h3>
        </div>
        
        <!-- Slippage Section -->
        <div class="settings-section">
          <h4 class="settings-section-title">slippage</h4>
          
          <div class="slippage-options">
            <button 
              :class="['slippage-btn', { active: slippageSettings.selected === '0.5%' }]"
              @click="setSlippage('0.5%')"
            >
              0.5%
            </button>
            <button 
              :class="['slippage-btn', { active: slippageSettings.selected === '1%' }]"
              @click="setSlippage('1%')"
            >
              1%
            </button>
            <div class="custom-slippage">
              <input 
                v-model="slippageSettings.custom"
                type="number" 
                step="0.01"
                min="0"
                max="50"
                class="custom-slippage-input"
                placeholder="0.00"
                @input="setSlippage('custom')"
              />
              <span class="percent-symbol">%</span>
            </div>
          </div>
          
          <p class="settings-description">
            this is the maximum amount of slippage you are willing to accept when placing trades.
          </p>
        </div>

        <!-- Speed Section -->
        <div class="settings-section">
          <h4 class="settings-section-title">speed</h4>
          
          <div class="speed-options">
            <button 
              :class="['speed-btn', { active: speedSettings.selected === 'fast' }]"
              @click="setSpeed('fast')"
            >
              fast
            </button>
            <button 
              :class="['speed-btn', { active: speedSettings.selected === 'turbo' }]"
              @click="setSpeed('turbo')"
            >
              turbo
            </button>
            <button 
              :class="['speed-btn', { active: speedSettings.selected === 'ultra' }]"
              @click="setSpeed('ultra')"
            >
              ultra
            </button>
          </div>
          
          <p class="settings-description">
            higher speeds will increase your priority fees, making your transactions confirm faster.
          </p>
        </div>

        <!-- Front-running Protection Section -->
        <div class="settings-section">
          <h4 class="settings-section-title">front-running protection</h4>
          
          <div class="protection-options">
            <button 
              :class="['protection-btn', { active: protectionSettings.enabled === false }]"
              @click="setProtection(false)"
            >
              on
            </button>
            <button 
              :class="['protection-btn', { active: protectionSettings.enabled === true }]"
              @click="setProtection(true)"
            >
              off
            </button>
          </div>
          
          <p class="settings-description">
            front-running protection decreases the chances of bots from front-running your buys. you can use high slippage with front-running protection turned on. we recommend setting a tip amount of at least 0.01 SOL with front-running protection enabled.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="settings-actions">
          <button class="close-settings-btn" @click="closeSettings">
            [close]
          </button>
          <button class="apply-settings-btn" @click="applySettings">
            apply
          </button>
        </div>
      </div>
    </div>

    <!-- Token Selector Modal -->
    <div v-if="showTokenSelector" class="token-selector-modal" @click="closeTokenSelector">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Select a token</h3>
          <button class="close-btn" @click="closeTokenSelector">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="search-container">
          <input 
            v-model="tokenSearch"
            type="text" 
            placeholder="Search name or paste address"
            class="token-search-input"
          />
        </div>

        <div class="token-list">
          <div 
            v-for="token in filteredTokens" 
            :key="token.symbol"
            class="token-item"
            @click="selectToken(token)"
          >
            <div class="token-item-info">
              <div class="token-item-icon">
                <img v-if="token.image" :src="token.image" :alt="token.name" />
                <div v-else class="token-placeholder">{{ token.symbol.charAt(0) }}</div>
              </div>
              <div class="token-item-details">
                <span class="token-item-name">{{ token.name }}</span>
                <span class="token-item-symbol">{{ token.symbol }}</span>
              </div>
            </div>
            <div class="token-item-balance">
              {{ token.balance || '0' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import { Transaction, VersionedTransaction, Connection } from '@solana/web3.js'
import { Buffer } from 'buffer';

// Form state
const sellAmount = ref('')
const buyAmount = ref('')
const selectedSellToken = ref({
  symbol: 'SOL',
  name: 'Solana',
  address: 'So11111111111111111111111111111111111111112',
  image: null,
  balance: '0.0459'
})
const selectedBuyToken = ref(null)

// Modal state
const showTokenSelector = ref(false)
const tokenSelectorType = ref('') // 'sell' or 'buy'
const tokenSearch = ref('')

// Settings modal state
const showSettings = ref(false)

// Swap state
const isSwapping = ref(false)
const swapError = ref('')
const isInitializingPool = ref(false)

// Settings state
const slippageSettings = ref({
  selected: '0.5%',
  custom: ''
})

const speedSettings = ref({
  selected: 'turbo'
})

const protectionSettings = ref({
  enabled: true // true = off, false = on
})

// Available tokens with their contract addresses
const availableTokens = ref([
  {
    symbol: 'SOL',
    name: 'Solana',
    address: 'So11111111111111111111111111111111111111112',
    image: null,
    balance: '0.0459'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: 'GYreuLDxgg9xXGuj2UgwPEEQW5P5iDNVqBB7Joy4sYUB',
    image: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    balance: '0'
  },
  {
    symbol: 'RAY',
    name: 'Raydium',
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    balance: '0'
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    balance: '0'
  },
  {
    symbol: 'WIF',
    name: 'dogwifhat',
    address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    image: 'https://images.pexels.com/photos/33535/monkey-ape-thinking-mimic.jpg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    balance: '0'
  },
  {
    symbol: 'JUP',
    name: 'Jupiter',
    address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    balance: '0'
  }
])

// Computed properties
const filteredTokens = computed(() => {
  if (!tokenSearch.value) return availableTokens.value
  
  return availableTokens.value.filter(token => 
    token.name.toLowerCase().includes(tokenSearch.value.toLowerCase()) ||
    token.symbol.toLowerCase().includes(tokenSearch.value.toLowerCase())
  )
})

const showSwapDetails = computed(() => {
  return selectedBuyToken.value && sellAmount.value && parseFloat(sellAmount.value) > 0
})

const exchangeRate = computed(() => {
  // Mock exchange rate calculation
  return selectedBuyToken.value ? '150.25' : '0'
})

const minimumReceived = computed(() => {
  if (!sellAmount.value || !selectedBuyToken.value) return '0'
  const amount = parseFloat(sellAmount.value) * parseFloat(exchangeRate.value) * 0.995
  return amount.toFixed(6)
})

const canSwap = computed(() => {
  return selectedBuyToken.value && 
         selectedSellToken.value && 
         sellAmount.value && 
         parseFloat(sellAmount.value) > 0 &&
         !isSwapping.value
})

// Wallet state - we'll need to get this from the Phantom wallet component
const getWalletPublicKey = () => {
  // Try to get the wallet address from window.solana if connected
  if (window.solana && window.solana.isConnected && window.solana.publicKey) {
    return window.solana.publicKey.toString()
  }
  return null
}

// Check if pool exists function
const checkPoolExists = async (poolAddress) => {
  try {
    const connection = new Connection('https://api.devnet.solana.com')
    const poolInfo = await connection.getAccountInfo(poolAddress)
    return poolInfo !== null
  } catch (error) {
    console.warn('Error checking pool existence:', error)
    return false
  }
}

// Swap function
const executeSwap = async () => {
  if (!canSwap.value) return

  const userPubkey = getWalletPublicKey()
  if (!userPubkey) {
    swapError.value = 'Please connect your Phantom wallet first'
    return
  }

  isSwapping.value = true
  swapError.value = ''

  try {
    const swapRequest = {
      from_token: selectedSellToken.value.address,
      to_token: selectedBuyToken.value.address,
      amount: parseFloat(sellAmount.value),
      user_pubkey: userPubkey
    }

    console.log('Sending swap request:', swapRequest)

    const response = await fetch('https://launchpad-wl8n.onrender.com/api/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapRequest)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Swap successful:', result)

    // Исправляем получение transaction_base64 вместо tx_base64
    const txBase64 = result.transaction_base64 || result.tx_base64
    console.log('Received transaction_base64:', txBase64)
    
    // Валидируем base64 строку перед декодированием
    if (!txBase64 || typeof txBase64 !== 'string') {
      throw new Error('Invalid transaction data received from server')
    }

    // Проверяем подключение Phantom
    if (!window.solana || !window.solana.isConnected) {
      throw new Error('Phantom wallet not connected. Please connect your wallet first.')
    }

    // Показываем пользователю детали транзакции для подтверждения
    const confirmMessage = `🔄 Confirm Swap Transaction:

${result.instructions}

Expected output: ${result.estimated_output} tokens
Pool: ${result.swap_pool}

Press OK to proceed with Phantom Wallet signature.`
    
    const userConfirmed = confirm(confirmMessage)
    if (!userConfirmed) {
      throw new Error('Transaction cancelled by user')
    }

    // Создаем транзакцию из base64
    try {
      console.log('Creating Solana transaction from base64...')
      
      // Декодируем base64 в байты
      const txBytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0))
      console.log('Decoded transaction bytes length:', txBytes.length)
      
      let transaction
      
      // Пробуем создать VersionedTransaction
      try {
        const { VersionedTransaction } = await import('@solana/web3.js')
        transaction = VersionedTransaction.deserialize(txBytes)
        console.log('Successfully created VersionedTransaction')
        console.log('Transaction details:', transaction)
      } catch (versionedError) {
        console.log('Failed to create VersionedTransaction, trying Legacy Transaction...')
        
        // Если не получается, пробуем Legacy Transaction
        const { Transaction } = await import('@solana/web3.js')
        transaction = Transaction.from(txBytes)
        console.log('Successfully created Legacy Transaction')
      }

      console.log('Transaction created, requesting signature from Phantom...')
      
      // Проверяем подключение к правильной сети
      if (window.solana && window.solana.isConnected) {
        try {
          // Получаем информацию о сети от Phantom
          const network = await window.solana.request({ method: 'wallet_getNetwork' }).catch(() => null)
          console.log('Phantom network:', network)
          
          if (network && network !== 'devnet') {
            const switchNetwork = confirm(`⚠️ Network Mismatch Detected!
            
Your Phantom wallet is connected to: ${network}
This transaction is for: devnet

Would you like to continue anyway? 
(Note: Transaction may fail if networks don't match)`)
            
            if (!switchNetwork) {
              throw new Error('Transaction cancelled due to network mismatch')
            }
          }
        } catch (networkError) {
          console.warn('Could not check network:', networkError)
        }
      }
      
      // Подписываем и отправляем транзакцию
      try {
        console.log('Requesting signature and sending transaction...')
        
        // Метод 1: Пробуем signAndSendTransaction (рекомендуется)
        try {
          const result = await window.solana.signAndSendTransaction(transaction)
          console.log('✅ Transaction signed and sent successfully!')
          console.log('Transaction result:', result)
          console.log('🔗 Transaction signature:', result.signature)
          console.log('🌐 Explorer link:', `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`)
          
          alert(`🎉 Swap successful!\n\nTransaction: ${result.signature}\n\nCheck it on Solana Explorer:\nhttps://explorer.solana.com/tx/${result.signature}?cluster=devnet`)
          
          // Очищаем форму после успешной транзакции
          sellAmount.value = ''
          buyAmount.value = ''
          selectedBuyToken.value = null
          
        } catch (sendError) {
          console.log('signAndSendTransaction failed, trying sign + manual send...')
          
          // Метод 2: Подписываем отдельно и отправляем через RPC
          const signedTransaction = await window.solana.signTransaction(transaction)
          console.log('✅ Transaction signed successfully!')
          
          // Создаем connection для отправки
          const connection = new Connection('https://api.devnet.solana.com', 'processed')
          
          // Отправляем подписанную транзакцию
          console.log('📤 Sending signed transaction to network...')
          const signature = await connection.sendRawTransaction(signedTransaction.serialize())
          console.log('✅ Transaction sent! Signature:', signature)
          
          // Ждем подтверждения
          console.log('⏳ Waiting for confirmation...')
          const confirmation = await connection.confirmTransaction(signature, 'processed')
          
          if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
          }
          
          console.log('✅ Transaction confirmed!')
          console.log('🌐 Explorer link:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
          
          alert(`🎉 Swap successful!\n\nTransaction: ${signature}\n\nCheck it on Solana Explorer:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`)
          
          // Очищаем форму после успешной транзакции
          sellAmount.value = ''
          buyAmount.value = ''
          selectedBuyToken.value = null
        }
        
      } catch (signError) {
        console.error('Transaction error:', signError)
        throw new Error(`Transaction failed: ${signError.message}`)
      }
      
    } catch (phantomError) {
      console.error('Phantom Wallet error:', phantomError)
      
      // Улучшенная обработка ошибок Phantom
      if (phantomError.message.includes('User rejected') || phantomError.code === 4001) {
        throw new Error('Transaction was rejected by user in Phantom Wallet')
      } else if (phantomError.message.includes('insufficient funds')) {
        throw new Error('Insufficient SOL balance for transaction fees')
      } else if (phantomError.message.includes('Wallet not connected')) {
        throw new Error('Phantom Wallet is not connected. Please connect your wallet.')
      } else if (phantomError.message.includes('network mismatch')) {
        throw new Error('Network mismatch: Please switch Phantom to Devnet')
      } else if (phantomError.message.includes('Unexpected error')) {
        throw new Error('Phantom Wallet error: Try refreshing the page or reconnecting your wallet')
      } else {
        throw new Error('Failed to sign transaction with Phantom: ' + phantomError.message)
      }
    }

    // Reset form after successful swap
    sellAmount.value = ''
    buyAmount.value = ''
    selectedBuyToken.value = null

  } catch (error) {
    console.error('Swap failed:', error)
    swapError.value = error.message || 'Failed to execute swap. Please try again.'
  } finally {
    isSwapping.value = false
  }
}

// Settings methods
const openSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const setSlippage = (value) => {
  slippageSettings.value.selected = value
  if (value !== 'custom') {
    slippageSettings.value.custom = ''
  }
}

const setSpeed = (value) => {
  speedSettings.value.selected = value
}

const setProtection = (value) => {
  protectionSettings.value.enabled = value
}

const applySettings = () => {
  console.log('Applied settings:', {
    slippage: slippageSettings.value,
    speed: speedSettings.value,
    protection: protectionSettings.value
  })
  closeSettings()
}

// Token selector methods
const openTokenSelector = (type) => {
  tokenSelectorType.value = type
  showTokenSelector.value = true
  tokenSearch.value = ''
}

const closeTokenSelector = () => {
  showTokenSelector.value = false
  tokenSelectorType.value = ''
  tokenSearch.value = ''
}

const selectToken = (token) => {
  if (tokenSelectorType.value === 'sell') {
    selectedSellToken.value = token
  } else {
    selectedBuyToken.value = token
    // Calculate buy amount based on sell amount
    if (sellAmount.value) {
      buyAmount.value = (parseFloat(sellAmount.value) * parseFloat(exchangeRate.value)).toFixed(6)
    }
  }
  closeTokenSelector()
}

const swapTokens = () => {
  const temp = selectedSellToken.value
  selectedSellToken.value = selectedBuyToken.value
  selectedBuyToken.value = temp
  
  const tempAmount = sellAmount.value
  sellAmount.value = buyAmount.value
  buyAmount.value = tempAmount
}

const connectWallet = () => {
  if (window.solana && window.solana.isPhantom) {
    window.solana.connect().catch(err => {
      console.error('Failed to connect wallet:', err)
    })
  } else {
    alert('Phantom wallet not found! Please install Phantom wallet extension.')
  }
}

// Initialize pool function
const initPool = async () => {
  isInitializingPool.value = true
  swapError.value = ''

  try {
    const poolRequest = {
      authority_pubkey: getWalletPublicKey(),
      token_a_mint: "So11111111111111111111111111111111111111112",
      token_b_mint: "GYreuLDxgg9xXGuj2UgwPEEQW5P5iDNVqBB7Joy4sYUB",
      fee_rate: 300
    }

    console.log('Sending pool initialization request:', poolRequest)

    const response = await fetch('http://localhost:3001/api/init-pool', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(poolRequest)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    // ✅ ИСПРАВЛЕНИЕ: Вызываем response.json() только ОДИН раз
    const data = await response.json();
    console.log('Pool initialization response:', data)

    // ✅ ИСПРАВЛЕНИЕ: Проверяем что у нас есть необходимые данные
    if (!data.transaction_base64) {
      throw new Error('No transaction data received from server')
    }

    // ✅ ИСПРАВЛЕНИЕ: Добавляем try-catch для создания транзакции
    let transaction
    try {
      transaction = Transaction.from(
        Buffer.from(data.transaction_base64, 'base64')
      );
    } catch (txError) {
      console.error('Failed to parse transaction:', txError)
      throw new Error('Invalid transaction data received from server')
    }

    console.log('Sending transaction to Phantom for signing...')

    // ✅ ИСПРАВЛЕНИЕ: Добавляем больше деталей в обработку ошибок Phantom
    let signature
    try {
      signature = await window.solana.signAndSendTransaction(transaction);
      console.log('Transaction sent:', signature.signature);
    } catch (phantomError) {
      console.error('Phantom error details:', phantomError)
      
      // Обработка "Unexpected error" - пробуем альтернативные методы
      if (phantomError.message && phantomError.message.includes('Unexpected error')) {
        console.log('Trying alternative signing method due to unexpected error...')
        
        try {
          // Пробуем только подпись без отправки
          const signedTx = await window.solana.signTransaction(transaction)
          console.log('Transaction signed successfully with alternative method')
          
          // Показываем пользователю что транзакция подписана
          const successMessage = `Transaction signed successfully!

Pool Address: ${data.pool_address}
Vault A: ${data.vault_a_address}
Vault B: ${data.vault_b_address}

Note: Transaction was signed but needs to be sent manually or the pool may already exist.`

          alert(successMessage)
          return // Выходим успешно
          
        } catch (signOnlyError) {
          console.error('Sign-only method also failed:', signOnlyError)
          throw new Error('Phantom wallet encountered an unexpected error. Please try refreshing the page and reconnecting your wallet.')
        }
      }
      
      // Стандартная обработка других ошибок
      if (phantomError.message && phantomError.message.includes('User rejected')) {
        throw new Error('Transaction was rejected by user')
      } else if (phantomError.message && phantomError.message.includes('insufficient')) {
        throw new Error('Insufficient SOL balance for transaction')
      } else if (phantomError.code === 4001) {
        throw new Error('Transaction was rejected by user')
      } else {
        throw new Error(`Phantom error: ${phantomError.message || 'Unknown error'}`)
      }
    }

    // Дожидаемся подтверждения только если у нас есть signature
    if (signature && signature.signature) {
      const connection = new Connection('https://api.devnet.solana.com');
      
      console.log('Waiting for transaction confirmation...')
      try {
        await connection.confirmTransaction(signature.signature, 'confirmed');
        console.log('Transaction confirmed!')
      } catch (confirmError) {
        console.warn('Confirmation timeout (transaction may still be valid):', confirmError)
        // Не прерываем выполнение
      }

      // Показываем успешное сообщение с подробностями
      const successMessage = `Pool initialized successfully!

Transaction: ${signature.signature}
Pool Address: ${data.pool_address || 'N/A'}
Vault A: ${data.vault_a_address || 'N/A'}  
Vault B: ${data.vault_b_address || 'N/A'}

Network: ${data.network || 'devnet'}`

      alert(successMessage)

      // Проверяем что пул создался (асинхронно)
      if (data.pool_address) {
        setTimeout(async () => {
          try {
            const poolExists = await checkPoolExists(data.pool_address)
            if (poolExists) {
              console.log('✅ Pool verified to exist on-chain!')
            } else {
              console.warn('⚠️ Pool not found yet, may need more time to confirm')
            }
          } catch (checkError) {
            console.warn('Could not verify pool existence:', checkError)
          }
        }, 5000) // Проверяем через 5 секунд
      }
    }

  } catch (error) {
    console.error('Pool initialization failed:', error)
    swapError.value = error.message || 'Failed to initialize pool. Please try again.'
  } finally {
    isInitializingPool.value = false
  }
}

// Watch sell amount changes
watch(sellAmount, (newAmount) => {
  if (selectedBuyToken.value && newAmount) {
    buyAmount.value = (parseFloat(newAmount) * parseFloat(exchangeRate.value)).toFixed(6)
  } else {
    buyAmount.value = ''
  }
})
</script>

<style scoped>
.swap-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 40px 20px;
}

.swap-container {
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.swap-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.settings-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #9ca3af;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.swap-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.swap-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
}

.section-header {
  margin-bottom: 12px;
}

.section-label {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 500;
}

.input-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.amount-input {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 32px;
  font-weight: 600;
  outline: none;
  flex: 1;
  min-width: 0;
}

.amount-input::placeholder {
  color: #4b5563;
}

.token-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  flex-shrink: 0;
}

.token-selector:hover {
  background: rgba(255, 255, 255, 0.08);
}

.token-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.token-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.token-symbol {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
}

.dropdown-arrow {
  color: #9ca3af;
  flex-shrink: 0;
}

.swap-arrow-container {
  display: flex;
  justify-content: center;
  margin: -8px 0;
  position: relative;
  z-index: 1;
}

.swap-arrow-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #9ca3af;
}

.swap-arrow-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  transform: rotate(180deg);
}

.connect-wallet-btn {
  width: 100%;
  padding: 16px;
  background: #42b883;
  border: none;
  border-radius: 16px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 20px;
}

.connect-wallet-btn:hover {
  background: #369870;
  transform: translateY(-2px);
}

.init-pool-btn {
  width: 100%;
  padding: 16px;
  background: #8b5cf6;
  border: none;
  border-radius: 16px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.init-pool-btn:hover:not(:disabled) {
  background: #7c3aed;
  transform: translateY(-2px);
}

.init-pool-btn:disabled {
  background: #6b7280;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.swap-btn {
  width: 100%;
  padding: 16px;
  background: #42b883;
  border: none;
  border-radius: 16px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.swap-btn:hover:not(:disabled) {
  background: #369870;
  transform: translateY(-2px);
}

.swap-btn:disabled {
  background: rgba(66, 184, 131, 0.5);
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.swap-details {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 14px;
  color: #9ca3af;
}

.detail-value {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
  text-align: right;
}

/* Settings Modal */
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.settings-content {
  width: 100%;
  max-width: 420px;
  background: rgba(42, 45, 58, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  max-height: 80vh;
  overflow-y: auto;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  text-transform: lowercase;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section:last-of-type {
  margin-bottom: 24px;
}

.settings-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 12px;
  text-transform: lowercase;
}

.slippage-options {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.slippage-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slippage-btn.active {
  background: #42b883;
  color: #ffffff;
  border-color: #42b883;
}

.custom-slippage {
  position: relative;
  display: flex;
  align-items: center;
}

.custom-slippage-input {
  width: 80px;
  padding: 8px 24px 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
}

.custom-slippage-input:focus {
  border-color: #42b883;
}

.percent-symbol {
  position: absolute;
  right: 8px;
  color: #9ca3af;
  font-size: 14px;
  pointer-events: none;
}

.speed-options {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.speed-btn {
  flex: 1;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: lowercase;
}

.speed-btn.active {
  background: #42b883;
  color: #ffffff;
  border-color: #42b883;
}

.protection-options {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.protection-btn {
  flex: 1;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: lowercase;
}

.protection-btn.active {
  background: #42b883;
  color: #ffffff;
  border-color: #42b883;
}

.settings-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}

.settings-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.close-settings-btn {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-settings-btn:hover {
  color: #ffffff;
}

.apply-settings-btn {
  padding: 8px 20px;
  background: #42b883;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: lowercase;
}

.apply-settings-btn:hover {
  background: #369870;
  transform: translateY(-1px);
}

/* Token Selector Modal */
.token-selector-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 420px;
  background: rgba(26, 27, 35, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
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

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.search-container {
  margin-bottom: 20px;
}

.token-search-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  outline: none;
  transition: all 0.2s ease;
}

.token-search-input:focus {
  border-color: rgba(66, 184, 131, 0.5);
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.token-search-input::placeholder {
  color: #6b7280;
}

.token-list {
  flex: 1;
  overflow-y: auto;
  margin: -4px;
  padding: 4px;
}

.token-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.token-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.token-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.token-item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.token-item-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.token-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #646cff 0%, #42b883 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
}

.token-item-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.token-item-name {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-item-symbol {
  font-size: 14px;
  color: #9ca3af;
}

.token-item-balance {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* Tablet Styles */
@media (max-width: 1024px) {
  .swap-page {
    padding: 30px 16px;
  }
  
  .swap-container {
    max-width: 440px;
    padding: 22px;
  }
  
  .amount-input {
    font-size: 28px;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .swap-page {
    padding: 20px 12px;
    min-height: 70vh;
  }
  
  .swap-container {
    max-width: 100%;
    padding: 20px;
    border-radius: 16px;
  }
  
  .swap-header {
    margin-bottom: 16px;
  }
  
  .settings-btn {
    width: 36px;
    height: 36px;
  }
  
  .swap-section {
    padding: 16px;
    border-radius: 12px;
  }
  
  .input-container {
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .amount-input {
    font-size: 24px;
    min-width: 120px;
  }
  
  .token-selector {
    min-width: 100px;
    padding: 6px 10px;
  }
  
  .token-symbol {
    font-size: 14px;
  }
  
  .swap-arrow-btn {
    width: 36px;
    height: 36px;
  }
  
  .connect-wallet-btn {
    padding: 14px;
    font-size: 15px;
    margin-top: 16px;
  }
  
  .swap-details {
    margin-top: 16px;
    padding: 14px;
  }
  
  .detail-row {
    margin-bottom: 6px;
  }
  
  .detail-label,
  .detail-value {
    font-size: 13px;
  }
  
  .modal-content,
  .settings-content {
    margin: 0 8px;
    padding: 20px;
    max-height: 85vh;
  }
  
  .settings-header h3,
  .modal-header h3 {
    font-size: 18px;
  }
  
  .slippage-options,
  .speed-options,
  .protection-options {
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .slippage-btn,
  .speed-btn,
  .protection-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .custom-slippage-input {
    width: 70px;
    padding: 6px 20px 6px 10px;
    font-size: 13px;
  }
  
  .settings-description {
    font-size: 11px;
  }
  
  .token-search-input {
    padding: 10px 14px;
    font-size: 15px;
  }
  
  .token-item {
    padding: 10px;
  }
  
  .token-item-icon {
    width: 28px;
    height: 28px;
  }
  
  .token-item-name {
    font-size: 15px;
  }
  
  .token-item-symbol,
  .token-item-balance {
    font-size: 13px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .swap-page {
    padding: 16px 8px;
  }
  
  .swap-container {
    padding: 16px;
  }
  
  .swap-section {
    padding: 14px;
  }
  
  .amount-input {
    font-size: 20px;
  }
  
  .token-selector {
    padding: 5px 8px;
  }
  
  .token-symbol {
    font-size: 13px;
  }
  
  .connect-wallet-btn {
    padding: 12px;
    font-size: 14px;
  }
  
  .modal-content,
  .settings-content {
    margin: 0 4px;
    padding: 16px;
  }
  
  .settings-header h3,
  .modal-header h3 {
    font-size: 16px;
  }
  
  .slippage-btn,
  .speed-btn,
  .protection-btn {
    padding: 5px 10px;
    font-size: 12px;
  }
  
  .custom-slippage-input {
    width: 60px;
    padding: 5px 18px 5px 8px;
    font-size: 12px;
  }
  
  .token-item {
    padding: 8px;
  }
  
  .token-item-icon {
    width: 24px;
    height: 24px;
  }
  
  .token-item-name {
    font-size: 14px;
  }
  
  .token-item-symbol,
  .token-item-balance {
    font-size: 12px;
  }
}

/* Very Small Mobile */
@media (max-width: 360px) {
  .swap-container {
    padding: 12px;
  }
  
  .amount-input {
    font-size: 18px;
  }
  
  .token-symbol {
    font-size: 12px;
  }
  
  .modal-content,
  .settings-content {
    padding: 12px;
  }
}
</style>