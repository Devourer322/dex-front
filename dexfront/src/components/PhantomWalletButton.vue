<template>
  <div class="phantom-wallet-button">
    <button 
      v-if="!isConnected" 
      @click="connectWallet" 
      class="connect-btn"
      :disabled="isConnecting || isCreatingUser"
    >
      <PhantomIcon class="wallet-icon" />
      <span class="connect-text">
        {{ isConnecting ? 'Connecting...' : isCreatingUser ? 'Creating user...' : 'Connect Phantom' }}
      </span>
    </button>
    
    <div v-else class="wallet-connected">
      <div class="wallet-info">
        <div class="wallet-avatar">
          <PhantomIcon class="wallet-icon" />
        </div>
        <div class="wallet-details">
          <span class="wallet-address">{{ shortenAddress(walletAddress) }}</span>
          <span v-if="userInfo?.username" class="wallet-username">{{ userInfo.username }}</span>
          <span class="wallet-balance">{{ balance }} SOL</span>
        </div>
      </div>
      <button @click="disconnectWallet" class="disconnect-btn">
        <DisconnectIcon class="disconnect-icon" />
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { PhantomIcon, DisconnectIcon } from './Icons.vue'

export default {
  name: 'PhantomWalletButton',
  components: {
    PhantomIcon,
    DisconnectIcon
  },
  setup() {
    // Wallet state
    const isConnected = ref(false)
    const isConnecting = ref(false)
    const walletAddress = ref('')
    const balance = ref(0)
    const userInfo = ref(null)
    const isCreatingUser = ref(false)

    // Methods
    const generateRandomUsername = (walletAddress) => {
      // Генерируем username на основе адреса кошелька
      const shortAddress = walletAddress.slice(0, 6) + walletAddress.slice(-4)
      const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
      return `user_${shortAddress}_${randomSuffix}`
    }

    const createUserInDatabase = async (walletAddress) => {
      isCreatingUser.value = true
      try {
        console.log('👤 Создание пользователя в базе данных:', walletAddress)
        
        const userData = {
          wallet_address: walletAddress,
          username: generateRandomUsername(walletAddress),
          avatar_url: null // Можно добавить генерацию аватара
        }

        const response = await fetch('http://localhost:3000/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData)
        })

        const result = await response.json()

        if (result.success) {
          console.log('✅ Пользователь создан/найден в базе данных:', result.data.user)
          userInfo.value = result.data.user
          return result.data.user
        } else if (result.error === 'USER_ALREADY_EXISTS') {
          console.log('ℹ️ Пользователь уже существует в базе данных:', result.data.existingUser)
          userInfo.value = result.data.existingUser
          return result.data.existingUser
        } else {
          console.error('❌ Ошибка создания пользователя:', result.message)
          throw new Error(result.message)
        }
      } catch (error) {
        console.error('❌ Ошибка при работе с базе данных пользователей:', error)
        // Не прерываем подключение кошелька из-за ошибки БД
        return null
      } finally {
        isCreatingUser.value = false
      }
    }

    const connectWallet = async () => {
      if (!window.solana || !window.solana.isPhantom) {
        alert('Phantom wallet not found! Please install Phantom wallet extension.')
        return
      }

      try {
        isConnecting.value = true
        const response = await window.solana.connect()
        const address = response.publicKey.toString()
        walletAddress.value = address
        isConnected.value = true
        
        // Создаем пользователя в базе данных
        await createUserInDatabase(address)
        
        // Get balance
        await getBalance()
      } catch (error) {
        console.error('Failed to connect wallet:', error)
      } finally {
        isConnecting.value = false
      }
    }

    const disconnectWallet = async () => {
      try {
        await window.solana.disconnect()
        isConnected.value = false
        walletAddress.value = ''
        balance.value = 0
        userInfo.value = null
      } catch (error) {
        console.error('Failed to disconnect wallet:', error)
      }
    }

    const getBalance = async () => {
      try {
        const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js')
        const connection = new Connection('https://api.devnet.solana.com')
        const publicKey = new PublicKey(walletAddress.value)
        const balanceInLamports = await connection.getBalance(publicKey)
        balance.value = (balanceInLamports / LAMPORTS_PER_SOL).toFixed(4)
      } catch (error) {
        console.error('Failed to get balance:', error)
      }
    }

    const shortenAddress = (address) => {
      if (!address) return ''
      return `${address.slice(0, 4)}...${address.slice(-4)}`
    }

    // Check if wallet is already connected on mount
    onMounted(async () => {
      if (window.solana && window.solana.isPhantom) {
        try {
          const response = await window.solana.connect({ onlyIfTrusted: true })
          if (response.publicKey) {
            const address = response.publicKey.toString()
            walletAddress.value = address
            isConnected.value = true
            
            // Создаем пользователя в базе данных при автоматическом подключении
            //await createUserInDatabase(address)
            
            await getBalance()
          }
        } catch (error) {
          // User hasn't connected before or rejected the connection
        }
      }
    })

    return {
      isConnected,
      isConnecting,
      walletAddress,
      balance,
      userInfo,
      isCreatingUser,
      connectWallet,
      disconnectWallet,
      shortenAddress
    }
  }
}
</script>

<style scoped>
.phantom-wallet-button {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1001;
}

.connect-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(171, 71, 188, 0.3);
  white-space: nowrap;
}

.connect-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(171, 71, 188, 0.4);
}

.connect-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.wallet-connected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(66, 184, 131, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(66, 184, 131, 0.2);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.2);
  min-width: 200px;
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.wallet-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wallet-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.wallet-address {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  font-family: 'Monaco', 'Menlo', monospace;
}

.wallet-username {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}

.wallet-balance {
  font-size: 11px;
  color: #42b883;
  font-weight: 500;
}

.disconnect-btn {
  width: 28px;
  height: 28px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.disconnect-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.wallet-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  flex-shrink: 0;
}

.disconnect-icon {
  width: 14px;
  height: 14px;
  stroke: #ef4444;
}

.connect-text {
  white-space: nowrap;
}

/* Tablet Styles */
@media (max-width: 1024px) {
  .phantom-wallet-button {
    top: 20px;
    right: 20px;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .phantom-wallet-button {
    top: 16px;
    right: 16px;
  }
  
  .connect-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
  
  .connect-text {
    display: none;
  }
  
  .wallet-connected {
    min-width: 160px;
    padding: 10px;
  }
  
  .wallet-info {
    gap: 8px;
  }
  
  .wallet-avatar {
    width: 28px;
    height: 28px;
  }
  
  .wallet-icon {
    width: 14px;
    height: 14px;
  }
  
  .disconnect-btn {
    width: 24px;
    height: 24px;
  }
  
  .disconnect-icon {
    width: 12px;
    height: 12px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .phantom-wallet-button {
    top: 14px;
    right: 14px;
  }
  
  .connect-btn {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .wallet-connected {
    min-width: 140px;
    padding: 8px;
  }
  
  .wallet-info {
    gap: 6px;
  }
  
  .wallet-avatar {
    width: 24px;
    height: 24px;
  }
  
  .wallet-address {
    font-size: 11px;
  }
  
  .wallet-balance {
    font-size: 10px;
  }
  
  .disconnect-btn {
    width: 20px;
    height: 20px;
  }
  
  .disconnect-icon {
    width: 10px;
    height: 10px;
  }
}

/* Very Small Mobile */
@media (max-width: 360px) {
  .wallet-connected {
    min-width: 120px;
  }
  
  .wallet-address {
    font-size: 10px;
  }
  
  .wallet-balance {
    font-size: 9px;
  }
}
</style>