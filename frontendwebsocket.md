# WebSocket Frontend Integration

## Обзор

Реализована WebSocket интеграция для фронтенда, позволяющая получать уведомления о покупке и продаже токенов в реальном времени.

## Архитектура

### Backend Components

1. **FrontendWebSocketService** (`src/services/frontendWebSocket.js`)
   - Управляет WebSocket подключениями от клиентов
   - Обрабатывает подписки на события токенов
   - Отправляет уведомления о покупке/продаже токенов

2. **SolanaWebSocketService** (обновлен)
   - Интегрирован с FrontendWebSocketService
   - Отправляет уведомления при обнаружении транзакций покупки/продажи

### Frontend Components

1. **TokenChart.vue** (обновлен)
   - Подключается к WebSocket при загрузке страницы токена
   - Подписывается на события конкретного токена
   - Обрабатывает уведомления о покупке/продаже

## WebSocket Endpoints

### Подключение
```
ws://localhost:3000/websocket
```

### Сообщения от клиента

#### Подписка на токен
```json
{
  "type": "subscribe",
  "mintAddress": "A7dpd5cz8UqctRauhJ51JPBQVU4dvPeMmizQitWak2B5"
}
```

#### Отписка от токена
```json
{
  "type": "unsubscribe",
  "mintAddress": "A7dpd5cz8UqctRauhJ51JPBQVU4dvPeMmizQitWak2B5"
}
```

#### Ping для поддержания соединения
```json
{
  "type": "ping"
}
```

### Сообщения от сервера

#### Подключение установлено
```json
{
  "type": "connected",
  "message": "WebSocket connected successfully",
  "clientId": "client_1755849456004_hxlnh0j0c"
}
```

#### Подписка подтверждена
```json
{
  "type": "subscribed",
  "mintAddress": "A7dpd5cz8UqctRauhJ51JPBQVU4dvPeMmizQitWak2B5",
  "message": "Subscribed to token: A7dpd5cz8UqctRauhJ51JPBQVU4dvPeMmizQitWak2B5"
}
```

#### Уведомление о покупке токена
```json
{
  "type": "token_purchase",
  "mint": "A7dpd5cz8UqctRauhJ51JPBQVU4dvPeMmizQitWak2B5",
  "amount": 0.1,
  "user": "EjRB1ie51FXoFMo79XrSp2fGGFpbQSTzo4dujXBSjLPU",
  "tokenAmount": 1000000,
  "pricePerToken": 0.0000001,
  "signature": "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5q",
  "slot": 123456789,
  "timestamp": "2025-08-22T07:57:38.009Z"
}
```

#### Уведомление о продаже токена
```json
{
  "type": "token_sale",
  "mint": "A7dpd5cz8UqctRauhJ51JPBQVU4dvPeMmizQitWak2B5",
  "amount": 0.05,
  "user": "EjRB1ie51FXoFMo79XrSp2fGGFpbQSTzo4dujXBSjLPU",
  "tokenAmount": 500000,
  "pricePerToken": 0.0000001,
  "signature": "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5q",
  "slot": 123456790,
  "timestamp": "2025-08-22T07:58:15.123Z"
}
```

#### Ошибка
```json
{
  "type": "error",
  "message": "Error description"
}
```

#### Pong ответ
```json
{
  "type": "pong"
}
```

## API Endpoints

### Статистика WebSocket
```
GET /api/websocket/frontend/stats
```

**Ответ:**
```json
{
  "success": true,
  "message": "Frontend WebSocket statistics retrieved",
  "data": {
    "totalClients": 2,
    "totalSubscriptions": 1,
    "subscriptions": {
      "A7dpd5cz8UqctRauhJ51JPBQVU4dvPeMmizQitWak2B5": 2
    },
    "timestamp": "2025-08-22T07:54:24.478Z"
  }
}
```

## Frontend Integration

### Подключение к WebSocket

