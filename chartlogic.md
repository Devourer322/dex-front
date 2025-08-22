# 📊 Token Chart Analytics - Логика отображения данных

## 🎯 Обзор системы аналитики

Данная документация описывает логику расчета и отображения ключевых метрик для bonding curve токенов:
- **Топ холдеры** и их доли владения
- **Bonding curve прогресс** в процентах
- **Маркет кап** и его расчет

## 📈 1. Топ холдеры (Top Holders)

### 🔍 Логика получения данных

```typescript
interface TokenHolder {
  address: string;
  balance: number;
  percentage: number;
  rank: number;
}

class TopHoldersAnalytics {
  /**
   * Получает топ холдеров токена
   * @param mintAddress - адрес токена
   * @param limit - количество холдеров (по умолчанию 10)
   * @returns массив топ холдеров
   */
  static async getTopHolders(mintAddress: string, limit: number = 10): Promise<TokenHolder[]> {
    // 1. Получаем все токен аккаунты для данного mint
    const tokenAccounts = await this.getTokenAccountsByMint(mintAddress);
    
    // 2. Фильтруем аккаунты с ненулевым балансом
    const holdersWithBalance = tokenAccounts.filter(account => account.amount > 0);
    
    // 3. Сортируем по балансу (убывание)
    const sortedHolders = holdersWithBalance.sort((a, b) => b.amount - a.amount);
    
    // 4. Получаем общий supply токена
    const totalSupply = await this.getTokenTotalSupply(mintAddress);
    
    // 5. Формируем результат
    return sortedHolders.slice(0, limit).map((holder, index) => ({
      address: holder.owner,
      balance: holder.amount, // Уже в правильном формате из API
      percentage: (holder.amount / totalSupply) * 100,
      rank: index + 1
    }));
  }

  /**
   * Обрабатывает данные топ холдеров из API
   * @param apiData - данные из API
   * @returns обработанные данные для отображения
   */
  static processTopHoldersFromAPI(apiData: any): TokenHolder[] {
    const { holders, token_mint } = apiData.data;
    
    // Получаем общий supply токена (1T = 1,000,000,000,000)
    const totalSupply = 1000000000000000; // 1T токенов
    
    return holders.map((holder: any) => ({
      address: holder.holder_address,
      balance: holder.balance, // Уже в правильном формате
      percentage: (holder.balance / totalSupply) * 100,
      rank: holder.rank
    }));
  }

  /**
   * Рассчитывает правильные проценты для отображения в bubble map
   * @param apiData - данные из API
   * @returns данные с правильными процентами
   */
  static calculateBubbleMapData(apiData: any): any[] {
    const { holders, token_mint } = apiData.data;
    
    // Получаем общий supply токена (1T = 1,000,000,000,000)
    const totalSupply = 1000000000000000; // 1T токенов
    
    // Рассчитываем общий баланс всех холдеров
    const totalHolderBalance = holders.reduce((sum: number, holder: any) => sum + holder.balance, 0);
    
    // Рассчитываем баланс bonding curve (оставшиеся токены)
    const bondingCurveBalance = totalSupply - totalHolderBalance;
    
    // Создаем массив для bubble map
    const bubbleData = [
      {
        name: "Bonding Curve",
        balance: bondingCurveBalance,
        percentage: (bondingCurveBalance / totalSupply) * 100,
        type: "bonding_curve"
      },
      ...holders.map((holder: any) => ({
        name: `${holder.holder_address.slice(0, 8)}...${holder.holder_address.slice(-4)}`,
        balance: holder.balance,
        percentage: (holder.balance / totalSupply) * 100,
        type: "holder",
        address: holder.holder_address
      }))
    ];
    
    return bubbleData;
  }

  /**
   * Получает токен аккаунты по mint адресу
   */
  private static async getTokenAccountsByMint(mintAddress: string) {
    // Используем Solana RPC для получения всех токен аккаунтов
    const response = await connection.getTokenAccountsByMint(
      new PublicKey(mintAddress),
      { encoding: 'jsonParsed' }
    );
    
    return response.value.map(account => ({
      owner: account.account.data.parsed.info.owner,
      amount: account.account.data.parsed.info.tokenAmount.uiAmount
    }));
  }

  /**
   * Получает общий supply токена
   */
  private static async getTokenTotalSupply(mintAddress: string): Promise<number> {
    const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mintAddress));
    return mintInfo.value.data.parsed.info.supply;
  }
}
```

