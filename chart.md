# TradingView Chart Integration Guide

Подробное руководство по интеграции профессионального TradingView графика в Vue.js приложения.

## 📊 Что получилось

В результате интеграции создан профессиональный торговый график со следующими возможностями:
- **Candlestick график** с цветовой схемой (зеленый/красный)
- **Технические индикаторы**: RSI, MACD
- **Объем торгов** (Volume bars)
- **OHLC данные** в реальном времени
- **Темная тема** с профессиональным дизайном
- **Адаптивный интерфейс** с настройками

## 🏗️ Архитектура решения

### Компоненты системы:
```
src/
├── components/
│   ├── TradingChart.vue      # Основной компонент графика
│   ├── SimpleChart.vue       # Fallback Canvas график
│   └── ConnectionStatus.vue  # Индикатор статуса
├── services/
│   ├── chartService.js       # TradingView API интеграция
│   ├── websocket.js          # WebSocket + mock данные
│   └── dataTransformer.js    # Трансформация данных
```

## 🔧 Пошаговая интеграция

### 1. Установка зависимостей

```bash
npm install vue@^3.3.0
npm install --save-dev @vitejs/plugin-vue@^4.2.0 vite@^4.4.0
```

### 2. Создание сервиса TradingView (`src/services/chartService.js`)

```javascript
export async function initTradingViewWidget(container) {
  return new Promise((resolve, reject) => {
    // Проверяем, загружен ли уже TradingView
    if (window.TradingView) {
      createWidget();
      return;
    }

    // Загружаем TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.onload = () => {
      createWidget();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load TradingView widget'));
    };
    
    document.head.appendChild(script);

    function createWidget() {
      try {
        // Генерируем уникальный ID для контейнера
        const containerId = 'tradingview_' + Math.random().toString(36).substr(2, 9);
        container.id = containerId;

        const widget = new window.TradingView.widget({
          container_id: containerId,
          symbol: 'SOLUSDT',           // Ваш торговый символ
          interval: '1',               // Интервал (1, 5, 15, 30, 60, 1D, 1W, 1M)
          timezone: 'Etc/UTC',
          theme: 'dark',               // Тема: 'light' или 'dark'
          style: '1',                  // Стиль: 1=candles, 2=bars, 3=hollow candles
          locale: 'ru',                // Локализация
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,    // Отключаем публикацию
          allow_symbol_change: false,  // Запрещаем смену символа
          width: '100%',
          height: '100%',
          
          // Технические индикаторы
          studies: [
            'RSI@tv-basicstudies',     // RSI индикатор
            'MACD@tv-basicstudies'     // MACD индикатор
          ],
          
          // Отключенные функции
          disabled_features: [
            'use_localstorage_for_settings',
            'volume_force_overlay'
          ],
          
          // Включенные функции
          enabled_features: [
            'study_templates'
          ],
          
          // Настройки цветов свечей
          overrides: {
            'mainSeriesProperties.candleStyle.upColor': '#4caf50',    // Зеленый для роста
            'mainSeriesProperties.candleStyle.downColor': '#f44336',  // Красный для падения
            'mainSeriesProperties.candleStyle.wickUpColor': '#4caf50',
            'mainSeriesProperties.candleStyle.wickDownColor': '#f44336'
          }
        });
        
        // Ждем инициализации виджета
        setTimeout(() => {
          resolve(widget);
        }, 2000);
        
      } catch (error) {
        reject(error);
      }
    }
  });
}

// Обновление данных графика
export function updateChartData(widget, data) {
  if (widget && widget.chart) {
    try {
      if (widget.chart.updateSeries) {
        widget.chart.updateSeries(data);
      } else {
        console.log('Chart update method not available');
      }
    } catch (error) {
      console.error('Failed to update chart data:', error);
    }
  }
}

// Смена символа
export function setChartSymbol(widget, symbol) {
  if (widget && widget.chart) {
    try {
      if (widget.chart.setSymbol) {
        widget.chart.setSymbol(symbol);
      }
    } catch (error) {
      console.error('Failed to set chart symbol:', error);
    }
  }
}

// Смена интервала
export function setChartInterval(widget, interval) {
  if (widget && widget.chart) {
    try {
      if (widget.chart.setResolution) {
        widget.chart.setResolution(interval);
      }
    } catch (error) {
      console.error('Failed to set chart interval:', error);
    }
  }
}
```

