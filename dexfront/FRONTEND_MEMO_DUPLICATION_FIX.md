# Исправление дублирования Memo инструкций

**Дата:** 31 октября 2025  
**Тип:** Bugfix  
**Статус:** ✅ ИСПРАВЛЕНО

---

## 🐛 Проблема

В транзакциях появлялись **ДВЕ Memo инструкции**:

### Пример из Solscan:

```
#3 - Memo Program v2: Unknown
Instruction Data: 🔵 BUY: 0.0100 SOL → 354 234 N (min: 336 522)

#4 - Memo Program v2: Unknown
Instruction Data: SWAP: 0.0100 SOL -> 354,234 N (min: 336,522)
```

### Причина:

1. **Бэкенд** добавлял Memo инструкцию (правильный ASCII формат)
2. **Фронтенд** ТОЖЕ добавлял Memo инструкцию (старый формат с эмодзи)
3. Результат: **дублирование** Memo в транзакции

### Последствия:

- ❌ Увеличенный размер транзакции
- ❌ Дополнительные compute units (45,021 + 17,358 = 62,379)
- ❌ Запутанное отображение в Phantom и Solscan
- ❌ Две разные версии Memo (с эмодзи и без)

---

## ✅ Решение

Удалена логика добавления Memo инструкции на фронтенде, так как бэкенд уже добавляет правильную Memo.

---

## 📝 Изменения в коде

### Файл: `dexfront/src/components/TokenChart.vue`

#### Функция `buyToken()` (строки ~2714-2734):

**БЫЛО:**
```javascript
// NOTE: Versioned Transactions are immutable after creation
// All modifications must be done on backend before serialization
// Memo instructions should also be added on backend for Versioned Transactions

// 3. Memo инструкция (для Versioned Transaction должна быть добавлена на бэкенде)
if (transactionVersion === undefined || transactionVersion === null) {
  // Legacy Transaction - можем добавить Memo на фронтенде
  try {
    const memoIx = createTransactionMemo(transactionDetails, 'buy', tokenInfo.value);
    
    if (memoIx) {
      tx.instructions.unshift(memoIx);
      console.log('✅ Added memo instruction for Phantom preview (Legacy)');
    }
  } catch (error) {
    console.warn('⚠️ Failed to add memo instruction:', error);
  }
} else {
  // Versioned Transaction - Memo должен быть добавлен на бэкенде
  console.log('ℹ️ Versioned Transaction - Memo should be added on backend');
}

// 4. Get fresh blockhash before sending transaction (только для Legacy)
```

**СТАЛО:**
```javascript
// NOTE: Backend already adds Memo instruction to the transaction
// We don't need to add it again on frontend to avoid duplication
console.log('ℹ️ Memo instruction already added by backend');

// 3. Get fresh blockhash before sending transaction (только для Legacy)
```

#### Функция `sellToken()` (строки ~2952-2972):

Аналогичное изменение для функции продажи токенов.

---

## 📊 Результат

### БЫЛО (2 Memo инструкции):

```
Transaction Instructions:
#1 - Compute Budget: SetComputeUnitPrice
#2 - Compute Budget: SetComputeUnitLimit
#3 - Memo Program v2: 🔵 BUY: 0.0100 SOL → 354 234 N (min: 336 522)  ← Фронтенд
#4 - Memo Program v2: SWAP: 0.0100 SOL -> 354,234 N (min: 336,522)  ← Бэкенд
#5 - Your Program: Swap

Compute Units: 62,379 (для Memo) + 182,177 (для Swap) = 244,556 total
```

### СТАЛО (1 Memo инструкция):

```
Transaction Instructions:
#1 - Compute Budget: SetComputeUnitPrice
#2 - Compute Budget: SetComputeUnitLimit
#3 - Memo Program v2: SWAP: 0.0100 SOL -> 354,234 N (min: 336,522)  ← Бэкенд
#4 - Your Program: Swap

Compute Units: 17,358 (для Memo) + 182,177 (для Swap) = ~199,535 total
```

### Преимущества:

- ✅ **Меньше compute units** (~45,000 сэкономлено)
- ✅ **Меньше размер транзакции** (~51 байт сэкономлено)
- ✅ **Единый формат Memo** (только ASCII)
- ✅ **Нет дублирования** и путаницы
- ✅ **Единый источник правды** (бэкенд)

---

## 🔍 Почему это важно?

### 1. Compute Units

Solana взимает плату за compute units. Дублирование Memo:
- **Старая Memo (с эмодзи):** 45,021 compute units
- **Новая Memo (ASCII):** 17,358 compute units
- **Экономия:** 45,021 compute units на каждую транзакцию

### 2. Размер транзакции

Solana имеет лимит на размер транзакции (1232 байта для Legacy, 1232 байта для Versioned).
- **Старая Memo:** 51 байт
- **Новая Memo:** 44 байта
- Дублирование занимало **95 байт** вместо **44 байт**

### 3. Читаемость

Две разные Memo инструкции:
- ❌ Запутывают пользователя
- ❌ Показывают разные форматы (эмодзи vs ASCII)
- ❌ Усложняют отладку

---

## 🧪 Тестирование

### До исправления:

```bash
# Логи фронтенда:
✅ Added memo instruction for Phantom preview (Legacy)

# Solscan показывал:
#3 - Memo: 🔵 BUY: 0.0100 SOL → 354 234 N
#4 - Memo: SWAP: 0.0100 SOL -> 354,234 N
```

### После исправления:

```bash
# Логи фронтенда:
ℹ️ Memo instruction already added by backend

# Solscan показывает:
#3 - Memo: SWAP: 0.0100 SOL -> 354,234 N
```

---

## 📚 Связанные изменения

1. **Бэкенд:** Добавлена Memo инструкция в Legacy Transaction
   - Файл: `src/routes/token.js`
   - Формат: ASCII (без эмодзи)

2. **Фронтенд:** Удалена дублирующая Memo инструкция
   - Файл: `dexfront/src/components/TokenChart.vue`
   - Функции: `buyToken()`, `sellToken()`

3. **Утилиты:** Функция `createTransactionMemo` больше не используется на фронтенде
   - Файл: `dexfront/src/utils/transactionUtils.js`
   - Статус: Можно удалить или оставить для будущего использования

---

## 🎯 Рекомендации

### Для будущего:

1. **Единый источник правды:** Memo должна добавляться ТОЛЬКО на бэкенде
2. **Фронтенд не модифицирует транзакцию:** Только подписывает и отправляет
3. **Исключение:** Только `recentBlockhash` обновляется на фронтенде для свежести

### Если нужно изменить формат Memo:

1. ✅ Изменить ТОЛЬКО на бэкенде (`src/routes/token.js`)
2. ❌ НЕ добавлять логику на фронтенде
3. ✅ Протестировать в Solscan (должна быть только одна Memo)

---

## ✅ Критерии успеха

После исправления:
- ✅ В транзакции **только одна** Memo инструкция
- ✅ Memo в **ASCII формате** (без эмодзи)
- ✅ Memo добавлена **бэкендом**
- ✅ Фронтенд **не модифицирует** транзакцию
- ✅ Меньше **compute units**
- ✅ Меньше **размер транзакции**

---

**Статус:** ✅ ИСПРАВЛЕНО  
**Файлы изменены:** 1 (`TokenChart.vue`)  
**Строк изменено:** ~40 (2 функции)  
**Дата:** 31 октября 2025


