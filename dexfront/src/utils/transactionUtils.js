/**
 * Утилиты для работы с Solana транзакциями и Phantom Wallet
 * Обеспечивают корректное отображение превью транзакций в Phantom
 */

import { TransactionInstruction, PublicKey, VersionedTransaction, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

/**
 * Создаёт Memo инструкцию для отображения деталей транзакции в Phantom
 * @param {Object} details - Детали транзакции
 * @param {string} type - Тип транзакции ('buy' или 'sell')
 * @param {Object} tokenInfo - Информация о токене
 * @returns {TransactionInstruction} Memo инструкция
 */
export function createTransactionMemo(details, type, tokenInfo) {
  try {
    const tokenSymbol = tokenInfo.ticker || tokenInfo.symbol || 'TOKENS';
    
    let memoText;
    if (type === 'buy') {
      const expectedTokens = Math.floor(details.expectedTokensToReceive || details.minTokensToReceive || 0);
      const minTokens = Math.floor(details.minTokensToReceive || 0);
      const solAmount = (details.solAmount || 0).toFixed(4);
      
      // Формат для Phantom: короткий и понятный
      memoText = `🔵 BUY: ${solAmount} SOL → ${expectedTokens.toLocaleString()} ${tokenSymbol} (min: ${minTokens.toLocaleString()})`;
    } else if (type === 'sell') {
      const tokenAmount = Math.floor(details.amount || 0);
      const minSol = (details.minSolToReceive || 0).toFixed(4);
      const expectedSol = (details.expectedSolToReceive || minSol || 0);
      
      memoText = `🔴 SELL: ${tokenAmount.toLocaleString()} ${tokenSymbol} → ${expectedSol} SOL (min: ${minSol})`;
    } else {
      memoText = `Transaction: ${type}`;
    }
    
    console.log('📝 Creating memo instruction:', memoText);
    
    // Memo Program ID (SPL Memo Program)
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    
    return new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoText, 'utf-8')
    });
  } catch (error) {
    console.error('Error creating memo instruction:', error);
    return null;
  }
}

/**
 * Десериализует транзакцию (Legacy или Versioned)
 * @param {string} transactionBase64 - Транзакция в формате base64
 * @param {number} version - Версия транзакции (0 для Versioned, undefined для Legacy)
 * @returns {Transaction|VersionedTransaction} Десериализованная транзакция
 */
export function deserializeTransaction(transactionBase64, version) {
  try {
    const buffer = Buffer.from(transactionBase64, 'base64');
    
    if (version === 0 || version === 'legacy') {
      // Versioned Transaction (v0)
      console.log('📦 Deserializing Versioned Transaction (v0)...');
      const tx = VersionedTransaction.deserialize(buffer);
      console.log('✅ Versioned Transaction deserialized:', {
        version: tx.version,
        signatures: tx.signatures.length
      });
      return tx;
    } else {
      // Legacy Transaction
      console.log('📦 Deserializing Legacy Transaction...');
      const tx = Transaction.from(buffer);
      console.log('✅ Legacy Transaction deserialized:', {
        feePayer: tx.feePayer?.toString(),
        instructions: tx.instructions.length
      });
      return tx;
    }
  } catch (error) {
    console.error('❌ Failed to deserialize transaction:', error);
    throw error;
  }
}

/**
 * Симулирует транзакцию для получения ожидаемых изменений
 * @param {Transaction|VersionedTransaction} transaction - Транзакция для симуляции
 * @param {Connection} connection - Solana connection
 * @returns {Promise<Object|null>} Результат симуляции или null
 */
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
      logs: simulation.value.logs?.slice(0, 5) // First 5 logs
    });
    
    return simulation.value;
  } catch (error) {
    console.warn('⚠️ Simulation failed (non-critical):', error.message);
    // Симуляция опциональна, возвращаем null вместо ошибки
    return null;
  }
}

/**
 * Создаёт правильно настроенную транзакцию для Phantom
 * @param {Transaction} transaction - Базовая транзакция
 * @param {Connection} connection - Solana connection
 * @param {string} userPubkey - Публичный ключ пользователя
 * @returns {Promise<Transaction>} Настроенная транзакция
 */
export async function createPhantomTransaction(transaction, connection, userPubkey) {
  try {
    // Получаем свежий blockhash
    const latestBlockhash = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    
    // Устанавливаем feePayer
    if (!transaction.feePayer) {
      transaction.feePayer = new PublicKey(userPubkey);
    }
    
    console.log('✅ Transaction configured for Phantom:', {
      feePayer: transaction.feePayer.toString(),
      recentBlockhash: transaction.recentBlockhash,
      lastValidBlockHeight: transaction.lastValidBlockHeight
    });
    
    return transaction;
  } catch (error) {
    console.error('Error configuring transaction:', error);
    throw error;
  }
}