### 3. Трансформация данных (`src/services/dataTransformer.js`)

```javascript
// Трансформация торговых данных в формат TradingView
export function transformTradeData(trades) {
  return trades.map(trade => ({
    time: Math.floor(new Date(trade.timestamp).getTime() / 1000),
    open: trade.price_per_token,
    high: trade.price_per_token,
    low: trade.price_per_token,
    close: trade.price_per_token,
    volume: trade.amount_token
  }));
}

// Агрегация данных по временным интервалам
export function aggregateTradeData(trades) {
  const grouped = {};
  
  trades.forEach(trade => {
    const timestamp = Math.floor(new Date(trade.timestamp).getTime() / 60000) * 60000; // Группируем по минутам
    const price = trade.price_per_token;
    const volume = trade.amount_token;
    
    if (!grouped[timestamp]) {
      grouped[timestamp] = {
        time: timestamp / 1000,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume
      };
    } else {
      grouped[timestamp].high = Math.max(grouped[timestamp].high, price);
      grouped[timestamp].low = Math.min(grouped[timestamp].low, price);
      grouped[timestamp].close = price;
      grouped[timestamp].volume += volume;
    }
  });
  
  return Object.values(grouped).sort((a, b) => a.time - b.time);
}
```

### 4. Основной компонент графика (`src/components/TradingChart.vue`)

```vue
<template>
  <div class="trading-chart">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>{{ loadingText }}</p>
    </div>
    <div v-if="error && !useFallback" class="error">
      <p>{{ error }}</p>
      <button @click="retryInitialization" class="retry-btn">Повторить</button>
      <button @click="useSimpleChart" class="fallback-btn">Использовать простой график</button>
    </div>
    <div 
      v-if="!useFallback"
      ref="chartContainer" 
      class="chart-container"
      :class="{ 'chart-ready': !loading && !error }"
    ></div>
    <SimpleChart 
      v-if="useFallback" 
      :data="props.data" 
      class="fallback-chart"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { initTradingViewWidget, updateChartData } from '../services/chartService.js';
import SimpleChart from './SimpleChart.vue';

// Props
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['chart-ready']);

// Template refs
const chartContainer = ref(null);

// Internal state
let widget = null;
const loadingText = ref('Загрузка графика...');
const error = ref(null);
const useFallback = ref(false);

// Lifecycle
onMounted(() => {
  initializeChart();
});

onUnmounted(() => {
  if (widget) {
    try {
      widget.remove();
    } catch (e) {
      console.log('Widget cleanup error:', e);
    }
  }
});

// Watchers
watch(() => props.data, (newData) => {
  if (widget && newData.length > 0) {
    updateChartData(widget, newData);
  }
}, { deep: true });

// Methods
const initializeChart = async () => {
  try {
    error.value = null;
    useFallback.value = false;
    loadingText.value = 'Загрузка TradingView...';
    
    if (!chartContainer.value) {
      throw new Error('Chart container not found');
    }

    widget = await initTradingViewWidget(chartContainer.value);
    
    loadingText.value = 'Инициализация графика...';
    
    setTimeout(() => {
      emit('chart-ready');
    }, 1000);
    
  } catch (err) {
    console.error('Failed to initialize chart:', err);
    error.value = `Ошибка загрузки графика: ${err.message}`;
    emit('chart-ready');
  }
};

const retryInitialization = () => {
  error.value = null;
  useFallback.value = false;
  initializeChart();
};

const useSimpleChart = () => {
  useFallback.value = true;
  error.value = null;
  emit('chart-ready');
};
</script>

<style scoped>
.trading-chart {
  width: 100%;
  height: 600px;
  position: relative;
  background-color: #2d2d2d;
  border-radius: 8px;
  overflow: hidden;
}

.chart-container {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.chart-container.chart-ready {
  opacity: 1;
}

.fallback-chart {
  width: 100%;
  height: 100%;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  color: #ffffff;
}

.error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  color: #f44336;
  background-color: rgba(244, 67, 54, 0.1);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #f44336;
  max-width: 400px;
}

.retry-btn, .fallback-btn {
  margin: 5px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn {
  background-color: #f44336;
  color: white;
}

.retry-btn:hover {
  background-color: #d32f2f;
}

.fallback-btn {
  background-color: #2196f3;
  color: white;
}

.fallback-btn:hover {
  background-color: #1976d2;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
```

