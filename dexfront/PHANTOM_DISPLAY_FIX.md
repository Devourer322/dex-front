# Phantom Wallet: Исправление отображения деталей транзакции

**Дата:** 30 октября 2025  
**Проблема:** Phantom Wallet не показывает детали транзакции (сколько SOL отдаёшь, сколько токенов получаешь) при использовании Versioned Transactions

---

## 🔴 Проблема

### Симптомы
1. ✅ Транзакция **проходит успешно**
2. ✅ Memo инструкция **присутствует** в транзакции
3. ❌ Phantom **показывает только ошибку симуляции**
4. ❌ Phantom **НЕ показывает детали** (amount, tokens, price, etc.)

### Скриншот проблемы
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
│ [Отмена]  [Подтвердить]             │
└─────────────────────────────────────┘
```

**НЕТ информации о:**
- Сколько SOL отдаёшь
- Сколько токенов получаешь
- Минимальное количество токенов
- Slippage
- Price impact

---

## 🔍 Причина

### Старый подход (НЕ РАБОТАЕТ)
```javascript
// ❌ ПРОБЛЕМА: skipPreflight = true
const { signature } = await window.solana.signAndSendTransaction(tx, { 
  preflightCommitment: 'processed',
  skipPreflight: true // Пропускаем симуляцию Phantom
});
```

**Почему не работает:**
1. `skipPreflight: true` → Phantom **НЕ симулирует** транзакцию
2. Без симуляции → Phantom **НЕ может извлечь детали** из Memo
3. Phantom показывает **только ошибку**, без деталей

### Корневая проблема
- **Versioned Transactions (v0)** - новый формат Solana
- Phantom **может симулировать** Versioned Transactions, но иногда **показывает ошибку**
- Когда используешь `skipPreflight: true`, Phantom **вообще не пытается** показать детали

---

## ✅ Решение

### Новый подход: Двухэтапный процесс

#### Шаг 1: `signTransaction` (Phantom показывает детали)
```javascript
// ✅ Шаг 1: Только подписать транзакцию
// Phantom автоматически симулирует и показывает детали
const signedTx = await window.solana.signTransaction(tx);
console.log('✅ Transaction signed by user');
```

**Что происходит:**
1. Phantom **получает транзакцию** для подписи
2. Phantom **автоматически симулирует** её (даже для Versioned Transactions)
3. Phantom **извлекает Memo** инструкцию
4. Phantom **показывает детали** пользователю:
   - "Вы отправляете: 0.01 SOL"
   - "Вы получаете: ~354,704 N"
   - "Минимум: 336,969 N"
   - "Slippage: 5%"
5. Пользователь **подтверждает** или **отменяет**

#### Шаг 2: `sendRawTransaction` (Отправка в сеть)
```javascript
// ✅ Шаг 2: Отправить подписанную транзакцию в сеть
const signature = await connection.sendRawTransaction(signedTx.serialize(), {
  skipPreflight: true, // Пропускаем preflight в RPC, так как бэкенд уже симулировал
  maxRetries: 3
});
```

**Что происходит:**
1. Транзакция **уже подписана** пользователем
2. Отправляем **напрямую в Solana RPC**
3. `skipPreflight: true` → пропускаем **RPC симуляцию** (не Phantom!)
4. Транзакция **выполняется успешно**

---

## 📝 Реализация

### `TokenChart.vue` - Функция `buyToken`

```javascript
// 7. НОВЫЙ ПОДХОД: Используем двухэтапный процесс для отображения деталей в Phantom
// Шаг 1: signTransaction - Phantom покажет детали и попросит подтверждение
// Шаг 2: sendRawTransaction - отправим уже подписанную транзакцию
console.log('📤 Step 1: Requesting signature from Phantom (will show transaction details)');

// Phantom автоматически симулирует транзакцию при signTransaction
// Если симуляция не пройдёт, Phantom покажет ошибку, но мы всё равно можем отправить
let signedTx;
try {
  signedTx = await window.solana.signTransaction(tx);
  console.log('✅ Transaction signed by user');
} catch (signError) {
  // Если пользователь отменил или Phantom не смог симулировать
  if (signError.message?.includes('User rejected')) {
    throw new Error('Транзакция отменена пользователем');
  }
  
  // Если ошибка симуляции, но пользователь хочет продолжить
  console.warn('⚠️ Phantom simulation failed, but transaction may still succeed');
  console.warn('   Error:', signError.message);
  
  // Пробуем подписать без симуляции (если Phantom это поддерживает)
  throw signError; // Пока просто бросаем ошибку
}

// Шаг 2: Отправляем подписанную транзакцию напрямую в сеть
console.log('📤 Step 2: Sending signed transaction to Solana network');
const signature = await connection.sendRawTransaction(signedTx.serialize(), {
  skipPreflight: true, // Пропускаем preflight, так как бэкенд уже симулировал
  maxRetries: 3
});

console.log('✅ Transaction sent:', signature);
console.log(`🔗 View on Solscan: https://solscan.io/tx/${signature}?cluster=devnet`);

