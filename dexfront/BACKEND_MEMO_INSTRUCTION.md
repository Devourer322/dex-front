# Добавление Memo инструкции на бэкенде для Versioned Transaction

## 🎯 Проблема

Phantom Wallet **не показывает детали** транзакции (сколько токенов купится за сколько SOL), хотя транзакция выполняется успешно.

## 🔍 Причина

Для **Versioned Transaction** Phantom не может автоматически распарсить детали из инструкций программы. Нужно добавить **Memo инструкцию**, которую Phantom отобразит в UI.

## ✅ Решение

Добавить **Memo инструкцию** на бэкенде перед созданием Versioned Transaction.

---

## 📝 Инструкция для бэкенда

### 1. Импортировать необходимые модули

```javascript
const { 
  TransactionInstruction, 
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} = require('@solana/web3.js');
```

### 2. Создать Memo инструкцию

```javascript
// Memo Program ID (SPL Memo Program)
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// Форматировать текст Memo
const expectedTokensFormatted = Math.floor(expectedTokensToReceive).toLocaleString();
const minTokensFormatted = Math.floor(minTokensToReceive).toLocaleString();
const solAmountFormatted = solAmountNeeded.toFixed(4);
const tokenSymbol = 'ASD'; // Получить из базы данных

const memoText = `🔵 BUY: ${solAmountFormatted} SOL → ${expectedTokensFormatted} ${tokenSymbol} (min: ${minTokensFormatted})`;

console.log('📝 Creating memo instruction:', memoText);

// Создать Memo инструкцию
const memoInstruction = new TransactionInstruction({
  keys: [],
  programId: MEMO_PROGRAM_ID,
  data: Buffer.from(memoText, 'utf-8')
});
```

### 3. Добавить Memo в массив инструкций

```javascript
// Массив инструкций для транзакции
const instructions = [
  memoInstruction,  // ← Memo инструкция ПЕРВОЙ
  swapInstruction   // Основная swap инструкция
];
```

### 4. Создать Versioned Transaction с Memo

```javascript
// Создать MessageV0 с обеими инструкциями
const messageV0 = new TransactionMessage({
  payerKey: userPubkey,
  recentBlockhash: latestBlockhash.blockhash,
  instructions: instructions  // ← Массив с Memo и swap инструкциями
}).compileToV0Message();

// Создать Versioned Transaction
const transaction = new VersionedTransaction(messageV0);

console.log('✅ Versioned Transaction created with Memo instruction');
```

---

## 📋 Полный пример для `/buy/:mintAddress`