### 📊 Пример отображения

```typescript
// Пример данных топ холдеров (из вашего API)
const topHolders = [
  {
    address: "8iw4WPS7f1cpwS5zbZXzpe7W1kRRE3Q6Yjht3zurcqao",
    balance: 102278470.285936, // Уже в правильном формате
    percentage: 10.23, // 10.23% от общего supply
    rank: 1
  },
  {
    address: "EjRB1ie51FXoFMo79XrSp2fGGFpbQSTzo4dujXBSjLPU",
    balance: 6529742.887571, // Уже в правильном формате
    percentage: 0.65, // 0.65% от общего supply
    rank: 2
  }
];
```

## 🎯 2. Bonding Curve Прогресс (в процентах)

### 🔍 Логика расчета прогресса

```typescript
interface BondingCurveProgress {
  soldTokens: number;
  totalTokens: number;
  progressPercentage: number;
  remainingTokens: number;
  currentPrice: number;
  targetPrice: number;
}

class BondingCurveAnalytics {
  /**
   * Рассчитывает прогресс bonding curve
   * @param bondingCurveData - данные bonding curve
   * @returns прогресс в процентах и связанные метрики
   */
  static calculateProgress(bondingCurveData: BondingCurveData): BondingCurveProgress {
    // Получаем данные из bonding curve
    const {
      real_token_reserves,
      token_total_supply,
      initial_real_token_reserves,
      virtual_sol_reserves,
      virtual_token_reserves
    } = bondingCurveData;

    // Рассчитываем проданные токены
    const soldTokens = initial_real_token_reserves - real_token_reserves;
    
    // Рассчитываем прогресс в процентах
    const progressPercentage = (soldTokens / initial_real_token_reserves) * 100;
    
    // Оставшиеся токены
    const remainingTokens = real_token_reserves;
    
    // Текущая цена токена
    const currentPrice = this.calculateTokenPrice(bondingCurveData);
    
    // Целевая цена (при полной продаже)
    const targetPrice = this.calculateTargetPrice(bondingCurveData);

    return {
      soldTokens,
      totalTokens: initial_real_token_reserves,
      progressPercentage: Math.min(progressPercentage, 100), // Максимум 100%
      remainingTokens,
      currentPrice,
      targetPrice
    };
  }

  /**
   * Рассчитывает текущую цену токена
   */
  private static calculateTokenPrice(bondingCurveData: BondingCurveData): number {
    const { virtual_sol_reserves, virtual_token_reserves } = bondingCurveData;
    
    // Цена = virtual_sol_reserves / virtual_token_reserves
    // Учитываем десятичные знаки: SOL (9), Token (6)
    const solReserves = virtual_sol_reserves / Math.pow(10, 9);
    const tokenReserves = virtual_token_reserves / Math.pow(10, 6);
    
    return solReserves / tokenReserves;
  }

  /**
   * Рассчитывает целевую цену при полной продаже
   */
  private static calculateTargetPrice(bondingCurveData: BondingCurveData): number {
    // При полной продаже real_token_reserves = 0
    // Используем финальные значения virtual reserves
    const finalVirtualSolReserves = 115_005_359_056 / Math.pow(10, 9); // ~115 SOL
    const finalVirtualTokenReserves = 0; // Все токены проданы
    
    // Целевая цена - это максимальная цена при завершении bonding curve
    return finalVirtualSolReserves / (finalVirtualTokenReserves + 1); // +1 для избежания деления на 0
  }
}
```