/**
 * Обрабатывает ошибки Phantom Wallet с понятными сообщениями
 * @param {Error} error - Ошибка от Phantom
 * @returns {string} Понятное сообщение об ошибке
 */
export function handlePhantomError(error) {
  const errorMessage = error.message || error.toString();
  
  // User rejected
  if (errorMessage.includes('User rejected') || error.code === 4001) {
    return 'Транзакция была отклонена пользователем';
  }
  
  // Insufficient funds
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient SOL')) {
    return 'Недостаточно SOL для оплаты комиссии';
  }
  
  // Slippage exceeded
  if (errorMessage.includes('slippage') || errorMessage.includes('Min return not reached')) {
    return 'Цена изменилась слишком сильно (превышен slippage). Попробуйте увеличить slippage или повторить позже';
  }
  
  // Blockhash expired
  if (errorMessage.includes('Blockhash not found') || errorMessage.includes('expired')) {
    return 'Транзакция устарела. Пожалуйста, попробуйте снова';
  }
  
  // Network error
  if (errorMessage.includes('Network') || errorMessage.includes('timeout')) {
    return 'Ошибка сети. Проверьте подключение и попробуйте снова';
  }
  
  // Simulation failed
  if (errorMessage.includes('Simulation failed')) {
    return 'Транзакция не прошла симуляцию. Возможно, недостаточно средств или неверные параметры';
  }
  
  // Default
  return `Ошибка транзакции: ${errorMessage}`;
}

/**
 * Форматирует детали транзакции для отображения пользователю
 * @param {Object} details - Детали транзакции
 * @param {string} type - Тип транзакции ('buy' или 'sell')
 * @param {Object} tokenInfo - Информация о токене
 * @returns {Object} Отформатированные детали
 */
export function formatTransactionDetails(details, type, tokenInfo) {
  const tokenSymbol = tokenInfo.ticker || tokenInfo.symbol || 'TOKENS';
  
  if (type === 'buy') {
    return {
      type: 'Покупка',
      youPay: `${(details.solAmount || 0).toFixed(4)} SOL`,
      youReceive: `~${Math.floor(details.expectedTokensToReceive || 0).toLocaleString()} ${tokenSymbol}`,
      minimum: `${Math.floor(details.minTokensToReceive || 0).toLocaleString()} ${tokenSymbol}`,
      priceImpact: details.priceImpact ? `${details.priceImpact}%` : 'N/A',
      slippage: `${details.slippage || 5}%`,
      estimatedFee: '~0.00005 SOL'
    };
  } else if (type === 'sell') {
    return {
      type: 'Продажа',
      youPay: `${Math.floor(details.amount || 0).toLocaleString()} ${tokenSymbol}`,
      youReceive: `~${(details.expectedSolToReceive || details.minSolToReceive || 0).toFixed(4)} SOL`,
      minimum: `${(details.minSolToReceive || 0).toFixed(4)} SOL`,
      priceImpact: details.priceImpact ? `${details.priceImpact}%` : 'N/A',
      slippage: `${details.slippage || 5}%`,
      estimatedFee: '~0.00005 SOL'
    };
  }
  
  return {};
}

/**
 * Проверяет, достаточно ли SOL для транзакции
 * @param {number} solBalance - Баланс SOL пользователя
 * @param {number} requiredSol - Требуемое количество SOL
 * @param {number} estimatedFee - Оценка комиссии (по умолчанию 0.00005)
 * @returns {boolean} true если достаточно SOL
 */
export function checkSufficientBalance(solBalance, requiredSol, estimatedFee = 0.00005) {
  const totalRequired = requiredSol + estimatedFee;
  return solBalance >= totalRequired;
}

/**
 * Ждёт подтверждения транзакции с таймаутом
 * @param {Connection} connection - Solana connection
 * @param {string} signature - Сигнатура транзакции
 * @param {number} timeout - Таймаут в миллисекундах (по умолчанию 60000)
 * @returns {Promise<Object>} Результат подтверждения
 */
export async function confirmTransactionWithTimeout(connection, signature, timeout = 60000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const status = await connection.getSignatureStatus(signature);
      
      if (status.value?.confirmationStatus === 'confirmed' || 
          status.value?.confirmationStatus === 'finalized') {
        console.log('✅ Transaction confirmed:', signature);
        return status.value;
      }
      
      if (status.value?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
      }
      
      // Ждём 1 секунду перед следующей проверкой
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw error;
    }
  }
  
  throw new Error('Transaction confirmation timeout');
}

export default {
  createTransactionMemo,
  simulateTransactionForPreview,
  createPhantomTransaction,
  handlePhantomError,
  formatTransactionDetails,
  checkSufficientBalance,
  confirmTransactionWithTimeout
};

