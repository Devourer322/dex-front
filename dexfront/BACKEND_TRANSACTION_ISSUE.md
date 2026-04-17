# Проблема с транзакцией от бэкенда

## ❌ Проблема

Phantom Wallet показывает ошибку при попытке подписать транзакцию:
**"Эта транзакция была отменена во время моделирования. При отправке средства могут быть утеряны."**

## 🔍 Детали

### Что работает на фронтенде:
✅ Получение транзакции от бэкенда  
✅ Десериализация транзакции  
✅ Исправление isSigner флагов  
✅ Обновление blockhash  
✅ Симуляция транзакции (169897 units consumed)  

### Что НЕ работает:
❌ Phantom Wallet не может симулировать транзакцию  
❌ Показывает ошибку "отменена во время моделирования"  

### Логи симуляции:
```
Program FywFAwrSBzpKjZYz1Tmx794s6XCqLkrTFa1hVzRGVsui invoke [1]
Program log: Instruction: Swap
Program log: Swap started. BaseIn: false, AmountIn: 10000000, MinOutAmount: 336522
Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]
Program log: Instruction: ThawAccount
```

## 🎯 Возможные причины

### 1. **ThawAccount инструкция**
Транзакция пытается выполнить `ThawAccount`, но:
- Аккаунт может не существовать
- Аккаунт может быть уже разморожен
- Недостаточно прав для выполнения операции

### 2. **Недостаточно SOL для rent**
User Token Account (`C9bLk51Vmrku8Kep36BbfurhkwBvozKza8xpCjRfa3Rf`) может не иметь достаточно SOL для rent exemption.

### 3. **Неправильные account permissions**
Некоторые аккаунты в транзакции могут иметь неправильные флаги:
- `isSigner` должен быть `false` для всех кроме user
- `isWritable` должен быть правильно установлен

### 4. **Проблема с Bonding Curve**
Bonding Curve (`8y4gfufNgWBHEobAtimBubXM3H1PE2EaPE9CWNYkyM28`) может иметь проблемы:
- Недостаточно токенов
- Неправильный расчёт цены
- Проблемы с reserves

## 🛠️ Рекомендации для бэкенда

### 1. Проверить создание User Token Account

```rust
// Убедитесь, что User Token Account создаётся ПРАВИЛЬНО
// и имеет достаточно SOL для rent exemption

let rent = Rent::get()?;
let min_balance = rent.minimum_balance(Account::LEN);

// User Token Account должен иметь минимум min_balance SOL
```

### 2. Убрать ThawAccount если не нужен

Если токен не frozen, то `ThawAccount` инструкция не нужна и вызывает ошибку.

```rust
// Проверить, нужна ли ThawAccount инструкция
if token_account.is_frozen() {
    // Только тогда добавлять ThawAccount
}
```

### 3. Проверить все isSigner флаги

```rust
// Только user должен быть signer
AccountMeta::new(user_pubkey, true),  // isSigner = true
AccountMeta::new_readonly(program_id, false),  // isSigner = false
AccountMeta::new(fee_receiver, false),  // isSigner = false (ВАЖНО!)
```

### 4. Добавить проверку баланса перед swap

```rust
// Проверить, что user имеет достаточно SOL
let user_balance = get_balance(user_pubkey)?;
let required = amount + fee + rent_exemption;

if user_balance < required {
    return Err(InsufficientFunds);
}
```

### 5. Использовать правильный commitment level

```typescript
// На бэкенде при создании транзакции
const latestBlockhash = await connection.getLatestBlockhash('finalized');
transaction.recentBlockhash = latestBlockhash.blockhash;
```

## 📋 Чек-лист для бэкенд-разработчика

- [ ] User Token Account создаётся с достаточным rent exemption
- [ ] ThawAccount инструкция добавляется только если нужна
- [ ] Все isSigner флаги установлены правильно (только user = true)
- [ ] Все isWritable флаги установлены правильно
- [ ] Bonding Curve имеет достаточно токенов
- [ ] Расчёт minOutAmount корректен
- [ ] Fee receiver НЕ требует подписи (isSigner = false)
- [ ] Используется актуальный blockhash с 'finalized' commitment
- [ ] Транзакция симулируется на бэкенде перед отправкой на фронт

## 🧪 Тестирование

### На бэкенде добавить симуляцию:

```typescript
// После создания транзакции
const simulation = await connection.simulateTransaction(transaction, [userKeypair]);

if (simulation.value.err) {
    console.error('Transaction simulation failed:', simulation.value.err);
    console.error('Logs:', simulation.value.logs);
    throw new Error('Transaction would fail');
}

console.log('Simulation successful:', simulation.value.unitsConsumed, 'units');
console.log('Logs:', simulation.value.logs);
```

## 🔗 Полезные ссылки

- [Solana Transaction Structure](https://docs.solana.com/developing/programming-model/transactions)
- [Account Model](https://docs.solana.com/developing/programming-model/accounts)
- [Rent Exemption](https://docs.solana.com/developing/programming-model/accounts#rent-exemption)
- [Token Program](https://spl.solana.com/token)

## 📊 Данные транзакции для debugging

```json
{
  "mintAddress": "2h14ucShghRGbua8Goh3JKMSrbgKBZdAcNwKCaamJLZc",
  "userWallet": "vdKmw2YpTw2RqE3EE49MvPovCNtSBkgyRz6E22m3Hn9",
  "userTokenAccount": "C9bLk51Vmrku8Kep36BbfurhkwBvozKza8xpCjRfa3Rf",
  "bondingCurve": "8y4gfufNgWBHEobAtimBubXM3H1PE2EaPE9CWNYkyM28",
  "feeReceiver": "BAZ6jG5aXsjJg5fwJgh6iCF6BjWYjUiNWdrYj4Xf1HCW",
  "solAmount": 0.01,
  "expectedTokens": 354234,
  "minTokens": 336522,
  "slippage": 5
}
```

## ⚠️ Критические моменты

1. **Fee Receiver НЕ должен быть signer!** (мы исправили на фронте, но бэкенд отправляет неправильно)
2. **User Token Account должен существовать ДО swap** (или создаваться в той же транзакции)
3. **ThawAccount не нужен для обычных токенов** (только для frozen tokens)
4. **Rent exemption ОБЯЗАТЕЛЕН** для всех новых аккаунтов

## 🚀 Следующие шаги

1. Бэкенд-разработчик должен проверить создание транзакции
2. Добавить симуляцию на бэкенде перед отправкой
3. Исправить все флаги и проверки
4. Протестировать транзакцию в devnet
5. Отправить исправленную транзакцию на фронт


