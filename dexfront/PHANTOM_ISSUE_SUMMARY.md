# Phantom Wallet: Проблема и решение - Краткая сводка

**Дата:** 30 октября 2025  
**Статус:** 🔴 ТРЕБУЕТСЯ ИЗМЕНЕНИЕ НА БЭКЕНДЕ

---

## 🔴 ПРОБЛЕМА

Phantom Wallet **НЕ ПОКАЗЫВАЕТ детали транзакции** при использовании **Versioned Transaction (v0)**:

### Что видит пользователь:
```
❌ Phantom показывает:
   "Эта транзакция была отменена во время моделирования"
   
❌ НЕТ информации о:
   - Сколько SOL отдаёшь
   - Сколько токенов получаешь
   - Минимум, slippage
```

### Почему это происходит:
- Бэкенд создаёт **Versioned Transaction v0**
- Phantom **не может** корректно симулировать Versioned Transactions
- Phantom **не показывает** детали из-за ошибки симуляции

---

## ✅ РЕШЕНИЕ

### Бэкенд должен создавать **Legacy Transaction** вместо **Versioned Transaction**

#### Что изменить:

```javascript
// ❌ УБРАТЬ:
const messageV0 = new TransactionMessage({...}).compileToV0Message();
const transaction = new VersionedTransaction(messageV0);
transactionVersion: 0

// ✅ ИСПОЛЬЗОВАТЬ:
const transaction = new Transaction();
transaction.recentBlockhash = blockhash;
transaction.feePayer = userPublicKey;
transaction.add(memoInstruction);  // Memo первым!
transaction.add(swapInstruction);
transactionVersion: null  // или undefined
```

---

## 📝 ЧТО НУЖНО СДЕЛАТЬ БЭКЕНД РАЗРАБОТЧИКУ:

1. **Измени тип транзакции** с Versioned на Legacy
2. **Установи `transactionVersion: null`** в ответе API
3. **Убедись, что Memo инструкция первая** в списке инструкций
4. **Проверь симуляцию** перед отправкой на фронтенд

### Подробная инструкция:
📄 **`BACKEND_USE_LEGACY_TRANSACTION.md`** - полная документация с примерами кода

---

## 🎯 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

После изменений Phantom будет показывать:
```
✅ Вы отправляете: 0.0100 SOL
✅ Вы получаете: ~355,884 ZXC
✅ Минимум: 338,090 ZXC (slippage 5%)
✅ Комиссия сети: 0.00008 SOL
```

---

## ⏰ ПРИОРИТЕТ

🔴 **КРИТИЧЕСКИЙ** - блокирует нормальный UX для пользователей

---

## 📊 ТЕКУЩИЕ ЛОГИ

### Бэкенд сейчас отправляет:
```json
{
  "transactionVersion": 0,  // ❌ Versioned Transaction
  "message": "Buy token transaction created successfully (Versioned Transaction v0)"
}
```

### Должен отправлять:
```json
{
  "transactionVersion": null,  // ✅ Legacy Transaction
  "message": "Buy token transaction created successfully (Legacy Transaction)"
}
```

---

**Передай этот файл и `BACKEND_USE_LEGACY_TRANSACTION.md` бэкенд разработчику!**


