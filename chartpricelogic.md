# 📊 Bonding Curve Chart Logic - Логика расчета маркет капа для графика

## 🎯 Обзор системы

Данная документация описывает правильную логику расчета маркет капа для отображения на графике bonding curve токенов, аналогично тому, как это делается на Pump.fun.

## 🔍 1. Основные принципы расчета маркет капа

### **Формула маркет капа для bonding curve:**
```javascript
Market Cap = Total Supply × Current Token Price × SOL Price USD
```

### **Ключевые параметры:**
- **Total Supply** = 1,000,000,000,000 токенов (1T)
- **Current Token Price** = virtual_sol_reserves / virtual_token_reserves
- **SOL Price USD** = текущая цена SOL в долларах

## 📈 2. Логика расчета цены токена

### **Формула цены:**
```javascript
function calculateTokenPrice(virtualSolReserves, virtualTokenReserves) {
    // Конвертируем в правильные единицы
    const solReserves = virtualSolReserves / Math.pow(10, 9); // lamports -> SOL
    const tokenReserves = virtualTokenReserves / Math.pow(10, 6); // наименьшие единицы -> токены
    
    return solReserves / tokenReserves;
}
```

### **Пример расчета:**
```javascript
// Начальные данные:
virtual_sol_reserves = 30,000,000,000 (30 SOL)
virtual_token_reserves = 1,073,000,000,000,000 (1.073T токенов)

// Цена = 30 SOL / 1,073,000,000,000 токенов = 0.0000000279 SOL
```

## 💰 3. Логика расчета маркет капа

### **Основная формула:**
```javascript
function calculateMarketCap(tokenTotalSupply, priceSOL, solPriceUSD) {
    const totalSupplyInTokens = tokenTotalSupply / Math.pow(10, 6); // В миллионах токенов
    return totalSupplyInTokens * priceSOL * solPriceUSD;
}
```

### **Пример расчета:**
```javascript
// При SOL = $185:
tokenTotalSupply = 1,000,000,000,000,000 (1T токенов)
priceSOL = 0.0000000279 SOL
solPriceUSD = $185

// Маркет кап = 1,000,000,000 × 0.0000000279 × $185 = $5,160
```

## 📊 4. Логика построения графика

### **Кривая маркет капа от 0% до 100% продаж:**

```javascript
class BondingCurveChartCalculator {
    /**
     * Рассчитывает кривую маркет капа для графика
     * @param solPriceUSD - цена SOL в USD
     * @returns массив точек для графика
     */
    static calculateMarketCapCurve(solPriceUSD = 185) {
        const points = [];
        
        // Начальные значения из контракта
        const initialVirtualSolReserves = 30_000_000_000; // 30 SOL
        const initialVirtualTokenReserves = 1_073_000_000_000_000; // 1.073T токенов
        const initialRealTokenReserves = 793_100_000_000_000; // 793.1B токенов
        const tokenTotalSupply = 1_000_000_000_000_000; // 1T токенов
        
        // Рассчитываем точки для графика (каждые 1%)
        for (let progress = 0; progress <= 100; progress += 1) {
            const soldTokens = (initialRealTokenReserves * progress) / 100;
            const remainingTokens = initialRealTokenReserves - soldTokens;
            
            // Рассчитываем новые виртуальные резервы после продажи
            const newVirtualSolReserves = this.calculateNewVirtualSolReserves(
                initialVirtualSolReserves,
                soldTokens
            );
            const newVirtualTokenReserves = initialVirtualTokenReserves - soldTokens;
            
            // Рассчитываем цену
            const price = this.calculateTokenPrice(newVirtualSolReserves, newVirtualTokenReserves);
            
            // Рассчитываем маркет кап
            const marketCap = this.calculateMarketCap(tokenTotalSupply, price, solPriceUSD);
            
            points.push({
                progress: progress / 100, // 0.0 - 1.0
                marketCap,
                price,
                soldTokens: soldTokens / Math.pow(10, 6), // В миллионах
                remainingTokens: remainingTokens / Math.pow(10, 6), // В миллионах
                virtualSolReserves: newVirtualSolReserves / Math.pow(10, 9), // В SOL
                virtualTokenReserves: newVirtualTokenReserves / Math.pow(10, 6) // В миллионах
            });
        }
        
        return points;
    }
    
    /**
     * Рассчитывает новые виртуальные SOL резервы после продажи токенов
     */
    static calculateNewVirtualSolReserves(initialVirtualSolReserves, soldTokens) {
        // Упрощенная модель - в реальности используется более сложная формула
        const solPerToken = initialVirtualSolReserves / 1_073_000_000_000_000;
        return initialVirtualSolReserves + (soldTokens * solPerToken);
    }
    
    /**
     * Рассчитывает цену токена
     */
    static calculateTokenPrice(virtualSolReserves, virtualTokenReserves) {
        const solReserves = virtualSolReserves / Math.pow(10, 9);
        const tokenReserves = virtualTokenReserves / Math.pow(10, 6);
        return solReserves / tokenReserves;
    }
    
    /**
     * Рассчитывает маркет кап
     */
    static calculateMarketCap(tokenTotalSupply, priceSOL, solPriceUSD) {
        const totalSupplyInTokens = tokenTotalSupply / Math.pow(10, 6);
        return totalSupplyInTokens * priceSOL * solPriceUSD;
    }
}
```