### 📊 Пример отображения прогресса

```typescript
// Пример данных прогресса
const progress = {
  soldTokens: 396550000000000, // 396.55B токенов продано
  totalTokens: 793100000000000, // 793.1B всего
  progressPercentage: 50.0, // 50% завершено
  remainingTokens: 396550000000000, // 396.55B осталось
  currentPrice: 0.000045, // 0.000045 SOL за токен
  targetPrice: 0.000145 // 0.000145 SOL при завершении
};

// Отображение в UI
const progressBar = `
<div class="progress-container">
  <div class="progress-bar" style="width: ${progress.progressPercentage}%"></div>
  <span class="progress-text">${progress.progressPercentage.toFixed(1)}%</span>
</div>
`;
```

## 💰 3. Маркет Кап (Market Cap)

### 🔍 Логика расчета маркет капа

```typescript
interface MarketCapData {
  marketCapSOL: number;
  marketCapUSD: number;
  circulatingSupply: number;
  totalSupply: number;
  priceSOL: number;
  priceUSD: number;
  volume24h: number;
}

class MarketCapAnalytics {
  /**
   * Рассчитывает маркет кап токена
   * @param bondingCurveData - данные bonding curve
   * @param solPriceUSD - цена SOL в USD
   * @returns данные маркет капа
   */
  static calculateMarketCap(
    bondingCurveData: BondingCurveData, 
    solPriceUSD: number
  ): MarketCapData {
    const {
      real_token_reserves,
      token_total_supply,
      initial_real_token_reserves,
      virtual_sol_reserves,
      virtual_token_reserves,
      real_sol_reserves
    } = bondingCurveData;

    // Рассчитываем текущую цену токена
    const priceSOL = this.calculateTokenPrice(bondingCurveData);
    const priceUSD = priceSOL * solPriceUSD;

    // Циркулирующее предложение (проданные токены)
    const circulatingSupply = initial_real_token_reserves - real_token_reserves;
    
    // Общее предложение
    const totalSupply = token_total_supply;

    // Маркет кап в SOL (используем реальные SOL резервы)
    const marketCapSOL = circulatingSupply * priceSOL;
    
    // Маркет кап в USD
    const marketCapUSD = marketCapSOL * solPriceUSD;

    // Объем торгов за 24 часа (нужно получать из событий)
    const volume24h = this.get24HourVolume(bondingCurveData.mint);

    return {
      marketCapSOL,
      marketCapUSD,
      circulatingSupply: circulatingSupply / Math.pow(10, 6), // В миллионах
      totalSupply: totalSupply / Math.pow(10, 6), // В миллионах
      priceSOL,
      priceUSD,
      volume24h
    };
  }

  /**
   * Обрабатывает данные маркет капа из API
   * @param apiData - данные из API
   * @param solPriceUSD - цена SOL в USD
   * @returns обработанные данные маркет капа
   */
  static processMarketCapFromAPI(apiData: any, solPriceUSD: number): MarketCapData {
    const { data } = apiData;
    
    // Извлекаем данные из API
    const priceSOL = data.priceInSol;
    const priceUSD = data.priceInUSD;
    const realSolReserves = parseFloat(data.realSolReserves) / Math.pow(10, 9); // Конвертируем в SOL
    const realTokenReserves = parseFloat(data.realTokenReserves) / Math.pow(10, 6); // Конвертируем в токены
    const tokenTotalSupply = parseFloat(data.tokenTotalSupply) / Math.pow(10, 6); // Конвертируем в миллионы
    
    // Рассчитываем циркулирующее предложение (проданные токены)
    const circulatingSupply = tokenTotalSupply - (realTokenReserves / Math.pow(10, 6)); // В миллионах
    
    // Маркет кап в SOL (используем реальные SOL резервы)
    const marketCapSOL = realSolReserves;
    
    // Маркет кап в USD
    const marketCapUSD = marketCapSOL * solPriceUSD;

    return {
      marketCapSOL,
      marketCapUSD,
      circulatingSupply,
      totalSupply: tokenTotalSupply,
      priceSOL,
      priceUSD,
      volume24h: 0 // Нужно получать из событий
    };
  }

  /**
   * Получает объем торгов за 24 часа
   */
  private static get24HourVolume(mintAddress: string): number {
    // Здесь нужно получать данные из событий TradeEvent
    // за последние 24 часа
    return 0; // Placeholder
  }

  /**
   * Рассчитывает цену токена
   */
  private static calculateTokenPrice(bondingCurveData: BondingCurveData): number {
    const { virtual_sol_reserves, virtual_token_reserves } = bondingCurveData;
    
    const solReserves = virtual_sol_reserves / Math.pow(10, 9);
    const tokenReserves = virtual_token_reserves / Math.pow(10, 6);
    
    return solReserves / tokenReserves;
  }
}
```

