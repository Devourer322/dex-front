# Исправление ошибки импорта в Vite

## Проблема
```
Failed to resolve import "@/utils/transactionUtils.js" from "src/components/TokenChart.vue"
```

## Причина
В `vite.config.js` не был настроен алиас `@` для папки `src`.

## Решение

### 1. Обновлён vite.config.js

**Было:**
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    }
  },
  optimizeDeps: {
    include: ['buffer']
  }
})
```

**Стало:**
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // ← ДОБАВЛЕНО
      buffer: 'buffer',
    }
  },
  optimizeDeps: {
    include: ['buffer']
  }
})
```

### 2. Что изменилось:
- ✅ Добавлен импорт `path` из Node.js
- ✅ Добавлен алиас `'@': path.resolve(__dirname, './src')`
- ✅ Теперь `@/utils/transactionUtils.js` корректно резолвится в `src/utils/transactionUtils.js`

### 3. Что нужно сделать:

#### Перезапустите dev-сервер Vite:

**В PowerShell:**
```powershell
# Остановите текущий сервер (Ctrl+C)
# Затем запустите заново:
cd dexfront
npm run dev
```

**Или в CMD:**
```cmd
cd dexfront
npm run dev
```

### 4. Проверка

После перезапуска сервера:
1. Откройте браузер
2. Перейдите на страницу токена
3. Откройте консоль (F12)
4. Ошибка импорта должна исчезнуть
5. Попробуйте купить токены - должно работать!

### 5. Альтернативное решение (если не помогло)

Если после перезапуска всё ещё есть ошибка, можно использовать относительный путь:

**В TokenChart.vue замените:**
```javascript
const { 
  createTransactionMemo, 
  simulateTransactionForPreview,
  formatTransactionDetails,
  handlePhantomError 
} = await import('@/utils/transactionUtils.js');
```

**На:**
```javascript
const { 
  createTransactionMemo, 
  simulateTransactionForPreview,
  formatTransactionDetails,
  handlePhantomError 
} = await import('../utils/transactionUtils.js');
```

Но это не рекомендуется, так как алиас `@` - это стандартная практика в Vue проектах.

## Статус
✅ Конфигурация исправлена
⏳ Требуется перезапуск dev-сервера


