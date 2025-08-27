# Динамическое обновление топ холдеров на фронтенде

## Структура WebSocket сообщения

Теперь при покупке/продаже токена фронтенд получает расширенное сообщение:

```json
{
  "type": "token_purchase",
  "mint": "F6BrNbmYevNM6Vshfhx4My43zfzHxXWeH4TxkfjPv1jH",
  "amount": 0.1,
  "user": "EjRB1ie51FXoFMo79XrSp2fGGFpbQSTzo4dujXBSjLPU",
  "tokenAmount": 1000000,
  "pricePerToken": 0.0000001,
  "signature": "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5q",
  "slot": 123456789,
  "timestamp": "2025-08-22T07:57:38.009Z",
  "updatedHolders": [
    {
      "rank": 1,
      "holder_address": "EjRB1ie51FXoFMo79XrSp2fGGFpbQSTzo4dujXBSjLPU",
      "balance": 1000000,
      "balance_formatted": "1,000,000",
      "last_updated": "2025-08-22T07:57:38.009Z",
      "created_at": "2025-08-22T07:57:38.009Z"
    },
    {
      "rank": 2,
      "holder_address": "BAZ6jG5aXsjJg5fwJgh6iCF6BjWYjUiNWdrYj4Xf1HCW",
      "balance": 500000,
      "balance_formatted": "500,000",
      "last_updated": "2025-08-22T07:55:20.123Z",
      "created_at": "2025-08-22T07:55:20.123Z"
    }
  ]
}
```

## Обработка на фронтенде (Vue.js)

### 1. Обновить WebSocket обработчик в TokenChart.vue

```javascript
// В TokenChart.vue - обновить обработчик WebSocket сообщений
websocket.value.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log('📨 WebSocket message received:', data);
    
    if (data.type === 'token_purchase') {
      console.log('💰 Price changed - token purchased!');
      console.log('📊 Purchase details:', {
        mint: data.mint,
        amount: data.amount,
        user: data.user,
        timestamp: data.timestamp
      });
      
      // Обновляем топ холдеров если данные пришли
      if (data.updatedHolders) {
        console.log('🏆 Updating top holders with new data');
        updateTopHolders(data.updatedHolders);
      }
      
    } else if (data.type === 'token_sale') {
      console.log('💰 Price changed - token sold!');
      console.log('📊 Sale details:', {
        mint: data.mint,
        amount: data.amount,
        user: data.user,
        timestamp: data.timestamp
      });
      
      // Обновляем топ холдеров если данные пришли
      if (data.updatedHolders) {
        console.log('🏆 Updating top holders with new data');
        updateTopHolders(data.updatedHolders);
      }
    }
  } catch (error) {
    console.error('❌ Failed to parse WebSocket message:', error);
  }
};

// Функция обновления топ холдеров
const updateTopHolders = (newHolders) => {
  if (newHolders && Array.isArray(newHolders)) {
    // Обновляем данные топ холдеров
    topHoldersData.value = newHolders;
    
    // Показываем уведомление пользователю
    showNotification('Top holders updated!', 'success');
    
    console.log('✅ Top holders updated successfully:', newHolders.length, 'holders');
  }
};
```

### 2. Добавить уведомления пользователю

```javascript
// Функция показа уведомлений
const showNotification = (message, type = 'info') => {
  // Используйте вашу систему уведомлений
  // Например, toast, alert, или встроенные уведомления браузера
  console.log(`🔔 ${type.toUpperCase()}: ${message}`);
  
  // Пример с toast (если используете toast библиотеку)
  // toast.show(message, { type: type });
  
  // Или с встроенными уведомлениями браузера
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Token Update', {
      body: message,
      icon: '/favicon.ico'
    });
  }
};
```

### 3. Добавить анимацию обновления

```vue
<template>
  <div class="top-holders-section">
    <div class="holders-header">
      <h3>Top Holders</h3>
      <div v-if="isHoldersUpdating" class="updating-indicator">
        <span class="spinner"></span>
        Updating...
      </div>
    </div>
    
    <div class="holders-list">
      <div 
        v-for="holder in topHoldersData" 
        :key="holder.holder_address"
        class="holder-item"
        :class="{ 'updated': holder.isNewlyUpdated }"
      >
        <div class="rank">#{{ holder.rank }}</div>
        <div class="address">{{ formatAddress(holder.holder_address) }}</div>
        <div class="balance">{{ holder.balance_formatted }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isHoldersUpdating = ref(false);

const updateTopHolders = (newHolders) => {
  if (newHolders && Array.isArray(newHolders)) {
    isHoldersUpdating.value = true;
    
    // Добавляем флаг для анимации
    const holdersWithFlag = newHolders.map(holder => ({
      ...holder,
      isNewlyUpdated: true
    }));
    
    // Обновляем данные
    topHoldersData.value = holdersWithFlag;
    
    // Убираем флаг через 2 секунды
    setTimeout(() => {
      topHoldersData.value = topHoldersData.value.map(holder => ({
        ...holder,
        isNewlyUpdated: false
      }));
      isHoldersUpdating.value = false;
    }, 2000);
    
    showNotification('Top holders updated!', 'success');
  }
};

const formatAddress = (address) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};
</script>

<style scoped>
.updating-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  font-size: 14px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.holder-item {
  transition: all 0.3s ease;
}

.holder-item.updated {
  background-color: rgba(16, 185, 129, 0.1);
  border-left: 3px solid #10b981;
}
</style>
```

## Альтернативный подход: Периодическое обновление

Если WebSocket обновления не подходят, можно использовать периодическое обновление:

```javascript
// Периодическое обновление топ холдеров каждые 30 секунд
let holdersUpdateInterval;

const startHoldersUpdateInterval = () => {
  holdersUpdateInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/websocket/holders/top/${mintAddress}`);
      const data = await response.json();
      
      if (data.success) {
        topHoldersData.value = data.data.holders;
        console.log('🔄 Top holders updated via interval');
      }
    } catch (error) {
      console.error('❌ Error updating holders via interval:', error);
    }
  }, 30000); // 30 секунд
};

const stopHoldersUpdateInterval = () => {
  if (holdersUpdateInterval) {
    clearInterval(holdersUpdateInterval);
    holdersUpdateInterval = null;
  }
};

// Запускаем при монтировании компонента
onMounted(() => {
  startHoldersUpdateInterval();
});

// Останавливаем при размонтировании
onUnmounted(() => {
  stopHoldersUpdateInterval();
});
```

## Преимущества бэкенд-подхода

1. **Производительность** - расчеты не нагружают браузер
2. **Кэширование** - бэкенд может кэшировать результаты
3. **Консистентность** - все пользователи видят одинаковые данные
4. **Безопасность** - логика скрыта от клиента
5. **Масштабируемость** - легко добавить новые функции

## Рекомендации

1. **Используйте WebSocket для реального времени** - мгновенные обновления
2. **Добавьте fallback на HTTP** - если WebSocket недоступен
3. **Кэшируйте на бэкенде** - для частых запросов
4. **Добавьте анимации** - для лучшего UX
5. **Показывайте уведомления** - чтобы пользователь знал об обновлениях