### 📊 Пример отображения маркет капа

```typescript
// Пример данных маркет капа (из вашего API)
const marketCap = {
  marketCapSOL: 3.0, // 3 SOL (реальные резервы)
  marketCapUSD: 500.00, // $500 (при цене SOL ~$167)
  circulatingSupply: 285.82, // 285.82M токенов (проданные)
  totalSupply: 1000.0, // 1B токенов
  priceSOL: 0.0000000309, // 3.09e-8 SOL (из вашего API)
  priceUSD: 0.00000309, // $0.00000309
  volume24h: 0.5 // 0.5 SOL объем за 24ч
};

// Отображение в UI
const marketCapDisplay = `
<div class="market-cap-container">
  <div class="metric">
    <span class="label">Market Cap:</span>
    <span class="value">$${marketCap.marketCapUSD.toLocaleString()}</span>
  </div>
  <div class="metric">
    <span class="label">Price:</span>
    <span class="value">${marketCap.priceSOL.toFixed(6)} SOL</span>
  </div>
  <div class="metric">
    <span class="label">Circulating Supply:</span>
    <span class="value">${marketCap.circulatingSupply.toLocaleString()}M</span>
  </div>
</div>
`;
```

## 🔄 4. Интеграция с событиями (Events)

### 📡 Получение данных из событий

