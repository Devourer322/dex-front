# Исправление симуляции Versioned Transaction

## ❌ Проблема

При симуляции **Versioned Transaction** возникала ошибка:

```
⚠️ Simulation failed (non-critical): Invalid arguments
```

## 🔍 Причина

Метод `connection.simulateTransaction()` имеет **разные сигнатуры** для Legacy и Versioned Transaction:

### Legacy Transaction:
```javascript
connection.simulateTransaction(transaction, signers, options)
```

### Versioned Transaction:
```javascript
connection.simulateTransaction(transaction, options)
```

Фронтенд использовал формат для Legacy Transaction, что вызывало ошибку "Invalid arguments" для Versioned Transaction.

## ✅ Решение

Обновлена функция `simulateTransactionForPreview` в `transactionUtils.js`:

```javascript
export async function simulateTransactionForPreview(transaction, connection) {
  try {
    console.log('🔄 Simulating transaction for preview...');
    
    // Определяем тип транзакции
    const isVersioned = transaction.version !== undefined;
    console.log('  Transaction type:', isVersioned ? 'Versioned' : 'Legacy');
    
    let simulation;
    
    if (isVersioned) {
      // Для Versioned Transaction используем другой формат
      simulation = await connection.simulateTransaction(transaction, {
        commitment: 'processed',
        sigVerify: false,
        replaceRecentBlockhash: true
      });
    } else {
      // Для Legacy Transaction используем старый формат
      simulation = await connection.simulateTransaction(transaction, undefined, {
        commitment: 'processed',
        sigVerify: false,
        replaceRecentBlockhash: true
      });
    }
    
    if (simulation.value.err) {
      console.warn('⚠️ Simulation returned error:', simulation.value.err);
      return null;
    }
    
    console.log('✅ Simulation successful:', {
      unitsConsumed: simulation.value.unitsConsumed,
      logs: simulation.value.logs?.slice(0, 5)
    });
    
    return simulation.value;
  } catch (error) {
    console.warn('⚠️ Simulation failed (non-critical):', error.message);
    return null;
  }
}
```

## 📊 Что изменилось

### До исправления:
❌ Versioned Transaction: `simulateTransaction(tx, undefined, options)` → "Invalid arguments"  
✅ Legacy Transaction: `simulateTransaction(tx, undefined, options)` → работает  

### После исправления:
✅ Versioned Transaction: `simulateTransaction(tx, options)` → работает  
✅ Legacy Transaction: `simulateTransaction(tx, undefined, options)` → работает  

## 🧪 Ожидаемые логи

### Для Versioned Transaction:
```
🔄 Simulating transaction for preview...
  Transaction type: Versioned
✅ Simulation successful: {unitsConsumed: 169895, logs: Array(5)}
```

### Для Legacy Transaction:
```
🔄 Simulating transaction for preview...
  Transaction type: Legacy
✅ Simulation successful: {unitsConsumed: 169895, logs: Array(5)}
```

## 🎯 Результат

- ✅ Симуляция работает для обоих типов транзакций
- ✅ Автоматическое определение типа транзакции
- ✅ Правильные параметры для каждого типа
- ✅ Phantom Wallet получает корректную транзакцию

## 📝 Связанные файлы

- `dexfront/src/utils/transactionUtils.js` - Функция `simulateTransactionForPreview`
- `dexfront/VERSIONED_TRANSACTION_SUPPORT.md` - Общая документация по Versioned Transaction

## 📅 Дата исправления

**30 октября 2025**

Симуляция Versioned Transaction работает корректно! ✅