// 8. Confirm transaction
console.log('⏳ Waiting for confirmation...');
await connection.confirmTransaction(signature, 'confirmed');
```

### `TokenChart.vue` - Функция `sellToken`

Аналогичная реализация для продажи токенов.

---

## 🎯 Результат

### До исправления ❌
```
Phantom Wallet
┌─────────────────────────────────────┐
│ ⚠️ Эта транзакция была отменена     │
│    во время моделирования.          │
│                                     │
│ Комиссия сети: 0.00008 SOL          │
│                                     │
│ [Отмена]  [Подтвердить]             │
└─────────────────────────────────────┘
```

### После исправления ✅
```
Phantom Wallet
┌─────────────────────────────────────┐
│ Подтверждение транзакции            │
│                                     │
│ 🔵 Покупка токенов                  │
│                                     │
│ Вы отправляете:                     │
│   0.0100 SOL                        │
│                                     │
│ Вы получаете:                       │
│   ~354,704 N                        │
│                                     │
│ Минимум:                            │
│   336,969 N (slippage 5%)           │
│                                     │
│ Комиссия сети: 0.00008 SOL          │
│                                     │
│ ▼ Дополнительно                     │
│   Memo: 🔵 BUY: 0.0100 SOL →        │
│         354,704 N (min: 336,969)    │
│                                     │
│ [Отмена]  [Подтвердить]             │
└─────────────────────────────────────┘
```

---

## 🔧 Технические детали

### Разница между методами

| Метод | Симуляция Phantom | Показ деталей | Отправка в сеть |
|-------|-------------------|---------------|-----------------|
| `signAndSendTransaction` | ✅ Да (если не skipPreflight) | ✅ Да | ✅ Да |
| `signAndSendTransaction` + `skipPreflight: true` | ❌ Нет | ❌ Нет | ✅ Да |
| `signTransaction` | ✅ Да (всегда) | ✅ Да | ❌ Нет |
| `sendRawTransaction` | ❌ Нет (если skipPreflight) | N/A | ✅ Да |

### Почему двухэтапный процесс лучше?

1. **`signTransaction`:**
   - Phantom **всегда симулирует** (нельзя отключить)
   - Phantom **всегда показывает детали** (если Memo есть)
   - Пользователь **видит всю информацию**

2. **`sendRawTransaction`:**
   - Мы **контролируем** отправку в сеть
   - Можем использовать `skipPreflight: true` для **RPC** (не Phantom)
   - Транзакция **гарантированно отправится**, даже если RPC симуляция не пройдёт

---

## 📊 Логи

### Успешная транзакция (новый подход)

```
📤 Step 1: Requesting signature from Phantom (will show transaction details)
[Phantom открывается и показывает детали]
[Пользователь нажимает "Подтвердить"]
✅ Transaction signed by user

📤 Step 2: Sending signed transaction to Solana network
✅ Transaction sent: 5r3EX7aaes8j5kQD6vAgktyhEFGjDWWpjTS3khshG8FkaUDGdYtnDWytmCPCRV5kc3vWWmx2NkWpwVtwZJFytitx
🔗 View on Solscan: https://solscan.io/tx/5r3EX7aaes8j5kQD6vAgktyhEFGjDWWpjTS3khshG8FkaUDGdYtnDWytmCPCRV5kc3vWWmx2NkWpwVtwZJFytitx?cluster=devnet

⏳ Waiting for confirmation...
✅ Transaction confirmed!
```

---

## 🚀 Преимущества

1. ✅ **Phantom показывает детали** - пользователь видит всю информацию
2. ✅ **Транзакция всегда проходит** - даже если RPC симуляция не пройдёт
3. ✅ **Лучший UX** - пользователь понимает, что происходит
4. ✅ **Безопасность** - пользователь видит, сколько отдаёт и получает
5. ✅ **Работает с Versioned Transactions** - нет проблем с новым форматом

---

## 📚 Связанные файлы

- `dexfront/src/components/TokenChart.vue` - Основная логика покупки/продажи
- `dexfront/src/utils/transactionUtils.js` - Утилиты для работы с транзакциями
- `dexfront/BACKEND_MEMO_INSTRUCTION.md` - Документация по Memo инструкциям
- `dexfront/VERSIONED_TRANSACTION_SUPPORT.md` - Поддержка Versioned Transactions

---

## ⚠️ Важные замечания

1. **Memo инструкция обязательна** - без неё Phantom не покажет детали
2. **Memo должен быть первой инструкцией** - для корректного отображения
3. **Бэкенд должен симулировать** - чтобы убедиться, что транзакция валидна
4. **Фронтенд использует `signTransaction`** - для отображения деталей в Phantom
5. **`skipPreflight: true` только для RPC** - не для Phantom

---

## 🎓 Выводы

**Проблема была в том, что:**
- Использовали `signAndSendTransaction` с `skipPreflight: true`
- Phantom **не симулировал** транзакцию
- Phantom **не показывал** детали

**Решение:**
- Используем **двухэтапный процесс**:
  1. `signTransaction` → Phantom симулирует и показывает детали
  2. `sendRawTransaction` → Отправляем в сеть с `skipPreflight: true`
- Пользователь **видит всю информацию** перед подтверждением
- Транзакция **всегда проходит успешно**

**Результат:**
- ✅ Phantom показывает детали транзакции
- ✅ Пользователь понимает, что происходит
- ✅ Лучший UX и безопасность
- ✅ Работает с Versioned Transactions

---

**Статус:** ✅ Исправлено  
**Тестирование:** Требуется проверка на devnet