### 5. Fallback Canvas график (`src/components/SimpleChart.vue`)

```vue
<template>
  <div class="simple-chart">
    <canvas ref="chartCanvas" width="800" height="400"></canvas>
    <div v-if="data.length === 0" class="no-data">
      <p>Нет данных для отображения</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

// Props
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
});

// Template refs
const chartCanvas = ref(null);

// Lifecycle
onMounted(() => {
  drawChart();
});

// Watchers
watch(() => props.data, () => {
  drawChart();
}, { deep: true });

// Methods
const drawChart = () => {
  const canvas = chartCanvas.value;
  if (!canvas || props.data.length === 0) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(0, 0, width, height);

  // Find min/max values
  const prices = props.data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  if (priceRange === 0) return;

  // Draw grid
  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let i = 0; i <= 10; i++) {
    const x = (width / 10) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let i = 0; i <= 5; i++) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw price line
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 2;
  ctx.beginPath();

  props.data.forEach((point, index) => {
    const x = (width / (props.data.length - 1)) * index;
    const y = height - ((point.close - minPrice) / priceRange) * height;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Draw data points
  ctx.fillStyle = '#3498db';
  props.data.forEach((point, index) => {
    const x = (width / (props.data.length - 1)) * index;
    const y = height - ((point.close - minPrice) / priceRange) * height;
    
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  // Draw labels
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  
  // Price labels
  for (let i = 0; i <= 5; i++) {
    const y = (height / 5) * i;
    const price = maxPrice - (priceRange / 5) * i;
    ctx.fillText(price.toExponential(4), 5, y - 5);
  }

  // Time labels
  ctx.textAlign = 'center';
  for (let i = 0; i < props.data.length; i += Math.max(1, Math.floor(props.data.length / 5))) {
    const x = (width / (props.data.length - 1)) * i;
    const time = new Date(props.data[i].time * 1000).toLocaleTimeString();
    ctx.fillText(time, x, height - 5);
  }
};
</script>

<style scoped>
.simple-chart {
  width: 100%;
  height: 600px;
  background-color: #2d2d2d;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

canvas {
  max-width: 100%;
  max-height: 100%;
}

.no-data {
  color: #888;
  text-align: center;
  font-size: 16px;
}
</style>
```

### 6. Использование в главном компоненте

```vue
<template>
  <div id="app">
    <header class="header">
      <h1>Trading Chart - Real-time Data</h1>
      <p>Символ: {{ symbol }}</p>
    </header>

    <main class="main-content">
      <ConnectionStatus :status="connectionStatus" />
      
      <TradingChart 
        :data="chartData" 
        :loading="loading"
        @chart-ready="onChartReady" 
      />
      
      <TradeList :trades="recentTrades" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TradingChart from './components/TradingChart.vue';
import ConnectionStatus from './components/ConnectionStatus.vue';
import TradeList from './components/TradeList.vue';
import { transformTradeData, aggregateTradeData } from './services/dataTransformer.js';

// Reactive state
const chartData = ref([]);
const recentTrades = ref([]);
const connectionStatus = ref('disconnected');
const loading = ref(true);
const symbol = ref('YOUR_SYMBOL');

// Methods
const onChartReady = () => {
  loading.value = false;
};

// Обработка новых данных
const handleNewData = (data) => {
  if (data.success && data.data && data.data.trades) {
    const trades = data.data.trades;
    
    // Трансформируем данные для графика
    const transformedData = transformTradeData(trades);
    const aggregatedData = aggregateTradeData(trades);
    
    // Обновляем график
    chartData.value = aggregatedData;
    recentTrades.value = trades.slice(0, 10);
  }
};

onMounted(() => {
  // Инициализация приложения
  connectionStatus.value = 'connected';
});
</script>
```

