# СРОЧНО: Использовать Legacy Transaction вместо Versioned для Phantom

**Дата:** 30 октября 2025  
**Приоритет:** 🔴 КРИТИЧЕСКИЙ  
**Для:** Backend разработчик

---

## 🔴 ПРОБЛЕМА

Phantom Wallet **НЕ МОЖЕТ** корректно симулировать и отображать детали для **Versioned Transaction (v0)**:

### Что происходит сейчас:
1. ✅ Бэкенд создаёт **Versioned Transaction v0**
2. ✅ Фронтенд успешно симулирует транзакцию
3. ✅ Memo инструкция присутствует
4. ❌ Phantom **НЕ МОЖЕТ** симулировать Versioned Transaction
5. ❌ Phantom показывает **ошибку**: "Эта транзакция была отменена во время моделирования"
6. ❌ Phantom **НЕ ПОКАЗЫВАЕТ** детали (SOL, токены, минимум, etc.)

### Скриншот проблемы:
```
Phantom Wallet
┌─────────────────────────────────────┐
│ Подтверждение транзакции            │
│                                     │
│ ⚠️ Эта транзакция была отменена     │
│    во время моделирования.          │
│    При отправке средства могут      │
│    быть утеряны.                    │
│                                     │
│ Сеть: Solana                        │
│ Комиссия сети: 0.00008 SOL          │
│                                     │
│ ❌ НЕТ информации о:                │
│    - Сколько SOL отдаёшь            │
│    - Сколько токенов получаешь      │
│    - Минимум, slippage, etc.        │
│                                     │
│ [Отмена]  [Подтвердить]             │
└─────────────────────────────────────┘
```

---

## ✅ РЕШЕНИЕ: Использовать Legacy Transaction

### Что нужно изменить на бэкенде:

#### 1. Вместо Versioned Transaction:
```javascript
// ❌ УБРАТЬ ЭТО:
const messageV0 = new TransactionMessage({
  payerKey: userPublicKey,
  recentBlockhash: blockhash,
  instructions: [memoInstruction, swapInstruction],
}).compileToV0Message();

const transaction = new VersionedTransaction(messageV0);
```

#### 2. Использовать Legacy Transaction:
```javascript
// ✅ ИСПОЛЬЗОВАТЬ ЭТО:
const { Transaction } = require('@solana/web3.js');

const transaction = new Transaction();
transaction.recentBlockhash = blockhash;
transaction.feePayer = userPublicKey;

// Добавляем инструкции
transaction.add(memoInstruction);  // Memo должен быть первым!
transaction.add(swapInstruction);
```

---

## 📝 Полная реализация для бэкенда

### Файл: `routes/tokens.js` (или где создаётся транзакция)

```javascript
const { 
  Transaction, 
  TransactionInstruction,
  PublicKey,
  Connection,
  clusterApiUrl
} = require('@solana/web3.js');

// Функция создания BUY транзакции
async function createBuyTransaction(userWallet, mintAddress, solAmount, slippage) {
  const connection = new Connection(clusterApiUrl('devnet'));
  
  // 1. Получаем данные для swap инструкции
  const swapData = await prepareSwapInstruction(/* ... */);
  
  // 2. Создаём Memo инструкцию
  const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
  
  const expectedTokens = Math.floor(swapData.expectedTokensToReceive);
  const minTokens = Math.floor(swapData.minTokensToReceive);
  const tokenSymbol = swapData.tokenSymbol || 'TOKENS';
  
  const memoText = `🔵 BUY: ${solAmount.toFixed(4)} SOL → ${expectedTokens.toLocaleString()} ${tokenSymbol} (min: ${minTokens.toLocaleString()})`;
  
  const memoInstruction = new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoText, 'utf-8')
  });
  
  // 3. Создаём LEGACY Transaction (НЕ Versioned!)
  const transaction = new Transaction();
  
  // 4. Получаем свежий blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  
  // 5. Устанавливаем fee payer
  transaction.feePayer = new PublicKey(userWallet);
  
  // 6. Добавляем инструкции (Memo ПЕРВЫМ!)
  transaction.add(memoInstruction);
  transaction.add(swapData.swapInstruction);
  
  // 7. Симулируем транзакцию
  console.log('🧪 Симуляция Legacy Transaction...');
  const simulation = await connection.simulateTransaction(transaction);
  
  if (simulation.value.err) {
    console.error('❌ Симуляция не прошла:', simulation.value.err);
    throw new Error('Transaction simulation failed');
  }
  
  console.log('✅ Симуляция успешна!');
  console.log('   Units consumed:', simulation.value.unitsConsumed);
  console.log('   Logs:', simulation.value.logs?.slice(0, 5));
  
  // 8. Сериализуем транзакцию
  const serialized = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false
  }).toString('base64');
  
  console.log('✅ Legacy Transaction created successfully');
  console.log('📝 Transaction size:', serialized.length, 'bytes (base64)');
  
  // 9. Возвращаем данные
  return {
    transaction: serialized,
    transactionVersion: null, // null = Legacy Transaction
    transactionDetails: {
      solAmount,
      expectedTokensToReceive: swapData.expectedTokensToReceive,
      minTokensToReceive: swapData.minTokensToReceive,
      slippage,
      bondingCurveAddress: swapData.bondingCurveAddress,
      userTokenAccount: swapData.userTokenAccount,
      mintAddress,
      amount: solAmount,
      currentPrice: swapData.currentPrice,
      expectedPrice: swapData.expectedPrice
    }
  };
}
```