```javascript
// POST /api/token/buy/:mintAddress
router.post('/buy/:mintAddress', async (req, res) => {
  try {
    // ... (предыдущий код: валидация, расчеты, проверки)

    // 1. Создать Memo инструкцию
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    
    const expectedTokensFormatted = Math.floor(expectedTokensToReceive).toLocaleString();
    const minTokensFormatted = Math.floor(minTokensToReceive).toLocaleString();
    const solAmountFormatted = solAmountNeeded.toFixed(4);
    
    // Получить символ токена из базы данных
    const token = await Token.findOne({ where: { mint_address: mintAddress } });
    const tokenSymbol = token?.symbol || 'TOKENS';
    
    const memoText = `🔵 BUY: ${solAmountFormatted} SOL → ${expectedTokensFormatted} ${tokenSymbol} (min: ${minTokensFormatted})`;
    
    console.log('📝 Creating memo instruction:', memoText);
    
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoText, 'utf-8')
    });

    // 2. Создать swap инструкцию (существующий код)
    const swapInstruction = new TransactionInstruction({
      keys: [
        { pubkey: userPubkey, isSigner: true, isWritable: true },
        { pubkey: globalPDA, isSigner: false, isWritable: false },
        { pubkey: feeReceiver, isSigner: false, isWritable: true },
        { pubkey: mintPubkey, isSigner: false, isWritable: false },
        { pubkey: bondingCurvePDA, isSigner: false, isWritable: true },
        { pubkey: bondingCurveTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userTokenAccount, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: eventAuthority, isSigner: false, isWritable: false },
        { pubkey: PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: swapInstructionData
    });

    // 3. Объединить инструкции (Memo ПЕРВОЙ!)
    const instructions = [
      memoInstruction,  // ← Memo инструкция
      swapInstruction   // ← Swap инструкция
    ];

    // 4. Создать Versioned Transaction
    const latestBlockhash = await connection.getLatestBlockhash('finalized');
    
    const messageV0 = new TransactionMessage({
      payerKey: userPubkey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: instructions
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    console.log('✅ Versioned Transaction created with Memo instruction');

    // 5. Симулировать транзакцию
    console.log('🧪 Симуляция Versioned Transaction...');
    const simulation = await connection.simulateTransaction(transaction, {
      commitment: 'processed',
      sigVerify: false,
      replaceRecentBlockhash: true
    });
    
    if (simulation.value.err) {
      console.error('❌ Симуляция транзакции провалилась:', simulation.value.err);
      return res.status(400).json({
        success: false,
        message: 'Transaction simulation failed',
        error: 'SIMULATION_FAILED'
      });
    }
    
    console.log('✅ Симуляция успешна!');
    console.log('  Units consumed:', simulation.value.unitsConsumed);

    // 6. Сериализовать и отправить на фронтенд
    const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

    res.json({
      success: true,
      message: 'Buy token transaction created successfully (Versioned Transaction v0 with Memo)',
      data: {
        transaction: serializedTransaction,
        transactionVersion: 0,
        transactionDetails: {
          mintAddress: mintAddress,
          amount: solAmountNeeded,
          solAmount: solAmountNeeded,
          expectedPrice: currentPrice,
          expectedTokensToReceive: expectedTokensToReceive,
          minTokensToReceive: minTokensToReceive,
          slippage: slippage,
          currentPrice: currentPrice,
          bondingCurveAddress: bondingCurvePDA.toString(),
          userTokenAccount: userTokenAccount.toString()
        },
        instructions: {
          programId: PROGRAM_ID.toString(),
          data: swapInstructionData.toString('hex'),
          accounts: [/* ... */]
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in buy token endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create buy transaction',
      error: error.message
    });
  }
});
```

---

## 📋 Полный пример для `/sell/:mintAddress`

```javascript
// POST /api/token/sell/:mintAddress
router.post('/sell/:mintAddress', async (req, res) => {
  try {
    // ... (предыдущий код: валидация, расчеты, проверки)

    // 1. Создать Memo инструкцию
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    
    const tokenAmountFormatted = Math.floor(tokenAmountToSell).toLocaleString();
    const expectedSolFormatted = expectedSolToReceive.toFixed(4);
    const minSolFormatted = minSolToReceive.toFixed(4);
    
    // Получить символ токена из базы данных
    const token = await Token.findOne({ where: { mint_address: mintAddress } });
    const tokenSymbol = token?.symbol || 'TOKENS';
    
    const memoText = `🔴 SELL: ${tokenAmountFormatted} ${tokenSymbol} → ${expectedSolFormatted} SOL (min: ${minSolFormatted})`;
    
    console.log('📝 Creating memo instruction:', memoText);
    
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoText, 'utf-8')
    });

    // 2. Создать swap инструкцию (существующий код)
    const swapInstruction = new TransactionInstruction({
      keys: [/* ... */],
      programId: PROGRAM_ID,
      data: swapInstructionData
    });

    // 3. Объединить инструкции (Memo ПЕРВОЙ!)
    const instructions = [
      memoInstruction,  // ← Memo инструкция
      swapInstruction   // ← Swap инструкция
    ];

    // 4. Создать Versioned Transaction
    const latestBlockhash = await connection.getLatestBlockhash('finalized');
    
    const messageV0 = new TransactionMessage({
      payerKey: userPubkey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: instructions
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    console.log('✅ Versioned Transaction created with Memo instruction');

    // 5. Симулировать и отправить
    // ... (аналогично buy endpoint)

  } catch (error) {
    console.error('❌ Error in sell token endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sell transaction',
      error: error.message
    });
  }
});
```

---