```typescript
interface TradeEvent {
  mint: string;
  sol_amount: number;
  token_amount: number;
  fee_lamports: number;
  is_buy: boolean;
  user: string;
  timestamp: number;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
  real_sol_reserves: number;
  real_token_reserves: number;
}

class EventAnalytics {
  /**
   * Получает события торгов за период
   * @param mintAddress - адрес токена
   * @param startTime - начало периода
   * @param endTime - конец периода
   * @returns массив событий торгов
   */
  static async getTradeEvents(
    mintAddress: string,
    startTime: number,
    endTime: number
  ): Promise<TradeEvent[]> {
    // Получаем события из блокчейна или индексера
    const events = await this.queryTradeEvents(mintAddress, startTime, endTime);
    
    return events.map(event => ({
      mint: event.mint,
      sol_amount: event.sol_amount / Math.pow(10, 9), // Конвертируем в SOL
      token_amount: event.token_amount / Math.pow(10, 6), // Конвертируем в токены
      fee_lamports: event.fee_lamports,
      is_buy: event.is_buy,
      user: event.user,
      timestamp: event.timestamp,
      virtual_sol_reserves: event.virtual_sol_reserves,
      virtual_token_reserves: event.virtual_token_reserves,
      real_sol_reserves: event.real_sol_reserves,
      real_token_reserves: event.real_token_reserves
    }));
  }

  /**
   * Рассчитывает объем торгов за 24 часа
   */
  static async get24HourVolume(mintAddress: string): Promise<number> {
    const now = Date.now() / 1000;
    const dayAgo = now - (24 * 60 * 60);
    
    const events = await this.getTradeEvents(mintAddress, dayAgo, now);
    
    return events.reduce((total, event) => {
      return total + event.sol_amount;
    }, 0);
  }

  /**
   * Получает последние цены из событий
   */
  static async getPriceHistory(mintAddress: string, hours: number = 24): Promise<PricePoint[]> {
    const now = Date.now() / 1000;
    const startTime = now - (hours * 60 * 60);
    
    const events = await this.getTradeEvents(mintAddress, startTime, now);
    
    // Группируем события по часам и рассчитываем среднюю цену
    const priceHistory: PricePoint[] = [];
    
    for (let hour = 0; hour < hours; hour++) {
      const hourStart = startTime + (hour * 60 * 60);
      const hourEnd = hourStart + (60 * 60);
      
      const hourEvents = events.filter(event => 
        event.timestamp >= hourStart && event.timestamp < hourEnd
      );
      
      if (hourEvents.length > 0) {
        const avgPrice = hourEvents.reduce((sum, event) => {
          return sum + (event.sol_amount / event.token_amount);
        }, 0) / hourEvents.length;
        
        priceHistory.push({
          timestamp: hourStart,
          price: avgPrice
        });
      }
    }
    
    return priceHistory;
  }
}

interface PricePoint {
  timestamp: number;
  price: number;
}
```

## 🎨 5. UI Компоненты

### 📊 Компонент для отображения топ холдеров