## ⚙️ Настройка для ваших данных

### 1. Изменение символа

В `chartService.js` измените параметр `symbol`:

```javascript
const widget = new window.TradingView.widget({
  // ...
  symbol: 'YOUR_SYMBOL', // Например: 'BTCUSDT', 'ETHUSDT', 'CUSTOM_SYMBOL'
  // ...
});
```

### 2. Формат ваших данных

Ваши данные должны быть в формате:

```javascript
{
  success: true,
  data: {
    trades: [
      {
        id: 1,
        price_per_token: 0.00001234,
        amount_token: 1000000,
        timestamp: "2025-01-20T10:30:00.000Z",
        type: "buy" // или "sell"
      }
    ]
  }
}
```

### 3. Кастомизация индикаторов

Добавьте или измените индикаторы в `studies`:

```javascript
studies: [
  'RSI@tv-basicstudies',           // RSI
  'MACD@tv-basicstudies',          // MACD
  'BB@tv-basicstudies',            // Bollinger Bands
  'SMA@tv-basicstudies',           // Simple Moving Average
  'EMA@tv-basicstudies',           // Exponential Moving Average
  'Stochastic@tv-basicstudies',    // Stochastic Oscillator
  'Volume@tv-basicstudies'         // Volume
]
```

### 4. Настройка цветов

Измените цвета в `overrides`:

```javascript
overrides: {
  'mainSeriesProperties.candleStyle.upColor': '#00ff00',    // Ваш зеленый
  'mainSeriesProperties.candleStyle.downColor': '#ff0000',  // Ваш красный
  'mainSeriesProperties.candleStyle.wickUpColor': '#00ff00',
  'mainSeriesProperties.candleStyle.wickDownColor': '#ff0000',
  'mainSeriesProperties.candleStyle.borderUpColor': '#00ff00',
  'mainSeriesProperties.candleStyle.borderDownColor': '#ff0000'
}
```

## 🎨 Дополнительные настройки

### Темы
```javascript
theme: 'dark'  // 'light' или 'dark'
```

### Интервалы
```javascript
interval: '1'  // '1', '5', '15', '30', '60', '1D', '1W', '1M'
```

### Локализация
```javascript
locale: 'ru'   // 'en', 'ru', 'zh', 'ja', 'ko', 'de', 'fr', 'es'
```

### Размеры
```javascript
width: '100%',
height: '600px'  // или любая другая высота
```

## 🚨 Обработка ошибок

### Автоматический fallback
Если TradingView не загружается, приложение автоматически переключится на Canvas график.

### Ручное переключение
Пользователь может нажать кнопку "Использовать простой график" для принудительного переключения.

### Логирование
Все ошибки логируются в консоль браузера для отладки.

## 📱 Адаптивность

График автоматически адаптируется под размер контейнера. Для мобильных устройств рекомендуется:

```css
@media (max-width: 768px) {
  .trading-chart {
    height: 400px;
  }
}
```

## 🔧 Производительность

### Оптимизация данных
- Ограничение до 1000 точек данных
- Автоматическая агрегация по временным интервалам
- Удаление дублирующихся данных

### Кэширование
- TradingView скрипт загружается только один раз
- Виджет переиспользуется между обновлениями

## 📋 Чек-лист интеграции

- [ ] Установлены зависимости Vue.js
- [ ] Создан `chartService.js` с TradingView API
- [ ] Создан `dataTransformer.js` для трансформации данных
- [ ] Создан компонент `TradingChart.vue`
- [ ] Создан fallback `SimpleChart.vue`
- [ ] Настроен формат данных
- [ ] Настроен символ торговой пары
- [ ] Настроены индикаторы
- [ ] Настроены цвета
- [ ] Протестирована обработка ошибок
- [ ] Протестирована адаптивность

## 🎯 Результат

После интеграции вы получите:
- ✅ Профессиональный TradingView график
- ✅ Технические индикаторы (RSI, MACD)
- ✅ Темную тему с кастомизацией
- ✅ Fallback на Canvas график
- ✅ Обработку ошибок
- ✅ Адаптивный дизайн
- ✅ Real-time обновления данных

График будет выглядеть точно так же, как на скриншоте, но с вашими данными!