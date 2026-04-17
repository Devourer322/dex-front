# Проблема с Memo инструкцией в Phantom Wallet

## Проблема

При добавлении Memo инструкции к транзакции покупки/продажи токенов, Phantom Wallet показывает ошибку:

**"Эта транзакция была отменена во время моделирования. При отправке средства могут быть утеряны."**

## Детали

### Что работает:
✅ Создание Memo инструкции  
✅ Добавление Memo в транзакцию  
✅ Симуляция транзакции через `connection.simulateTransaction()` (успешно: 189163 units)  

### Что НЕ работает:
❌ Phantom Wallet не может симулировать транзакцию с Memo инструкцией  
❌ Показывает предупреждение об ошибке моделирования  

## Причина

Phantom Wallet выполняет собственную симуляцию транзакции перед отправкой. Когда в транзакции присутствует Memo инструкция в начале (до основной инструкции), Phantom может неправильно интерпретировать её или считать транзакцию небезопасной.

## Временное решение

Memo инструкция **временно отключена** в обеих функциях:
- `buyToken()` (строка 2724-2737)
- `sellToken()` (строка 2943-2956)

```javascript
// ВРЕМЕННО ОТКЛЮЧЕНО: Memo инструкция вызывает ошибку симуляции в Phantom
// try {
//   const memoIx = createTransactionMemo(transactionDetails, 'buy', tokenInfo.value);
//   if (memoIx) {
//     tx.instructions.unshift(memoIx);
//     console.log('✅ Added memo instruction for Phantom preview');
//   }
// } catch (error) {
//   console.warn('⚠️ Failed to add memo instruction:', error);
// }
console.log('ℹ️ Memo instruction disabled - testing without it');
```

## Альтернативные решения

### 1. Добавить Memo в конец транзакции (вместо начала)

```javascript
// Вместо unshift (добавление в начало)
tx.instructions.unshift(memoIx);

// Попробовать push (добавление в конец)
tx.instructions.push(memoIx);
```

### 2. Использовать другой формат Memo

```javascript
// Текущий формат
data: Buffer.from(memoText, 'utf-8')

// Попробовать более короткий текст
const memoText = `Buy ${expectedTokens} ${tokenSymbol}`;
```

### 3. Использовать UI превью вместо Memo

Вместо добавления Memo инструкции в транзакцию, показывать детали в UI **перед** открытием Phantom:

```javascript
// Показать модальное окно с деталями
const confirmed = await showTransactionPreview({
  type: 'Покупка',
  youPay: '0.0100 SOL',
  youReceive: '~354 234 ASD',
  minimum: '336 522 ASD',
  slippage: '5%'
});

if (confirmed) {
  // Отправить транзакцию БЕЗ Memo
  await window.solana.signAndSendTransaction(tx);
}
```

### 4. Использовать Compute Budget инструкцию

Вместо Memo можно добавить Compute Budget инструкцию, которая Phantom понимает лучше:

```javascript
import { ComputeBudgetProgram } from '@solana/web3.js';

// Добавить Compute Budget инструкцию
const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
  units: 200000
});

tx.instructions.unshift(computeBudgetIx);
```

## Рекомендация

**Для production:**
1. Использовать **UI превью** (решение #3) - самый надёжный способ
2. Показывать детали транзакции в модальном окне ДО открытия Phantom
3. Не добавлять Memo инструкцию в транзакцию

**Для debugging:**
1. Попробовать добавить Memo в **конец** транзакции (решение #1)
2. Если не помогает - использовать более короткий текст (решение #2)

## Текущий статус

🔄 **Memo инструкция отключена**  
✅ Основная транзакция должна работать без ошибок  
⏳ Требуется тестирование транзакции БЕЗ Memo  

## Следующие шаги

1. Протестировать транзакцию БЕЗ Memo инструкции
2. Если работает - реализовать UI превью (решение #3)
3. Если не работает - искать другую причину ошибки симуляции в Phantom