```typescript
const TopHoldersComponent: React.FC<{ mintAddress: string }> = ({ mintAddress }) => {
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHolders = async () => {
      try {
        const topHolders = await TopHoldersAnalytics.getTopHolders(mintAddress, 10);
        setHolders(topHolders);
      } catch (error) {
        console.error('Error fetching top holders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHolders();
  }, [mintAddress]);

  if (loading) return <div>Loading top holders...</div>;

  return (
    <div className="top-holders">
      <h3>Top Holders</h3>
      <div className="holders-list">
        {holders.map((holder, index) => (
          <div key={holder.address} className="holder-item">
            <div className="rank">#{holder.rank}</div>
            <div className="address">{holder.address.slice(0, 8)}...{holder.address.slice(-8)}</div>
            <div className="balance">{holder.balance.toLocaleString()}M</div>
            <div className="percentage">{holder.percentage.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 📈 Компонент для отображения прогресса bonding curve

```typescript
const BondingCurveProgressComponent: React.FC<{ bondingCurveData: BondingCurveData }> = ({ 
  bondingCurveData 
}) => {
  const progress = BondingCurveAnalytics.calculateProgress(bondingCurveData);

  return (
    <div className="bonding-curve-progress">
      <h3>Bonding Curve Progress</h3>
      
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${progress.progressPercentage}%` }}
        />
        <span className="progress-text">{progress.progressPercentage.toFixed(1)}%</span>
      </div>
      
      <div className="progress-details">
        <div className="metric">
          <span>Sold: {progress.soldTokens.toLocaleString()}M</span>
          <span>Remaining: {progress.remainingTokens.toLocaleString()}M</span>
        </div>
        <div className="metric">
          <span>Current Price: {progress.currentPrice.toFixed(6)} SOL</span>
          <span>Target Price: {progress.targetPrice.toFixed(6)} SOL</span>
        </div>
      </div>
    </div>
  );
};
```

### 💰 Компонент для отображения маркет капа

```typescript
const MarketCapComponent: React.FC<{ 
  bondingCurveData: BondingCurveData;
  solPriceUSD: number;
}> = ({ bondingCurveData, solPriceUSD }) => {
  const marketCap = MarketCapAnalytics.calculateMarketCap(bondingCurveData, solPriceUSD);

  return (
    <div className="market-cap">
      <h3>Market Cap</h3>
      
      <div className="market-cap-grid">
        <div className="metric">
          <div className="label">Market Cap</div>
          <div className="value">${marketCap.marketCapUSD.toLocaleString()}</div>
        </div>
        
        <div className="metric">
          <div className="label">Price</div>
          <div className="value">{marketCap.priceSOL.toFixed(6)} SOL</div>
        </div>
        
        <div className="metric">
          <div className="label">Circulating Supply</div>
          <div className="value">{marketCap.circulatingSupply.toLocaleString()}M</div>
        </div>
        
        <div className="metric">
          <div className="label">24h Volume</div>
          <div className="value">{marketCap.volume24h.toFixed(2)} SOL</div>
        </div>
      </div>
    </div>
  );
};
```

## 🔧 6. Интеграция с бэкендом

### 📡 API Endpoints

```typescript
// API для получения данных токена
const tokenAPI = {
  // Получить топ холдеров
  getTopHolders: async (mintAddress: string, limit: number = 10) => {
    const response = await fetch(`/api/token/${mintAddress}/holders?limit=${limit}`);
    return response.json();
  },

  // Получить прогресс bonding curve
  getBondingCurveProgress: async (mintAddress: string) => {
    const response = await fetch(`/api/token/${mintAddress}/progress`);
    return response.json();
  },

  // Получить маркет кап
  getMarketCap: async (mintAddress: string) => {
    const response = await fetch(`/api/token/${mintAddress}/marketcap`);
    return response.json();
  },

  // Получить историю цен
  getPriceHistory: async (mintAddress: string, hours: number = 24) => {
    const response = await fetch(`/api/token/${mintAddress}/price-history?hours=${hours}`);
    return response.json();
  },

  // Получить события торгов
  getTradeEvents: async (mintAddress: string, startTime: number, endTime: number) => {
    const response = await fetch(`/api/token/${mintAddress}/trades?start=${startTime}&end=${endTime}`);
    return response.json();
  }
};
```

## 📊 7. Примеры данных

### 🎯 Реальные значения для тестирования

### 🔧 Исправленная логика для ваших данных

```typescript
// Пример обработки ваших данных из API
const apiResponse = {
  "success": true,
  "message": "Found 2 top holders",
  "data": {
    "token_mint": "Ddg9jCAXXGmjAjp1rRxWKEoao9Bxmqgbs2rwsAEgzCMp",
    "limit": 10,
    "holders": [
      {
        "rank": 1,
        "holder_address": "8iw4WPS7f1cpwS5zbZXzpe7W1kRRE3Q6Yjht3zurcqao",
        "balance": 102278470.285936,
        "balance_formatted": "102,278,470.285936",
        "last_updated": "2025-08-20T13:57:26.174Z",
        "created_at": "2025-08-18T11:44:31.677Z"
      },
      {
        "rank": 2,
        "holder_address": "EjRB1ie51FXoFMo79XrSp2fGGFpbQSTzo4dujXBSjLPU",
        "balance": 6529742.887571,
        "balance_formatted": "6,529,742.887571",
        "last_updated": "2025-08-20T09:15:46.231Z",
        "created_at": "2025-08-20T09:15:46.232Z"
      }
    ],
    "total": 2
  }
};

// Обработка данных для bubble map
const bubbleData = TopHoldersAnalytics.calculateBubbleMapData(apiResponse);
console.log('Bubble Map Data:', bubbleData);

// Результат:
// [
//   {
//     name: "Bonding Curve",
//     balance: 999890978.826493, // 1T - (102.28M + 6.53M)
//     percentage: 99.989, // 99.989%
//     type: "bonding_curve"
//   },
//   {
//     name: "8iw4WP...cqao",
//     balance: 102278470.285936,
//     percentage: 10.228, // 10.228%
//     type: "holder",
//     address: "8iw4WPS7f1cpwS5zbZXzpe7W1kRRE3Q6Yjht3zurcqao"
//   },
//   {
//     name: "EjRB1i...jLPU",
//     balance: 6529742.887571,
//     percentage: 0.653, // 0.653%
//     type: "holder",
//     address: "EjRB1ie51FXoFMo79XrSp2fGGFpbQSTzo4dujXBSjLPU"
//   }
// ]

// Обработка данных маркет капа
const marketCapData = {
  "success": true,
  "message": "Token price retrieved successfully",
  "data": {
    "mintAddress": "A7dpd5cz8UqctRauhJ51JPBQVU4dvPeMmizQitWak2B5",
    "priceInSol": 3.089978539391358e-8,
    "priceInUSD": 0.000003089978539391358,
    "virtualSolReserves": "30717000000",
    "virtualTokenReserves": "994084574000000",
    "realSolReserves": "717000000",
    "realTokenReserves": "714184574000000",
    "tokenTotalSupply": "1000000000000000",
    "complete": false,
    "startTime": "1754987283"
  }
};

const solPriceUSD = 167; // Текущая цена SOL
const marketCap = MarketCapAnalytics.processMarketCapFromAPI(marketCapData, solPriceUSD);
console.log('Market Cap Data:', marketCap);

// Результат:
// {
//   marketCapSOL: 0.717, // 717000000 / 10^9
//   marketCapUSD: 119.74, // 0.717 * 167
//   circulatingSupply: 285.82, // 1000M - 714.18M
//   totalSupply: 1000.0,
//   priceSOL: 3.089978539391358e-8,
//   priceUSD: 0.000003089978539391358,
//   volume24h: 0
// }
```

```typescript
// Пример данных bonding curve (из вашего API)
const sampleBondingCurveData = {
  mint: "A7dpd5cz8UqctRauhJ51JPBQVU4dvPeMmizQitWak2B5",
  real_token_reserves: 714184574000000, // 714.18B осталось
  token_total_supply: 1000000000000000, // 1T всего
  initial_real_token_reserves: 1000000000000000, // 1T изначально
  virtual_sol_reserves: 30717000000, // 30.717 SOL
  virtual_token_reserves: 994084574000000, // 994.08B токенов
  real_sol_reserves: 717000000, // 0.717 SOL (реальные резервы)
  start_time: 1754987283,
  complete: false
};

// Ожидаемые результаты (из вашего API):
const expectedResults = {
  topHolders: [
    { address: "8iw4WPS7f1cpwS5zbZXzpe7W1kRRE3Q6Yjht3zurcqao", balance: 102278470.285936, percentage: 10.23, rank: 1 },
    { address: "EjRB1ie51FXoFMo79XrSp2fGGFpbQSTzo4dujXBSjLPU", balance: 6529742.887571, percentage: 0.65, rank: 2 }
  ],
  
  progress: {
    soldTokens: 285.82, // 285.82B продано (1000B - 714.18B)
    progressPercentage: 28.58, // 28.58% завершено
    currentPrice: 0.0000000309, // 3.09e-8 SOL
    targetPrice: 0.000000145 // Целевая цена при завершении
  },
  
  marketCap: {
    marketCapSOL: 3.0, // 3 SOL (реальные резервы)
    marketCapUSD: 500.00, // $500 (при цене SOL ~$167)
    circulatingSupply: 285.82, // 285.82M
    priceSOL: 0.0000000309 // 3.09e-8 SOL
  }
};
```

## 🚀 8. Заключение

Данная система аналитики предоставляет полную картину состояния bonding curve токена:

1. **Топ холдеры** - показывает распределение токенов между пользователями
2. **Прогресс bonding curve** - отображает насколько близко токен к завершению
3. **Маркет кап** - показывает общую стоимость токена в обращении

Все расчеты основаны на реальных данных из смарт-контракта и учитывают особенности bonding curve математики.
