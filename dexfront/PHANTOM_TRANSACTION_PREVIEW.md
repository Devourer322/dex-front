# Phantom Transaction Preview - Полное руководство

## 🎯 Цель
Обеспечить корректное отображение информации о покупке/продаже токенов в модальном окне Phantom Wallet.

## 📋 Что должен показывать Phantom при покупке токенов

### 1. Основная информация
- ✅ **Вы отдаёте**: X SOL (точно, с 9 знаками)
- ✅ **Вы получите (оценочно)**: Y TOKEN (с учётом decimals)
- ✅ **Минимум к получению**: Y_min TOKEN (с учётом slippage)

### 2. Детали транзакции
- ✅ **Price Impact**: N% (влияние на цену)
- ✅ **Сетевая комиссия**: ~0.00005 SOL
- ✅ **Protocol fee**: если есть (комиссия протокола)

### 3. Безопасность
- ✅ **Blowfish warnings**: предупреждения о рисках
- ✅ **Estimated changes**: ожидаемые изменения балансов

## 🛠️ Техническая реализация

### Метод 1: signAndSendTransaction (РЕКОМЕНДУЕТСЯ)

```javascript
// Phantom автоматически показывает превью при использовании этого метода
const { signature } = await window.solana.signAndSendTransaction(transaction, {
  preflightCommitment: 'processed',
  skipPreflight: false // Важно! Phantom симулирует транзакцию
});
```

**Преимущества:**
- Phantom автоматически симулирует транзакцию
- Показывает "Estimated Changes"
- Blowfish анализирует безопасность
- Лучший UX для пользователя

### Метод 2: Добавление Memo инструкции

```javascript
import { TransactionInstruction, PublicKey } from '@solana/web3.js';

// Создаём Memo инструкцию с деталями транзакции
function createTransactionMemo(details, type, tokenInfo) {
  const memoText = type === 'buy' 
    ? `Buy ${details.expectedTokensToReceive.toLocaleString()} ${tokenInfo.ticker} for ${details.solAmount.toFixed(4)} SOL (min: ${details.minTokensToReceive.toLocaleString()})`
    : `Sell ${details.amount.toLocaleString()} ${tokenInfo.ticker} for ${details.minSolToReceive.toFixed(4)} SOL`;
  
  return new TransactionInstruction({
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from(memoText, 'utf-8')
  });
}

// Добавляем memo в начало транзакции
const memoIx = createTransactionMemo(transactionDetails, 'buy', tokenInfo.value);
transaction.instructions.unshift(memoIx);
```

### Метод 3: Симуляция транзакции

```javascript
// Симулируем транзакцию для получения точных изменений
async function simulateTransactionForPreview(transaction, connection) {
  try {
    const simulation = await connection.simulateTransaction(transaction, {
      commitment: 'processed',
      sigVerify: false
    });
    
    if (simulation.value.err) {
      console.warn('Simulation error:', simulation.value.err);
      return null;
    }
    
    console.log('✅ Simulation successful:', {
      logs: simulation.value.logs,
      unitsConsumed: simulation.value.unitsConsumed,
      accounts: simulation.value.accounts
    });
    
    return simulation.value;
  } catch (error) {
    console.error('Simulation failed:', error);
    return null;
  }
}

// Использование
const simulationResult = await simulateTransactionForPreview(tx, connection);
if (simulationResult) {
  // Показываем результаты симуляции пользователю
  console.log('Expected changes:', simulationResult.accounts);
}
```

## 📝 Чек-лист для разработчика

### Backend (API)
- [ ] Возвращать `expectedTokensToReceive` (ожидаемое количество)
- [ ] Возвращать `minTokensToReceive` (минимум с учётом slippage)
- [ ] Возвращать `priceImpact` (влияние на цену в %)
- [ ] Возвращать `estimatedFee` (оценка комиссии)
- [ ] Включать `min_out_amount` в инструкцию swap
- [ ] Устанавливать `feePayer = userPubkey`
- [ ] Использовать свежий `recentBlockhash`

### Frontend (dApp)
- [ ] Показывать квоту пользователю ДО открытия Phantom
- [ ] Отображать expected и minimum amounts
- [ ] Показывать price impact
- [ ] Использовать `signAndSendTransaction` вместо `signTransaction`
- [ ] Добавлять Memo инструкцию с деталями
- [ ] Симулировать транзакцию перед отправкой
- [ ] Обрабатывать ошибки (min return, insufficient fee)
- [ ] Использовать BN/BigNumber для точных расчётов

### Phantom Wallet
- [ ] Проверить, что показывается "Estimated Changes"
- [ ] Проверить Blowfish warnings
- [ ] Проверить отображение комиссии
- [ ] Проверить минимальное количество к получению

## 🔧 Пример правильной реализации