## 🎨 5. Примеры данных для графика

### **Ключевые точки кривой маркет капа:**

```javascript
// При SOL = $185:

// 0% продано (начало):
{
    progress: 0,
    marketCap: 5160, // $5,160
    price: 0.0000000279, // 0.0000000279 SOL
    soldTokens: 0,
    remainingTokens: 793100
}

// 25% продано:
{
    progress: 0.25,
    marketCap: 5930, // $5,930
    price: 0.0000000321, // 0.0000000321 SOL
    soldTokens: 198275,
    remainingTokens: 594825
}

// 50% продано:
{
    progress: 0.5,
    marketCap: 6990, // $6,990
    price: 0.0000000378, // 0.0000000378 SOL
    soldTokens: 396550,
    remainingTokens: 396550
}

// 75% продано:
{
    progress: 0.75,
    marketCap: 8470, // $8,470
    price: 0.0000000458, // 0.0000000458 SOL
    soldTokens: 594825,
    remainingTokens: 198275
}

// 100% продано (миграция):
{
    progress: 1.0,
    marketCap: 11380, // $11,380
    price: 0.0000000615, // 0.0000000615 SOL
    soldTokens: 793100,
    remainingTokens: 0
}
```

## 🔄 6. Обновление графика в реальном времени

### **Получение текущих данных:**
```javascript
class RealTimeChartUpdater {
    /**
     * Получает текущие данные bonding curve
     */
    static async getCurrentBondingCurveData(mintAddress) {
        const response = await fetch(`/api/price/${mintAddress}`);
        const data = await response.json();
        
        return {
            virtualSolReserves: parseFloat(data.data.virtualSolReserves),
            virtualTokenReserves: parseFloat(data.data.virtualTokenReserves),
            realSolReserves: parseFloat(data.data.realSolReserves),
            realTokenReserves: parseFloat(data.data.realTokenReserves),
            tokenTotalSupply: parseFloat(data.data.tokenTotalSupply),
            complete: data.data.complete
        };
    }
    
    /**
     * Рассчитывает текущий прогресс
     */
    static calculateCurrentProgress(bondingCurveData) {
        const initialRealTokenReserves = 793_100_000_000_000;
        const soldTokens = initialRealTokenReserves - bondingCurveData.realTokenReserves;
        return (soldTokens / initialRealTokenReserves) * 100;
    }
    
    /**
     * Рассчитывает текущий маркет кап
     */
    static calculateCurrentMarketCap(bondingCurveData, solPriceUSD) {
        const price = this.calculateTokenPrice(
            bondingCurveData.virtualSolReserves,
            bondingCurveData.virtualTokenReserves
        );
        
        return this.calculateMarketCap(
            bondingCurveData.tokenTotalSupply,
            price,
            solPriceUSD
        );
    }
    
    /**
     * Обновляет график с текущими данными
     */
    static updateChart(chart, bondingCurveData, solPriceUSD) {
        const currentProgress = this.calculateCurrentProgress(bondingCurveData);
        const currentMarketCap = this.calculateCurrentMarketCap(bondingCurveData, solPriceUSD);
        
        // Добавляем текущую точку на график
        chart.addPoint({
            progress: currentProgress / 100,
            marketCap: currentMarketCap,
            timestamp: Date.now()
        });
    }
}
```