## 🎯 Что изменится в Phantom Wallet

### До добавления Memo:
```
┌─────────────────────────────────────┐
│ Подтверждение транзакции            │
├─────────────────────────────────────┤
│ Сеть                    Solana      │
│ Комиссия сети          0.00008 SOL  │
│                                     │
│ ▼ Дополнительно                     │
│   Unknown Program                   │
│   Data: f8c69e91e17587c8...         │
│                                     │
│   [Отмена]           [Подтвердить]  │
└─────────────────────────────────────┘
```

### После добавления Memo:
```
┌─────────────────────────────────────┐
│ Подтверждение транзакции            │
├─────────────────────────────────────┤
│ Сеть                    Solana      │
│ Комиссия сети          0.00008 SOL  │
│                                     │
│ ▼ Дополнительно                     │
│   Memo Program                      │
│   🔵 BUY: 0.0100 SOL → 353,764 ASD  │
│        (min: 336,076)               │
│                                     │
│   Unknown Program                   │
│   Data: f8c69e91e17587c8...         │
│                                     │
│   [Отмена]           [Подтвердить]  │
└─────────────────────────────────────┘
```

---

## ⚠️ Важные моменты

### 1. Memo должен быть ПЕРВОЙ инструкцией

```javascript
const instructions = [
  memoInstruction,  // ← ПЕРВАЯ
  swapInstruction   // ← ВТОРАЯ
];
```

**Почему:** Phantom отображает инструкции в порядке их добавления. Memo должен быть первым, чтобы пользователь сразу видел детали.

### 2. Формат Memo текста

**Рекомендуемый формат:**
```
🔵 BUY: 0.0100 SOL → 353,764 ASD (min: 336,076)
🔴 SELL: 100,000 ASD → 0.0050 SOL (min: 0.0048)
```

**Почему:**
- ✅ Эмодзи (🔵/🔴) для визуального выделения
- ✅ Короткий и понятный формат
- ✅ Стрелка (→) показывает направление обмена
- ✅ Минимальное количество в скобках

### 3. Размер Memo

**Максимальный размер:** 566 байт (UTF-8)

**Рекомендуемый размер:** < 100 символов

**Текущий размер:** ~50 символов ✅

### 4. Стоимость Memo

**Дополнительная комиссия:** ~0.000005 SOL (5000 lamports)

**Compute Units:** ~500 units

**Итого:** Незначительное увеличение комиссии

---

## 🧪 Тестирование

### 1. Добавить Memo на бэкенде

Обновите файл `src/routes/token.js` согласно примерам выше.

### 2. Перезапустить бэкенд

```bash
npm run dev
```

### 3. Проверить логи бэкенда

Должно быть:
```
📝 Creating memo instruction: 🔵 BUY: 0.0100 SOL → 353,764 ASD (min: 336,076)
✅ Versioned Transaction created with Memo instruction
🧪 Симуляция Versioned Transaction...
✅ Симуляция успешна!
  Units consumed: 170395  (было 169895, +500 для Memo)
```

### 4. Попробовать купить токены

1. Откройте фронтенд
2. Введите сумму для покупки
3. Нажмите "Place buy order"
4. В Phantom откройте "Дополнительно"
5. **Должен отображаться Memo с деталями!** ✅

---

## 📊 Преимущества

### До (без Memo):
❌ Phantom не показывает детали  
❌ Пользователь не знает, что получит  
❌ Плохой UX  

### После (с Memo):
✅ Phantom показывает детали в UI  
✅ Пользователь видит, что получит  
✅ Отличный UX  
✅ Прозрачность транзакции  

---

## 🔗 Связанные файлы

- `src/routes/token.js` - Эндпоинты `/buy` и `/sell` (на бэкенде)
- `dexfront/VERSIONED_TRANSACTION_SUPPORT.md` - Документация по Versioned Transaction
- `dexfront/PHANTOM_MEMO_SOLUTION.md` - Документация по Memo инструкциям

---

## 📅 Дата создания

**30 октября 2025**

Добавьте Memo на бэкенде для лучшего UX в Phantom Wallet! 🚀