```javascript
async function buyToken() {
  try {
    isTransactionPending.value = true;
    
    // 1. Получаем квоту от backend
    const response = await fetch(`http://localhost:3000/api/token/buy/${mintAddress}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: solAmount,
        expectedPrice: currentPrice,
        slippage: slippage.value,
        userAddress: window.solana.publicKey.toString()
      })
    });
    
    const data = await response.json();
    const { transaction, transactionDetails } = data.data;
    
    // 2. Показываем пользователю детали ДО открытия Phantom
    console.log('📋 Transaction Preview:', {
      youPay: `${transactionDetails.solAmount.toFixed(4)} SOL`,
      youReceive: `~${transactionDetails.expectedTokensToReceive.toLocaleString()} ${tokenInfo.value.ticker}`,
      minimum: `${transactionDetails.minTokensToReceive.toLocaleString()} ${tokenInfo.value.ticker}`,
      priceImpact: `${transactionDetails.priceImpact}%`,
      fee: `~0.00005 SOL`
    });
    
    // 3. Десериализуем транзакцию
    const { Transaction, Connection, clusterApiUrl } = await import('@solana/web3.js');
    const { Buffer } = await import('buffer');
    const connection = new Connection(clusterApiUrl('devnet'));
    const tx = Transaction.from(Buffer.from(transaction, 'base64'));
    
    // 4. Добавляем Memo инструкцию
    const memoIx = createTransactionMemo(transactionDetails, 'buy', tokenInfo.value);
    tx.instructions.unshift(memoIx);
    
    // 5. Обновляем blockhash
    const latestBlockhash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    
    // 6. Симулируем транзакцию (опционально)
    const simulation = await simulateTransactionForPreview(tx, connection);
    if (simulation) {
      console.log('✅ Simulation successful, expected changes:', simulation.accounts);
    }
    
    // 7. Используем signAndSendTransaction для лучшего превью
    const { signature } = await window.solana.signAndSendTransaction(tx, {
      preflightCommitment: 'processed',
      skipPreflight: false // Phantom симулирует транзакцию
    });
    
    console.log('✅ Transaction successful:', signature);
    
    // 8. Ждём подтверждения
    await connection.confirmTransaction(signature, 'confirmed');
    
    alert(`🎉 Successfully bought ${transactionDetails.expectedTokensToReceive.toLocaleString()} ${tokenInfo.value.ticker}!`);
    
  } catch (error) {
    console.error('Error buying tokens:', error);
    handleTransactionError(error);
  } finally {
    isTransactionPending.value = false;
  }
}
```

## ⚠️ Типичные ошибки

### 1. Использование signTransaction вместо signAndSendTransaction
❌ **Неправильно:**
```javascript
const signedTx = await window.solana.signTransaction(tx);
const signature = await connection.sendRawTransaction(signedTx.serialize());
```

✅ **Правильно:**
```javascript
const { signature } = await window.solana.signAndSendTransaction(tx, {
  skipPreflight: false
});
```

### 2. Отсутствие Memo инструкции
❌ **Неправильно:** Отправка транзакции без контекста

✅ **Правильно:** Добавление Memo с деталями транзакции

### 3. Отсутствие симуляции
❌ **Неправильно:** Отправка без проверки

✅ **Правильно:** Симуляция перед отправкой

### 4. Неправильные decimals
❌ **Неправильно:** Использование float для расчётов

✅ **Правильно:** Использование BN/BigNumber

## 📚 Полезные ссылки

- [Phantom - Sign and Send Transaction](https://docs.phantom.com/sdks/browser-sdk/sign-and-send-transaction)
- [Phantom - Send a versioned transaction](https://docs.phantom.com/solana/sending-a-transaction-1)
- [Phantom Help - Why did my swap fail?](https://help.phantom.com/hc/en-us/articles/5985106844435)
- [Phantom Help - Slippage](https://help.phantom.com/hc/en-us/articles/27085326202515)
- [Solana Cookbook - Transactions](https://solanacookbook.com/core-concepts/transactions.html)

## 🎯 Итоговые рекомендации

1. **Используйте signAndSendTransaction** - это даёт лучший UX
2. **Добавляйте Memo инструкции** - для контекста транзакции
3. **Симулируйте транзакции** - для проверки корректности
4. **Показывайте детали ДО Phantom** - в вашем UI
5. **Обрабатывайте ошибки правильно** - с понятными сообщениями
6. **Используйте BN для расчётов** - для точности
7. **Тестируйте на devnet** - перед mainnet

## 🚀 Следующие шаги

1. Восстановить Transaction Preview в UI
2. Добавить Memo инструкции
3. Вернуть signAndSendTransaction
4. Добавить симуляцию транзакций
5. Улучшить обработку ошибок
6. Тестировать с реальным Phantom Wallet