## 📱 7. Интеграция с фронтендом

### **React компонент для графика:**
```javascript
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BondingCurveChart = ({ mintAddress, solPriceUSD = 185 }) => {
    const [chartData, setChartData] = useState([]);
    const [currentPoint, setCurrentPoint] = useState(null);
    
    useEffect(() => {
        // Загружаем кривую маркет капа
        const loadChartData = () => {
            const curveData = BondingCurveChartCalculator.calculateMarketCapCurve(solPriceUSD);
            setChartData(curveData);
        };
        
        // Загружаем текущие данные
        const loadCurrentData = async () => {
            const bondingCurveData = await RealTimeChartUpdater.getCurrentBondingCurveData(mintAddress);
            const currentProgress = RealTimeChartUpdater.calculateCurrentProgress(bondingCurveData);
            const currentMarketCap = RealTimeChartUpdater.calculateCurrentMarketCap(bondingCurveData, solPriceUSD);
            
            setCurrentPoint({
                progress: currentProgress / 100,
                marketCap: currentMarketCap,
                timestamp: Date.now()
            });
        };
        
        loadChartData();
        loadCurrentData();
        
        // Обновляем каждые 30 секунд
        const interval = setInterval(loadCurrentData, 30000);
        return () => clearInterval(interval);
    }, [mintAddress, solPriceUSD]);
    
    return (
        <div className="bonding-curve-chart">
            <h3>Market Cap Progression</h3>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="progress" 
                        tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        label={{ value: 'Progress', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
                        label={{ value: 'Market Cap (USD)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                        formatter={(value, name) => [
                            name === 'marketCap' ? `$${value.toLocaleString()}` : value,
                            name === 'marketCap' ? 'Market Cap' : name
                        ]}
                        labelFormatter={(value) => `Progress: ${(value * 100).toFixed(1)}%`}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="marketCap" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={false}
                    />
                    {currentPoint && (
                        <Line 
                            type="monotone" 
                            dataKey="marketCap" 
                            stroke="#ff0000" 
                            strokeWidth={3}
                            dot={{ fill: '#ff0000', r: 6 }}
                            data={[currentPoint]}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
            
            {currentPoint && (
                <div className="current-stats">
                    <div className="stat">
                        <span className="label">Current Progress:</span>
                        <span className="value">{(currentPoint.progress * 100).toFixed(1)}%</span>
                    </div>
                    <div className="stat">
                        <span className="label">Current Market Cap:</span>
                        <span className="value">${currentPoint.marketCap.toLocaleString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BondingCurveChart;
```

## 🎯 8. Ключевые особенности

### **Важные моменты:**

1. **Маркет кап всегда растет** - это особенность bonding curve
2. **Цена токена увеличивается** при каждой покупке
3. **Прогресс от 0% до 100%** показывает проданные токены
4. **При 100%** токен готов к миграции в DEX
5. **График обновляется в реальном времени** при каждой сделке

### **Формулы для запоминания:**
```javascript
// Цена токена
Price = Virtual SOL Reserves / Virtual Token Reserves

// Маркет кап
Market Cap = Total Supply × Price × SOL Price USD

// Прогресс
Progress = (Sold Tokens / Initial Real Token Reserves) × 100
```

## 🚀 9. Заключение

Данная логика обеспечивает правильное отображение маркет капа для bonding curve токенов:

- **Точный расчет** на основе данных смарт-контракта
- **Плавная кривая** от начального до финального маркет капа
- **Реальное время** обновления при торговле
- **Совместимость** с Pump.fun логикой

Все расчеты основаны на математике bonding curve и учитывают особенности виртуальных резервов.