```javascript
// В TokenChart.vue
const connectWebSocket = (mintAddress) => {
  if (!mintAddress) {
    console.warn('No mint address provided for WebSocket connection')
    return
  }

  try {
    // Close existing connection if any
    if (websocket.value) {
      websocket.value.close()
    }

    console.log('🔌 Connecting to WebSocket for token:', mintAddress)
    
    // Connect to WebSocket server
    websocket.value = new WebSocket(`ws://localhost:3000/websocket`)
    
    websocket.value.onopen = () => {
      console.log('✅ WebSocket connected successfully')
      isWebSocketConnected.value = true
      websocketError.value = null
      
      // Subscribe to token events
      const subscribeMessage = {
        type: 'subscribe',
        mintAddress: mintAddress
      }
      
      websocket.value.send(JSON.stringify(subscribeMessage))
      console.log('📡 Subscribed to token events for:', mintAddress)
    }
    
    websocket.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 WebSocket message received:', data)
        
        // Handle different message types
        if (data.type === 'token_purchase') {
          console.log('💰 Price changed - token purchased!')
          console.log('📊 Purchase details:', {
            mint: data.mint,
            amount: data.amount,
            user: data.user,
            timestamp: data.timestamp
          })
          
          // Here you can add logic to update the chart or show notifications
          // For now, just log the price change
        } else if (data.type === 'token_sale') {
          console.log('💰 Price changed - token sold!')
          console.log('📊 Sale details:', {
            mint: data.mint,
            amount: data.amount,
            user: data.user,
            timestamp: data.timestamp
          })
        } else if (data.type === 'error') {
          console.error('❌ WebSocket error:', data.message)
          websocketError.value = data.message
        }
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error)
      }
    }
    
    websocket.value.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
      websocketError.value = 'WebSocket connection error'
      isWebSocketConnected.value = false
    }
    
    websocket.value.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason)
      isWebSocketConnected.value = false
      
      // Attempt to reconnect after 5 seconds if not intentionally closed
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect WebSocket...')
          connectWebSocket(mintAddress)
        }, 5000)
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to connect WebSocket:', error)
    websocketError.value = error.message
    isWebSocketConnected.value = false
  }
}
```

### Отключение от WebSocket

```javascript
const disconnectWebSocket = () => {
  if (websocket.value) {
    console.log('🔌 Disconnecting WebSocket...')
    websocket.value.close(1000, 'Component unmounting')
    websocket.value = null
    isWebSocketConnected.value = false
    websocketError.value = null
  }
}
```

### Lifecycle Integration

```javascript
// В onMounted
onMounted(async () => {
  // ... existing code ...
  
  console.log('🔌 Connecting to WebSocket for token events:', mintAddress)
  // Connect to WebSocket for real-time token events
  connectWebSocket(mintAddress)
})

// В onUnmounted
onUnmounted(() => {
  // ... existing code ...
  
  // Disconnect WebSocket
  disconnectWebSocket()
})
```

## Тестирование

### Тестовый скрипт для WebSocket

```bash
node test-websocket-frontend.js
```

Этот скрипт:
1. Подключается к WebSocket серверу
2. Подписывается на события токена
3. Ждет уведомления о покупке/продаже
4. Логирует все полученные сообщения

### Проверка статистики

```bash
curl http://localhost:3000/api/websocket/frontend/stats
```

## Особенности реализации

### Автоматическое переподключение
- При неожиданном разрыве соединения происходит автоматическое переподключение через 5 секунд
- При намеренном закрытии (код 1000) переподключение не происходит

### Управление подписками
- Каждый клиент может подписаться на несколько токенов
- При отключении клиента все его подписки автоматически удаляются
- Подписки на токены без активных клиентов автоматически очищаются

### Обработка ошибок
- Все ошибки WebSocket логируются
- Ошибки парсинга сообщений не прерывают соединение
- Невалидные сообщения игнорируются с отправкой ошибки клиенту

### Производительность
- Используется Map для быстрого доступа к клиентам и подпискам
- Отключенные клиенты автоматически удаляются
- Ping/pong для поддержания соединений

## Логирование

Все WebSocket события логируются с эмодзи для удобства:

- 🔌 Подключение/отключение
- 📡 Подписки
- 📨 Получение сообщений
- 💰 Уведомления о покупке/продаже
- ❌ Ошибки
- 🔄 Переподключения

## Безопасность

- Валидация всех входящих сообщений
- Проверка формата JSON
- Ограничение размера сообщений
- Автоматическое удаление неактивных клиентов