---

## 🔑 Ключевые изменения:

### 1. Тип транзакции:
```javascript
// ❌ БЫЛО (Versioned):
transactionVersion: 0

// ✅ СТАЛО (Legacy):
transactionVersion: null  // или undefined
```

### 2. Создание транзакции:
```javascript
// ❌ БЫЛО:
const messageV0 = new TransactionMessage({...}).compileToV0Message();
const transaction = new VersionedTransaction(messageV0);

// ✅ СТАЛО:
const transaction = new Transaction();
transaction.recentBlockhash = blockhash;
transaction.feePayer = userPublicKey;
transaction.add(memoInstruction);
transaction.add(swapInstruction);
```

### 3. Сериализация:
```javascript
// ❌ БЫЛО (Versioned):
const serialized = transaction.serialize().toString('base64');

// ✅ СТАЛО (Legacy):
const serialized = transaction.serialize({
  requireAllSignatures: false,
  verifySignatures: false
}).toString('base64');
```

---

## 📊 Что изменится на фронтенде:

### Фронтенд автоматически определит тип:
```javascript
// В transactionUtils.js уже есть функция deserializeTransaction:
export function deserializeTransaction(transactionBase64, version) {
  const buffer = Buffer.from(transactionBase64, 'base64');
  
  if (version === 0) {
    // Versioned Transaction
    return VersionedTransaction.deserialize(buffer);
  } else {
    // Legacy Transaction (version === null или undefined)
    return Transaction.from(buffer);
  }
}
```

### Phantom будет работать корректно:
1. ✅ Phantom **сможет симулировать** Legacy Transaction
2. ✅ Phantom **покажет детали** из Memo инструкции
3. ✅ Пользователь **увидит**:
   - Сколько SOL отдаёт
   - Сколько токенов получает
   - Минимум с учётом slippage
   - Комиссию сети

---

## 🎯 Ожидаемый результат после изменений:

```
Phantom Wallet
┌─────────────────────────────────────┐
│ Подтверждение транзакции            │
│                                     │
│ 🔵 Покупка токенов                  │
│                                     │
│ ✅ Вы отправляете:                  │
│    0.0100 SOL                       │
│                                     │
│ ✅ Вы получаете:                    │
│    ~355,884 ZXC                     │
│                                     │
│ ✅ Минимум:                         │
│    338,090 ZXC (slippage 5%)        │
│                                     │
│ Комиссия сети: 0.00008 SOL          │
│                                     │
│ ▼ Дополнительно                     │
│   Memo: 🔵 BUY: 0.0100 SOL →        │
│         355,884 ZXC (min: 338,090)  │
│                                     │
│ [Отмена]  [Подтвердить]             │
└─────────────────────────────────────┘
```

---

## ⚠️ Важные замечания:

1. **Legacy Transaction работает везде** - поддерживается всеми кошельками
2. **Versioned Transaction (v0)** - новый формат, но Phantom пока плохо с ним работает
3. **Memo инструкция ОБЯЗАТЕЛЬНА** - без неё Phantom не покажет детали
4. **Memo должен быть ПЕРВЫМ** - `transaction.add(memoInstruction)` перед swap
5. **Симуляция обязательна** - проверяй транзакцию перед отправкой на фронтенд

---

## 🧪 Как проверить:

### 1. Проверь логи бэкенда:
```
✅ Legacy Transaction created successfully
📝 Transaction size: 864 bytes (base64)
🧪 Симуляция Legacy Transaction...
✅ Симуляция успешна!
   Units consumed: 214083
```

### 2. Проверь ответ API:
```json
{
  "success": true,
  "message": "Buy token transaction created successfully (Legacy Transaction)",
  "data": {
    "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAkNDbzarjueAj1VpL2SpMqInhIyg1FB3YYisNBUt0TmUupUBGuxr/9ZjsedSqrcww4yYde+SLuynrfavvQMDjOxrHZef9Dv7Wf24P7L89Az2Nca5lwLk/3uHJwbBN2pITKhlwdkB37d8XAbcrXwB32vOraP3GT11ByWu60ZZ+niWrulpAgOCwjvDHNY6RZgM7taWdDS5RTc0reFlIUoGEIpZgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGRr+1k8mPzH+GobpHXW/KQ5DkYAbjRQNY/X09UOwkdcyTcka59kqK7dnfoisT6ioiWEdkQizmd63Wr5AJiJIooyXJY9OJInxuz0QKRSODYMLWhOZ2v8QhASOe9jb6fhZ3pl5/rwbnPcv0El2XbelzdzOkA8GSQTFOPahXfI9SokGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpB+dryu+9auK+PsEUNWQGTBM7XP2Nsq8YHmSNOPZ2cy77hqowMxfuDDRZAqNk4kDuFCTLncmw5c0aJSS9MavWSQEJDQAMAwYCAQQFCwgKBwkZ+MaekeF1h8gAgJaYAAAAAACKIgUAAAAAAA==",
    "transactionVersion": null,
    "transactionDetails": {
      "solAmount": 0.01,
      "expectedTokensToReceive": 355884.32021125,
      "minTokensToReceive": 338090,
      "slippage": 5,
      "bondingCurveAddress": "63HPHip9fyRag8dtgNhfSGv2e2YEzXH9NHEn339beiM3",
      "userTokenAccount": "BF3u21Ao6sUcBrFfyqeBmQo62xv9pZh3qbrH1nri9F4Z",
      "mintAddress": "F6BrNbmYevNM6Vshfhx4My43zfzHxXWeH4TxkfjPv1jH",
      "amount": 0.01,
      "currentPrice": 2.8089676806447944e-8,
      "expectedPrice": 4690.976026676806
    }
  }
}
```

**Ключевое поле:** `"transactionVersion": null` (Legacy Transaction)

### 3. Проверь фронтенд логи:
```
📦 Deserializing Legacy Transaction...
✅ Legacy Transaction deserialized: {
  feePayer: 'vdKmw2YpTw2RqE3EE49MvPovCNtSBkgyRz6E22m3Hn9',
  instructions: 2
}
```

---

## 📚 Дополнительная информация:

### Почему Legacy Transaction лучше для Phantom?

1. **Полная поддержка** - Phantom отлично работает с Legacy Transactions с 2021 года
2. **Корректная симуляция** - Phantom может симулировать и показывать детали
3. **Стабильность** - нет проблем с отображением Memo инструкций
4. **Совместимость** - работает со всеми кошельками (Phantom, Solflare, etc.)

### Когда использовать Versioned Transaction?

- Когда нужны **Address Lookup Tables** (экономия размера транзакции)
- Когда работаешь с **большим количеством аккаунтов** (>30)
- Когда используешь **программы, требующие v0**

Для обычного swap'а **Legacy Transaction достаточно!**

---

## 🚀 Следующие шаги:

1. ✅ **Бэкенд:** Измени создание транзакции на Legacy
2. ✅ **Бэкенд:** Установи `transactionVersion: null`
3. ✅ **Бэкенд:** Проверь симуляцию
4. ✅ **Фронтенд:** Уже готов (автоматически определяет тип)
5. ✅ **Тестирование:** Проверь, что Phantom показывает детали

---

## ✅ Критерии успеха:

После изменений:
- ✅ Phantom **НЕ показывает** ошибку симуляции
- ✅ Phantom **показывает детали**: SOL, токены, минимум
- ✅ Транзакция **проходит успешно**
- ✅ Пользователь **видит всю информацию** перед подтверждением

---

**СРОЧНО:** Пожалуйста, внеси эти изменения как можно скорее!  
**Приоритет:** 🔴 КРИТИЧЕСКИЙ (блокирует UX)

**Статус:** 🔴 Требует изменений на бэкенде


