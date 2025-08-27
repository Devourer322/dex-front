<template>
  <div class="token-chart-page">
    <!-- Header -->
    <div class="chart-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 19-7-7 7-7"/>
          <path d="m19 12H5"/>
        </svg>
        [go back]
      </button>
      
      <div class="token-info">
        <div v-if="isTokenLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <span class="loading-text">Loading token data...</span>
        </div>
        
        <div v-else-if="tokenLoadError" class="error-container">
          <span class="error-text">❌ {{ tokenLoadError }}</span>
        </div>
        
        <template v-else>
          <div class="token-avatar">
            <img :src="tokenInfo.image" :alt="tokenInfo.name" />
          </div>
          <div class="token-details">
            <h1 class="token-name">{{ tokenInfo.name }} ({{ tokenInfo.ticker }})</h1>
            <div class="token-meta">
              <span class="created-info">🟢 {{ tokenInfo.created }}</span>
              <span class="market-cap">market cap: {{ formatMarketCap(calculatedMarketCap.marketCapUSD > 0 ? calculatedMarketCap.marketCapUSD : 0) }}</span>
              <span class="replies">replies: 67</span>
              <span :class="['websocket-status', isWebSocketConnected ? 'connected' : 'disconnected']">
                {{ isWebSocketConnected ? '🔌 Live' : '🔌 Offline' }}
              </span>
            </div>
            
            <!-- WebSocket Error Notification -->
            <div v-if="websocketError" class="websocket-error">
              <span class="error-text">❌ WebSocket: {{ websocketError }}</span>
              <button @click="connectWebSocket(route.params.mint_address)" class="retry-btn">
                Retry
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Main Content Layout -->
    <div class="main-content">
      <!-- Chart Section -->
      <div class="chart-section">
        <div class="chart-container">
          <!-- Chart Controls - Pump.fun Style -->
          <div class="chart-controls">
            <!-- Left side controls -->
            <div class="chart-left-controls">
              <div class="timeframe-buttons">
                <button 
                  v-for="timeframe in timeframes" 
                  :key="timeframe"
                  :class="['timeframe-btn', { active: selectedTimeframe === timeframe }]"
                  @click="setTimeframe(timeframe)"
                >
                  {{ timeframe }}
                </button>
              </div>
              
              <div class="chart-display-controls">
                <button class="control-btn" title="Chart Type">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3v18h18"/>
                    <path d="m19 9-5 5-4-4-3 3"/>
                  </svg>
                </button>
                <button 
                  :class="['control-btn', { active: showTradeDisplay }]" 
                  title="Trade Display"
                  @click="toggleTradeDisplay"
                >
                  Trade Display
                </button>
                <button 
                  class="control-btn" 
                  title="Hide Bubbles"
                  @click="hideAllBubbles"
                >
                  Hide All Bubbles
                </button>
                <button 
                  class="control-btn" 
                  title="Toggle No Data (Test)"
                  @click="toggleNoData"
                  style="color: #f59e0b;"
                >
                  Test No Data
                </button>
              </div>
            </div>
            
            <!-- Right side controls -->
            <div class="chart-right-controls">
              <div class="chart-type-buttons">
                <button 
                  :class="['chart-type-btn', { active: selectedChartType === 'price' }]"
                  @click="setChartType('price')"
                >
                  Price/MCap
                </button>
                <button 
                  :class="['chart-type-btn', { active: selectedChartType === 'usd' }]"
                  @click="setChartType('usd')"
                >
                  USD/SOL
                </button>
              </div>
            </div>
          </div>

          <!-- Price Info -->
          <div class="price-info">
            <div class="current-price">
              <div class="price-label-section">
                <span class="price-label">
                  {{ tokenInfo.name }}/SOL Market Cap (USD) • 1 • Pump
                  <span class="price-stats">
                    O:<span class="stat-value">{{ hoveredCandle ? formatMarketCap(hoveredCandle.open) : formatMarketCap(calculatedMarketCap.marketCapUSD > 0 ? calculatedMarketCap.marketCapUSD : currentPrice) }}</span>
                    H:<span class="stat-value high">{{ hoveredCandle ? formatMarketCap(hoveredCandle.high) : formatMarketCap(calculatedMarketCap.marketCapUSD > 0 ? calculatedMarketCap.marketCapUSD : currentPrice) }}</span>
                    L:<span class="stat-value low">{{ hoveredCandle ? formatMarketCap(hoveredCandle.low) : formatMarketCap(calculatedMarketCap.marketCapUSD > 0 ? calculatedMarketCap.marketCapUSD : currentPrice) }}</span>
                    C:<span :class="['stat-value', priceChange >= 0 ? 'positive' : 'negative']">{{ hoveredCandle ? formatMarketCap(hoveredCandle.close) : formatMarketCap(calculatedMarketCap.marketCapUSD > 0 ? calculatedMarketCap.marketCapUSD : currentPrice) }}</span>
                    <span :class="['price-change-pct', priceChange >= 0 ? 'positive' : 'negative']">
                      {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
                    </span>
                  </span>
                </span>
                <span v-if="formattedHoveredTime" class="hovered-time">{{ formattedHoveredTime }}</span>
              </div>
              <div class="volume-display">
                <span class="volume-label">Volume</span>
                <span class="volume-value">{{ currentVolume.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Main Chart -->
          <div class="chart-wrapper">
            <!-- Chart Canvas - Always present for proper initialization -->
            <div 
              ref="chartContainer"
              class="chart-canvas"
              :style="{ display: (!isChartLoading && hasChartData) ? 'block' : 'none' }"
            ></div>

            <!-- Loading State -->
            <div v-if="isChartLoading" class="chart-loading">
              <div class="loading-spinner"></div>
              <span class="loading-text">Loading chart...</span>
            </div>

            <!-- No Data State (pump.fun style) -->
            <div v-else-if="!hasChartData" class="no-data-container">
              <div class="no-data-content">
                <!-- Ghost Icon (pump.fun style) -->
                <svg class="no-data-icon" width="80" height="80" viewBox="0 0 100 100" fill="none">
                  <path d="M50 20C35 20 25 30 25 45V70C25 75 30 80 35 80H40V75C40 70 45 65 50 65C55 65 60 70 60 75V80H65C70 80 75 75 75 70V45C75 30 65 20 50 20Z" 
                        fill="currentColor" opacity="0.3"/>
                  <circle cx="42" cy="45" r="3" fill="currentColor"/>
                  <circle cx="58" cy="45" r="3" fill="currentColor"/>
                  <path d="M35 85C35 82 37 80 40 80H60C63 80 65 82 65 85V90C65 93 63 95 60 95H40C37 95 35 93 35 90V85Z" 
                        fill="currentColor" opacity="0.5"/>
                </svg>
                <h3 class="no-data-title">No data here</h3>
                <p class="no-data-subtitle">Chart data will appear when trading begins</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="right-sidebar">
        <!-- Buy/Sell Panel -->
        <div class="trading-panel">
          <div class="trading-tabs">
            <button :class="['trade-tab', { active: activeTradeTab === 'buy' }]" @click="setTradeTab('buy')">
              Buy
            </button>
            <button :class="['trade-tab', { active: activeTradeTab === 'sell' }]" @click="setTradeTab('sell')">
              Sell
            </button>
          </div>

          <div class="trading-header">
            <div class="balance-info">
              <span class="balance-label">balance:</span>
              <span class="balance-value">{{ getBalanceDisplay() }}</span>
            </div>
            <button class="max-btn">Max</button>
          </div>

          <div class="trade-input-section">
            <div class="trade-amount">
              <input 
                v-model="tradeAmount" 
                type="number" 
                placeholder="0"
                class="amount-input"
                step="0.001"
                min="0"
              />
              <div class="token-selector" @click="toggleCurrencyDropdown">
                <span class="token-symbol">{{ getCurrencySymbol() }}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
                
                <!-- Currency dropdown for both buy and sell tabs -->
                <div v-if="showCurrencyDropdown" class="currency-dropdown">
                  <div class="dropdown-item" @click="selectCurrency('TOKENS')">
                    <span class="currency-symbol">{{ tokenInfo.ticker || 'TOKENS' }}</span>
                    <span class="currency-name">Tokens</span>
                  </div>
                  <div class="dropdown-item" @click="selectCurrency('SOL')">
                    <span class="currency-symbol">SOL</span>
                    <span class="currency-name">Solana</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Expected Price Input -->
            <div class="trade-price">
              <label class="price-label">Expected Price ({{ activeTradeTab === 'buy' ? 'Market Cap USD' : 'Price per Token SOL' }})</label>
              <input 
                v-model="expectedPrice" 
                type="number" 
                :placeholder="activeTradeTab === 'buy' ? formatMarketCap(currentPrice) : (calculatedMarketCap.priceSOL || '0.000000035').toString()"
                class="price-input"
                step="0.000001"
                min="0"
              />
            </div>

            <!-- Slippage Input -->
            <div class="trade-slippage">
              <label class="slippage-label">Slippage (%)</label>
              <div class="slippage-controls">
                <input 
                  v-model="slippage" 
                  type="number" 
                  class="slippage-input"
                  step="0.1"
                  min="0.1"
                  max="50"
                />
                <div class="slippage-presets">
                  <button 
                    v-for="preset in [1, 5, 10]" 
                    :key="preset"
                    :class="['slippage-preset', { active: slippage == preset }]"
                    @click="slippage = preset"
                  >
                    {{ preset }}%
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              :class="['place-trade-btn', activeTradeTab]" 
              @click="activeTradeTab === 'buy' ? buyToken() : sellToken()"
              :disabled="!tradeAmount || parseFloat(tradeAmount) <= 0 || isTransactionPending"
            >
              <div v-if="isTransactionPending" class="transaction-loading">
                <div class="loading-spinner-small"></div>
                <span>Confirming...</span>
              </div>
              <span v-else>{{ activeTradeTab === 'buy' ? 'Place buy order' : 'Place sell order' }}</span>
            </button>
          </div>

          <div class="trade-info">
            <div class="progress-section">
              <div class="progress-label">bonding curve progress: {{ bondingCurveProgress }}%</div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: bondingCurveProgress + '%' }"></div>
              </div>
              <div class="progress-description">
                graduate this coin to PumpSwap at {{ formatMarketCap(calculatedMarketCap.marketCapUSD > 0 ? calculatedMarketCap.marketCapUSD : 0) }} market cap.
                there is {{ calculatedMarketCap.marketCapSOL > 0 ? calculatedMarketCap.marketCapSOL.toFixed(2) : '0' }} SOL in the bonding curve.
              </div>
            </div>

            <div class="action-buttons">
              <button class="action-btn watchlist">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
                </svg>
                add to watchlist
              </button>
              
              <button class="action-btn twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                twitter
              </button>
            </div>

            <div class="contract-info">
              <div class="contract-row">
                <span class="contract-label">contract address:</span>
                <span class="contract-value">5TAYr...pump</span>
                <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </div>
              
              <div class="contract-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <span class="contract-link">trade on MEXC</span>
                <svg class="external-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </div>
              
              <div class="contract-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <span class="contract-link">view coin in advanced</span>
                <svg class="external-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Token Info and Top Holders Main Content -->
    <div class="token-info-main-content">
      <!-- Left Side: Token Description (70%) -->
      <div class="token-description-section">
        <div class="token-description-container">
          <!-- Token Image and Description Layout -->
          <div class="token-header-layout">
            <!-- Token Image -->
            

            <!-- Social Links - Moved above description -->
            <div class="social-links-section">
              <div class="social-links-grid">
              <!-- Website -->
              <a 
                v-if="tokenInfo.website" 
                :href="tokenInfo.website" 
                target="_blank" 
                class="social-link website"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>Website</span>
                <svg class="external-link-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>

              <!-- Twitter/X -->
              <a 
                v-if="tokenInfo.twitter" 
                :href="tokenInfo.twitter" 
                target="_blank" 
                class="social-link twitter"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Twitter</span>
                <svg class="external-link-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>

              <!-- Telegram -->
              <a 
                v-if="tokenInfo.telegram" 
                :href="tokenInfo.telegram" 
                target="_blank" 
                class="social-link telegram"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>Telegram</span>
                <svg class="external-link-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>

              <!-- Discord -->
              <a 
                v-if="tokenInfo.discord" 
                :href="tokenInfo.discord" 
                target="_blank" 
                class="social-link discord"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span>Discord</span>
                <svg class="external-link-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>

              <!-- GitHub -->
              <a 
                v-if="tokenInfo.github" 
                :href="tokenInfo.github" 
                target="_blank" 
                class="social-link github"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
                <svg class="external-link-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>

              <!-- Medium -->
              <a 
                v-if="tokenInfo.medium" 
                :href="tokenInfo.medium" 
                target="_blank" 
                class="social-link medium"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                </svg>
                <span>Medium</span>
                <svg class="external-link-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          </div>

            <!-- Token Info -->
            <div class="token-info-text">
              <div class="token-description">
                <p class="description-text">{{ tokenInfo.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Trades Section (Inside Token Description) -->
        <div class="trades-section">
          <div class="trades-header">
            <div class="trades-tabs">
              <button class="trades-tab active">thread</button>
              <button class="trades-tab">trades</button>
            </div>
            
            <div class="trades-filters">
              <div class="filter-group">
                <label class="filter-toggle">
                  <input type="checkbox" v-model="filters.sizeFilter">
                  <span class="toggle-slider"></span>
                </label>
                <span class="filter-label">filter by size</span>
                <input v-model="filters.minSize" type="number" step="0.01" placeholder="0.05" class="size-input">
                <span class="size-note">(1835 trades of size greater than 0.05 SOL)</span>
              </div>
              
              <div class="filter-group">
                <label class="filter-toggle">
                  <input type="checkbox" v-model="filters.followingFilter">
                  <span class="toggle-slider"></span>
                </label>
                <span class="filter-label">filter by following</span>
                <span class="following-note">(0 trades from people you follow)</span>
              </div>
              
              <div class="filter-group">
                <label class="filter-toggle">
                  <input type="checkbox" v-model="filters.ownTradesFilter">
                  <span class="toggle-slider"></span>
                </label>
                <span class="filter-label">filter by own trades</span>
                <span class="own-trades-note">(0 trades you made)</span>
              </div>
            </div>
          </div>

          <div class="trades-table">
            <div class="table-header">
              <div class="header-cell account">account</div>
              <div class="header-cell type">type</div>
              <div class="header-cell sol">SOL</div>
              <div class="header-cell insider">insider</div>
              <div class="header-cell date">date</div>
              <div class="header-cell transaction">transaction</div>
            </div>
            
            <div class="table-body">
              <!-- Loading state for transaction data -->
              <div v-if="isTransactionDataLoading" class="loading-trades">
                <div class="loading-spinner"></div>
                <span>Loading transaction data...</span>
              </div>
              
              <!-- Error state for transaction data -->
              <div v-else-if="transactionDataError" class="error-trades">
                <span class="error-text">❌ {{ transactionDataError }}</span>
                <button @click="loadTransactionData(route.params.mint_address)" class="retry-btn">
                  Retry
                </button>
              </div>
              
              <!-- Real transaction data -->
              <div 
                v-else-if="transactionData.length > 0"
                v-for="(trade, index) in paginatedTrades" 
                :key="trade.transaction_id"
                class="trade-row"
              >
                <div class="trade-cell account">
                  <div class="account-info">
                    <div class="account-avatar">
                      <img :src="getAvatarForAddress(trade.user_wallet)" :alt="trade.user_wallet" />
                    </div>
                    <span class="account-name">{{ formatAddress(trade.user_wallet) }}</span>
                  </div>
                </div>
                <div class="trade-cell type">
                  <span :class="['trade-type', trade.type]">{{ trade.type }}</span>
                </div>
                <div class="trade-cell sol">{{ parseFloat(trade.amount_sol).toFixed(6) }}</div>
                <div class="trade-cell insider">
                  {{ formatTimeAgo(trade.timestamp) }}
                </div>
                <div class="trade-cell date">{{ formatDate(trade.timestamp) }}</div>
                <div class="trade-cell transaction">
                  <a :href="`https://explorer.solana.com/tx/${trade.transaction_id}?cluster=devnet`" class="transaction-link" target="_blank">
                    {{ formatTransactionId(trade.transaction_id) }}
                  </a>
                </div>
              </div>
              
              <!-- No trades available -->
              <div v-else class="no-trades-container">
                <div class="no-trades-content">
                  <span class="no-trades-text">No trades available</span>
                  <p class="no-trades-subtitle">Trades will appear when trading begins</p>
                </div>
              </div>
            </div>
            
            <!-- Pagination (only show if we have trades) -->
            <div v-if="transactionData.length > 0" class="pagination">
              <button 
                class="pagination-btn" 
                :disabled="currentPage === 1"
                @click="previousPage"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15,18 9,12 15,6"/>
                </svg>
                Previous
              </button>
              
              <div class="pagination-info">
                <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
                <span class="trades-count">({{ startIndex }}-{{ endIndex }} of {{ transactionData.length }} trades)</span>
              </div>
              
              <button 
                class="pagination-btn" 
                :disabled="currentPage === totalPages"
                @click="nextPage"
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side: Top Holders (30%) -->
      <div class="top-holders-section">
        <div class="top-holders-container">
          <div class="holders-header">
            <div class="holders-title-section">
              <h3 class="holders-title">Top holders</h3>
              <div v-if="isHoldersUpdating" class="updating-indicator">
                <div class="updating-spinner"></div>
                <span>Updating...</span>
              </div>
            </div>
            <button class="bubble-map-btn">Generate bubble map</button>
          </div>
          
          <div class="holders-list">
            <!-- Loading state -->
            <div v-if="isTopHoldersLoading" class="loading-holders">
              <div class="loading-spinner"></div>
              <span>Loading top holders...</span>
            </div>
            
            <!-- Error state -->
            <div v-else-if="topHoldersError" class="error-holders">
              <span class="error-text">❌ {{ topHoldersError }}</span>
              <button @click="loadTopHoldersData(route.params.mint_address)" class="retry-btn">
                Retry
              </button>
            </div>
            
            <!-- Real top holders data -->
            <div 
              v-else-if="topHoldersData.length > 0"
              v-for="holder in topHoldersData" 
              :key="holder.holder_address"
              class="holder-item"
              :class="{ 'updated': holder.isNewlyUpdated }"
            >
              <span class="holder-rank">{{ holder.rank }}.</span>
              <span class="holder-type" :class="{ 'bonding-curve': holder.is_bonding_curve }">
                {{ holder.is_bonding_curve ? 'bonding curve' : formatAddress(holder.holder_address) }}
              </span>
              <span class="holder-percentage">{{ holder.percentage }}%</span>
            </div>
            
            <!-- Fallback to default data -->
            <div 
              v-else
              v-for="(holder, index) in topHolders" 
              :key="index"
              class="holder-item"
            >
              <span class="holder-rank">{{ index + 1 }}.</span>
              <span class="holder-type">{{ holder.type }}</span>
              <span class="holder-percentage">{{ holder.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject, nextTick, onUnmounted } from 'vue'
import { createChart } from 'lightweight-charts'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Token loading state
const isTokenLoading = ref(true)
const tokenLoadError = ref(null)

// Chart data and state
const chartContainer = ref(null)
const chart = ref(null)
const candlestickSeries = ref(null)
const volumeSeries = ref(null)
const tradeMarkerSeries = ref(null)
const selectedTimeframe = ref('1m')
const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d']
const selectedChartType = ref('price')
const chartTypes = ['price', 'usd']
const isChartLoading = ref(true)
const showTradeDisplay = ref(true)
const hasChartData = ref(false)

// WebSocket state
const websocket = ref(null)
const isWebSocketConnected = ref(false)
const websocketError = ref(null)
const isHoldersUpdating = ref(false)

// Trading state
const tradeAmount = ref('')
const activeTradeTab = ref('buy')
const expectedPrice = ref(0)
const slippage = ref(5) // Default 5% slippage
const tradeCurrency = ref('SOL') // 'SOL' for buy, 'TOKENS' for sell
const showCurrencyDropdown = ref(false) // Control currency dropdown visibility
const isTransactionPending = ref(false) // Loading state for transaction

// Helper function to format market cap values (pump.fun style)
const formatMarketCap = (value) => {
  // Add debugging
  if (value === undefined || value === null || isNaN(value)) {
    console.log('⚠️ formatMarketCap received invalid value:', value)
    return '$0.00'
  }
  
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`
  } else {
    return `$${value.toFixed(2)}`
  }
}

// Price data (market cap style like pump.fun)
const currentPrice = ref(0) // Will be updated from API data
const priceChange = ref(-10.03)
const currentVolume = ref(5)
const hoveredCandle = ref(null)
const hoveredTime = ref(null)
const hoveredPriceChange = ref(null)
const hoveredVolumeChange = ref(null)
const candleBodyChange = ref(null) // Изменение от open к close
const wickHigh = ref(null) // Насколько высокий фитиль от close/open к high
const wickLow = ref(null) // Насколько низкий фитиль от close/open к low
const priceRange = ref(null) // Диапазон цены (high - low) в %

// Store chart data for crosshair calculations
const chartCandleData = ref([])
const chartVolumeData = ref([])

// New: Transaction data from database
const transactionData = ref([])
const isTransactionDataLoading = ref(false)
const transactionDataError = ref(null)

// New: Top holders data from API
const topHoldersData = ref([])
const isTopHoldersLoading = ref(false)
const topHoldersError = ref(null)

// Market cap calculation
const calculatedMarketCap = ref({
  marketCapSOL: 0,
  marketCapUSD: 0,
  circulatingSupply: 0,
  priceSOL: 0
})

// Add trade markers like pump.fun
const addTradeMarkers = () => {
  if (!candlestickSeries.value || !chartCandleData.value.length) return

  const markers = []
  
  // Use real transaction data if available, otherwise use simulated data
  if (transactionData.value.length > 0) {
    console.log('🎯 Adding real trade markers from transaction data')
    
    // Add markers for recent transactions (last 20)
    const recentTransactions = transactionData.value.slice(0, 20)
    
    recentTransactions.forEach(transaction => {
      const timestamp = Math.floor(new Date(transaction.timestamp).getTime() / 1000)
      
      // Find the corresponding candle time
      const candleTime = chartCandleData.value.find(candle => 
        Math.abs(candle.time - timestamp) < 60 // Within 1 minute
      )
      
      if (candleTime) {
        const tradeType = transaction.type === 'buy' ? 'DB' : 'D$'
        const color = transaction.type === 'buy' ? '#10b981' : '#ef4444'
        
        markers.push({
          time: candleTime.time,
          position: transaction.type === 'buy' ? 'aboveBar' : 'belowBar',
          color: color,
          shape: 'circle',
          text: tradeType,
          size: 1
        })
      }
    })
  } else {
    // Fallback to simulated markers
    console.log('🎯 Adding simulated trade markers')
    const tradeTypes = ['DB', 'D$', 'DS'] // Different trade marker types like pump.fun
    const colors = {
      'DB': '#10b981', // Green for buys
      'D$': '#ef4444', // Red for sells  
      'DS': '#f59e0b'  // Orange for other trades
    }

    // Add some random trade markers to simulate pump.fun
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * (chartCandleData.value.length - 20)) + 10
      const candle = chartCandleData.value[randomIndex]
      const tradeType = tradeTypes[Math.floor(Math.random() * tradeTypes.length)]
      
      markers.push({
        time: candle.time,
        position: Math.random() > 0.5 ? 'aboveBar' : 'belowBar',
        color: colors[tradeType],
        shape: 'circle',
        text: tradeType,
        size: 1
      })
    }
  }

  candlestickSeries.value.setMarkers(markers)
  console.log(`✅ Added ${markers.length} trade markers`)
}

// Token information
const tokenInfo = ref({
  name: 'insider stock',
  ticker: 'insider',
  image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
  description: 'insider stock is a revolutionary meme token that brings transparency to the crypto market. Built on Solana blockchain, it aims to democratize access to insider trading information through community-driven insights and real-time market analysis. Join the movement of informed traders who believe in fair and transparent markets.',
  website: 'https://insiderstock.com',
  twitter: 'https://twitter.com/insiderstock',
  telegram: 'https://t.me/insiderstock',
  discord: 'https://discord.gg/insiderstock',
  github: 'https://github.com/insiderstock',
  medium: 'https://medium.com/@insiderstock',
  totalSupply: '1,000,000,000',
  circulatingSupply: '850,000,000',
  holders: '2,847',
  created: '2 hours ago'
})

// Filters state
const filters = ref({
  sizeFilter: true,
  minSize: 0.05,
  followingFilter: false,
  ownTradesFilter: false
})

// Pagination state
const currentPage = ref(1)
const tradesPerPage = 15

// Generate realistic OHLC candlestick data
const generateCandlestickData = (hasTrading = true) => {
  // If no trading activity, return empty data
  if (!hasTrading) {
    return { candleData: [], volumeData: [] }
  }

  const candleData = []
  const volumeData = []
  const now = new Date()
  let basePrice = calculatedMarketCap.value.marketCapUSD > 0 ? calculatedMarketCap.value.marketCapUSD : 0 // Use API market cap or 0
  
  for (let i = 99; i >= 0; i--) {
    const time = Math.floor((now.getTime() - i * 60 * 1000) / 1000) // Unix timestamp in seconds (1-minute candles)
    
    // Generate realistic OHLC data with upward trend (since we're simulating buy transactions)
    const trend = 0.02 + Math.random() * 0.03 // Positive trend for upward movement
    const volatility = 0.01 + Math.random() * 0.02 // Moderate volatility
    
    let open = basePrice
    
    // Generate upward price movement (simulating buy pressure)
    const priceChange = basePrice * (trend + Math.random() * volatility * 0.5)
    let close = open + priceChange
    
    // Generate realistic high and low with upward bias
    const maxMove = basePrice * volatility
    const highMove = maxMove * (0.5 + Math.random() * 0.5) // Upper wick
    const lowMove = maxMove * Math.random() * 0.3 // Smaller lower wick
    
    let high = close + highMove
    let low = open - lowMove
    
    // Ensure proper OHLC relationships
    high = Math.max(open, close, high)
    low = Math.min(open, close, low)
    
    // Ensure price doesn't go below a reasonable threshold
    if (low < 0.001) {
      low = 0.001
      if (close < low) close = low + 0.0001
      if (open < low) open = low + 0.0001
      if (high < close) high = close + 0.0001
    }
    
    // Volume correlated with price movement
    const priceMovement = Math.abs(close - open) / open
    const baseVolume = 2 + Math.random() * 8
    const volume = baseVolume * (1 + priceMovement * 10) // Higher volume with bigger moves
    
    candleData.push({
      time: time,
      open: parseFloat(open.toFixed(6)),
      high: parseFloat(high.toFixed(6)),
      low: parseFloat(low.toFixed(6)),
      close: parseFloat(close.toFixed(6))
    })
    
    volumeData.push({
      time: time,
      value: parseFloat(volume.toFixed(2)),
      color: close > open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
    })
    
    basePrice = close // Next candle starts where this one ended
  }
  
  return { candleData, volumeData }
}

// Check if token has trading activity (simulate real scenario)
const hasTrading = () => {
  const mintAddress = route.params.mint_address
  // Simulate: some tokens have no trading data yet
  // In real app, this would be checked via API
  if (!mintAddress) return true // Default case has data
  
  // Simulate some tokens having no trading data
  const noTradingTokens = ['no-data-token', 'empty-chart', 'test-no-data']
  return !noTradingTokens.some(token => mintAddress.includes(token))
}

// Don't initialize with fake data immediately - wait for real data
// const { candleData, volumeData } = generateCandlestickData(hasTrading())

// Store data globally for crosshair calculations - start empty
chartCandleData.value = []
chartVolumeData.value = []

// Top holders data
const topHolders = ref([
  { type: 'bonding curve', percentage: 31.03 },
  { type: 'SvTim3', percentage: 3.39 },
  { type: '3REFEM', percentage: 3.24 },
  { type: '7DeBwp', percentage: 2.92 },
  { type: 'AFHDSs', percentage: 2.81 },
  { type: '7dqYYS', percentage: 2.77 },
  { type: '7D94jp', percentage: 2.61 },
  { type: 'GTYwG', percentage: 2.50 },
  { type: 'GB4hYX', percentage: 2.50 },
  { type: 'CmBY2Q', percentage: 2.12 },
  { type: '3gahKg', percentage: 1.84 }
])

// Generate trades data
const generateTradesData = () => {
  const trades = []
  const accounts = ['zWxte', 'zhb47', 'sNT3Um', 'shu1pu', 'JDEMG']
  const avatars = [
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    'https://images.pexels.com/photos/33535/monkey-ape-thinking-mimic.jpg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1'
  ]
  
  for (let i = 0; i < 50; i++) {
    const account = accounts[Math.floor(Math.random() * accounts.length)]
    const type = Math.random() > 0.5 ? 'buy' : 'sell'
    const sol = (Math.random() * 2).toFixed(3)
    const insider = (Math.random() * 5).toFixed(2) + 'm'
    const hoursAgo = Math.floor(Math.random() * 36) + 1
    const date = `${hoursAgo}h ago`
    const transactionId = Math.random().toString(36).substring(2, 8)
    
    trades.push({
      account,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      type,
      sol,
      insider,
      date,
      transaction: transactionId,
      transactionUrl: `https://solscan.io/tx/${transactionId}`,
      warning: Math.random() > 0.8
    })
  }
  
  return trades
}

const totalTrades = ref(generateTradesData())

// Computed properties for pagination
const totalPages = computed(() => {
  // Use only real transaction data for pagination
  return Math.ceil(transactionData.value.length / tradesPerPage)
})
const startIndex = computed(() => (currentPage.value - 1) * tradesPerPage + 1)
const endIndex = computed(() => {
  return Math.min(currentPage.value * tradesPerPage, transactionData.value.length)
})

const paginatedTrades = computed(() => {
  // Use only real transaction data, no fallback
  if (transactionData.value.length === 0) {
    return []
  }
  
  const start = (currentPage.value - 1) * tradesPerPage
  const end = start + tradesPerPage
  return transactionData.value.slice(start, end)
})

// Bonding curve progress calculation
const bondingCurveProgress = computed(() => {
  if (topHoldersData.value.length === 0) return 0
  
  // Find bonding curve entry
  const bondingCurve = topHoldersData.value.find(holder => holder.is_bonding_curve)
  if (!bondingCurve) return 0
  
  // Progress is how much has been sold (100% - remaining percentage)
  const remainingPercentage = parseFloat(bondingCurve.percentage)
  const progress = Math.max(0, Math.min(100, 100 - remainingPercentage))
  
  // Round to 2 decimal places
  return Math.round(progress * 100) / 100
})

const formattedHoveredTime = computed(() => {
  if (!hoveredTime.value) return null
  
  const date = new Date(hoveredTime.value * 1000)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
})

// Initialize TradingView Chart
const initializeChart = () => {
  console.log('🔧 Initializing chart...')
  console.log('📊 Chart container:', !!chartContainer.value)
  console.log('📈 Chart candle data:', chartCandleData.value?.length || 0)
  
  if (!chartContainer.value) {
    console.error('❌ No chart container found - checking DOM...')
    console.log('📋 DOM container status:', {
      hasChartData: hasChartData.value,
      isChartLoading: isChartLoading.value,
      containerRef: !!chartContainer.value
    })
    
    // Try again after a delay
    setTimeout(() => {
      if (chartContainer.value) {
        console.log('✅ Chart container found on retry, initializing...')
        initializeChart()
      } else {
        console.error('❌ Chart container still not found after retry')
      }
    }, 200)
    return
  }

  // Check if we have data to display
  if (!chartCandleData.value || chartCandleData.value.length === 0) {
    console.log('❌ No chart data available')
    hasChartData.value = false
    return
  }

  console.log('✅ Chart data available, creating chart...')
  hasChartData.value = true

  // Create the chart
  chart.value = createChart(chartContainer.value, {
    width: chartContainer.value.clientWidth,
    height: 500,
    layout: {
      background: { color: 'transparent' },
      textColor: '#d1d5db',
      fontSize: 12,
      fontFamily: 'Monaco, Menlo, monospace',
    },
    grid: {
      vertLines: { 
        color: 'rgba(255, 255, 255, 0.06)',
        style: 1,
        visible: true,
      },
      horzLines: { 
        color: 'rgba(255, 255, 255, 0.06)',
        style: 1,
        visible: true,
      },
    },
    crosshair: {
      mode: 1, // Normal crosshair mode
      vertLine: {
        color: 'rgba(255, 255, 255, 0.8)',
        width: 1,
        style: 2, // Dashed line
        labelVisible: true,
        labelBackgroundColor: '#42b883',
      },
      horzLine: {
        color: 'rgba(255, 255, 255, 0.8)',
        width: 1,
        style: 2, // Dashed line
        labelVisible: true,
        labelBackgroundColor: '#42b883',
      },
    },
    priceScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textColor: '#d1d5db',
      fontSize: 11,
      entireTextOnly: false,
      scaleMargins: {
        top: 0.1,
        bottom: 0.2,
      },
      // Format prices as market cap (pump.fun style)
      format: {
        type: 'custom',
        formatter: (price) => {
          if (price >= 1000000) {
            return `$${(price / 1000000).toFixed(2)}M`
          } else if (price >= 1000) {
            return `$${(price / 1000).toFixed(2)}K`
          } else {
            return `$${price.toFixed(2)}`
          }
        },
      },
    },
    timeScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textColor: '#d1d5db',
      fontSize: 11,
      timeVisible: true,
      secondsVisible: false,
      // Configure time scale to make bars closer together
      rightOffset: 5,
      barSpacing: 8, // Reduce spacing between bars
      minBarSpacing: 4, // Minimum spacing
      fixLeftEdge: false,
      fixRightEdge: false,
      lockVisibleTimeRangeOnResize: false,
      tickMarkFormatter: (time) => {
        const date = new Date(time * 1000)
        const now = new Date()
        const diffHours = (now - date) / (1000 * 60 * 60)
        
        if (diffHours < 1) {
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        } else if (diffHours < 24) {
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        } else {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
        }
      },
    },
    rightPriceScale: {
      visible: true,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textColor: '#d1d5db',
      fontSize: 11,
      scaleMargins: {
        top: 0.05,     // 5% отступ сверху
        bottom: 0.25,  // 25% снизу для volume panel
      },
      // Custom formatter for market cap values
      formatter: (price) => {
        if (price >= 1000000) {
          return `$${(price / 1000000).toFixed(2)}M`
        } else if (price >= 1000) {
          return `$${(price / 1000).toFixed(2)}K`
        } else {
          return `$${price.toFixed(2)}`
        }
      },
    },
    leftPriceScale: {
      visible: false,
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: true,
    },
    handleScale: {
      axisPressedMouseMove: true,
      mouseWheel: true,
      pinch: true,
    },
    kineticScroll: {
      touch: true,
      mouse: false,
    },
  })

  // Add candlestick series
  candlestickSeries.value = chart.value.addCandlestickSeries({
    upColor: '#10b981',
    downColor: '#ef4444',
    borderUpColor: '#10b981',
    borderDownColor: '#ef4444',
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444',
    borderVisible: true,
    wickVisible: true,
    priceScaleId: 'right', // Use main right price scale
    // Ensure candles have proper body visibility
    borderWidth: 1,
    wickThickness: 1,
    priceFormat: {
      type: 'custom',
      minMove: 0.000001,
      formatter: (price) => {
        // Custom formatter for market cap values
        if (price >= 1000000) {
          return `$${(price / 1000000).toFixed(2)}M`
        } else if (price >= 1000) {
          return `$${(price / 1000).toFixed(2)}K`
        } else {
          return `$${price.toFixed(2)}`
        }
      },
    },
  })

  // Add volume series (histogram)
  volumeSeries.value = chart.value.addHistogramSeries({
    color: 'rgba(66, 184, 131, 0.4)',
    priceFormat: {
      type: 'volume',
      precision: 0,
    },
    priceScaleId: 'volume', // Create separate price scale for volume
    scaleMargins: {
      top: 0.8,    // Volume panel starts at 80% from top (bottom 20% of chart)
      bottom: 0.05, // Small bottom margin
    },
    lastValueVisible: false,
    priceLineVisible: false,
  })

  // Configure volume price scale
  chart.value.priceScale('volume').applyOptions({
    scaleMargins: {
      top: 0.8,    // Volume takes bottom 20% of chart
      bottom: 0.05,
    },
    borderVisible: false,
    textColor: '#d1d5db',
    fontSize: 10,
  })

  // Set the data
  console.log('📊 Setting chart data - Candle sample:', chartCandleData.value?.slice(0, 3))
  console.log('📊 Setting chart data - Volume sample:', chartVolumeData.value?.slice(0, 3))
  candlestickSeries.value.setData(chartCandleData.value)
  volumeSeries.value.setData(chartVolumeData.value)

  // Configure time scale to make bars closer together
  chart.value.timeScale().applyOptions({
    barSpacing: 12, // Increase spacing between bars for better visibility
    minBarSpacing: 8, // Minimum spacing
    rightOffset: 5,
    fixLeftEdge: false,
    fixRightEdge: false,
  })

  // Add trade markers (pump.fun style)
  if (showTradeDisplay.value) {
    addTradeMarkers()
  }

  // Subscribe to crosshair move to show tooltip
  chart.value.subscribeCrosshairMove((param) => {
    if (!param.time || !param.point || !param.seriesData.size) {
      // Reset to latest candle data when no hover
      hoveredCandle.value = null
      hoveredTime.value = null
      hoveredPriceChange.value = null
      hoveredVolumeChange.value = null
      candleBodyChange.value = null
      wickHigh.value = null
      wickLow.value = null
      priceRange.value = null
      
      if (chartCandleData.value.length > 0) {
        const latestCandle = chartCandleData.value[chartCandleData.value.length - 1]
        currentPrice.value = latestCandle.close
        
        // Calculate price change from previous candle
        if (chartCandleData.value.length > 1) {
          const previousCandle = chartCandleData.value[chartCandleData.value.length - 2]
          const change = ((latestCandle.close - previousCandle.close) / previousCandle.close) * 100
          priceChange.value = parseFloat(change.toFixed(2))
        }
      }
      
      if (chartVolumeData.value.length > 0) {
        const latestVolume = chartVolumeData.value[chartVolumeData.value.length - 1]
        currentVolume.value = latestVolume.value
      }
      return
    }

    // Get candlestick data for current position
    const candleDataPoint = param.seriesData.get(candlestickSeries.value)
    const volumeDataPoint = param.seriesData.get(volumeSeries.value)
    
    if (candleDataPoint) {
      // Update hovered candle data
      hoveredCandle.value = candleDataPoint
      hoveredTime.value = param.time
      
      // Don't update currentPrice here - keep it as the latest candle close price
      // currentPrice.value = candleDataPoint.close
      
      // Calculate candle body change (from open to close)
      const bodyChange = ((candleDataPoint.close - candleDataPoint.open) / candleDataPoint.open) * 100
      candleBodyChange.value = parseFloat(bodyChange.toFixed(2))
      priceChange.value = parseFloat(bodyChange.toFixed(2))
      
      // Calculate price range (high - low) as percentage of open
      const range = ((candleDataPoint.high - candleDataPoint.low) / candleDataPoint.open) * 100
      priceRange.value = parseFloat(range.toFixed(2))
      
      // Calculate wick sizes
      const bodyHigh = Math.max(candleDataPoint.open, candleDataPoint.close)
      const bodyLow = Math.min(candleDataPoint.open, candleDataPoint.close)
      
      const upperWick = ((candleDataPoint.high - bodyHigh) / candleDataPoint.open) * 100
      const lowerWick = ((bodyLow - candleDataPoint.low) / candleDataPoint.open) * 100
      
      wickHigh.value = parseFloat(upperWick.toFixed(2))
      wickLow.value = parseFloat(lowerWick.toFixed(2))
      
      // Find the previous candle to calculate change vs previous close
      const currentIndex = chartCandleData.value.findIndex(candle => candle.time === param.time)
      if (currentIndex > 0) {
        const previousCandle = chartCandleData.value[currentIndex - 1]
        const changeVsPrev = ((candleDataPoint.close - previousCandle.close) / previousCandle.close) * 100
        hoveredPriceChange.value = parseFloat(changeVsPrev.toFixed(2))
      } else {
        hoveredPriceChange.value = null
      }
    }
    
    if (volumeDataPoint) {
      currentVolume.value = volumeDataPoint.value
      
      // Calculate volume change vs previous if available
      const currentIndex = chartVolumeData.value.findIndex(vol => vol.time === param.time)
      if (currentIndex > 0) {
        const previousVolume = chartVolumeData.value[currentIndex - 1]
        const volumeChangePct = ((volumeDataPoint.value - previousVolume.value) / previousVolume.value) * 100
        hoveredVolumeChange.value = parseFloat(volumeChangePct.toFixed(2))
      } else {
        hoveredVolumeChange.value = null
      }
    }
  })

  // Auto-resize chart
  const resizeObserver = new ResizeObserver(entries => {
    if (chart.value && chartContainer.value) {
      chart.value.applyOptions({
        width: chartContainer.value.clientWidth,
        height: 500,
      })
    }
  })
  
  resizeObserver.observe(chartContainer.value)

  // Store the observer for cleanup
  chart.value._resizeObserver = resizeObserver
}

// WebSocket methods
const connectWebSocket = (mintAddress) => {
  if (!mintAddress) {
    console.warn('No mint address provided for WebSocket connection')
    return
  }

  try {
    // Close existing connection if any
    if (websocket.value) {
      websocket.value.close()
    }

    console.log('🔌 Connecting to WebSocket for token:', mintAddress)
    
    // Connect to WebSocket server
    websocket.value = new WebSocket(`wss://launchpad-wl8n.onrender.com/websocket`)
    
    websocket.value.onopen = () => {
      console.log('✅ WebSocket connected successfully')
      isWebSocketConnected.value = true
      websocketError.value = null
      
      // Subscribe to token events
      const subscribeMessage = {
        type: 'subscribe',
        mintAddress: mintAddress
      }
      
      websocket.value.send(JSON.stringify(subscribeMessage))
      console.log('📡 Subscribed to token events for:', mintAddress)
    }
    
    websocket.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 WebSocket message received:', data)
        
        // Handle different message types
        if (data.type === 'token_purchase') {
          console.log('💰 Price changed - token purchased!')
          console.log('📊 Purchase details:', {
            mint: data.mint,
            amount: data.amount,
            user: data.user,
            timestamp: data.timestamp
          })
          
          // Update top holders immediately if data is provided
          if (data.updatedHolders) {
            console.log('🏆 Updating top holders with new data from WebSocket')
            updateTopHolders(data.updatedHolders)
          }
          
          // Refresh chart data when new transaction occurs
          refreshChartData(mintAddress)
          
        } else if (data.type === 'token_sale') {
          console.log('💰 Price changed - token sold!')
          console.log('📊 Sale details:', {
            mint: data.mint,
            amount: data.amount,
            user: data.user,
            timestamp: data.timestamp
          })
          
          // Update top holders immediately if data is provided
          if (data.updatedHolders) {
            console.log('🏆 Updating top holders with new data from WebSocket')
            updateTopHolders(data.updatedHolders)
          }
          
          // Refresh chart data when new transaction occurs
          refreshChartData(mintAddress)
          
        } else if (data.type === 'connected') {
          console.log('✅ WebSocket connection confirmed:', data.clientId)
        } else if (data.type === 'subscribed') {
          console.log('✅ Subscribed to token:', data.mintAddress)
        } else if (data.type === 'error') {
          console.error('❌ WebSocket error:', data.message)
          websocketError.value = data.message
        }
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error)
      }
    }
    
    websocket.value.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
      websocketError.value = 'WebSocket connection error'
      isWebSocketConnected.value = false
    }
    
    websocket.value.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason)
      isWebSocketConnected.value = false
      
      // Attempt to reconnect after 5 seconds if not intentionally closed
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect WebSocket...')
          connectWebSocket(mintAddress)
        }, 5000)
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to connect WebSocket:', error)
    websocketError.value = error.message
    isWebSocketConnected.value = false
  }
}

const disconnectWebSocket = () => {
  if (websocket.value) {
    console.log('🔌 Disconnecting WebSocket...')
    websocket.value.close(1000, 'Component unmounting')
    websocket.value = null
    isWebSocketConnected.value = false
    websocketError.value = null
  }
}

const refreshChartData = async (mintAddress) => {
  console.log('🔄 Refreshing chart data due to new transaction...')
  
  // Reload market cap data
  await loadMarketCapData(mintAddress)
  
  // Reload transaction data
  await loadTransactionData(mintAddress)
  
  // Reload top holders data (important for buy/sell updates)
  console.log('👥 Refreshing top holders data...')
  await loadTopHoldersData(mintAddress)
  
  // Check if we now have data after refresh
  if (chartCandleData.value.length > 0) {
    console.log('✅ Chart data available after refresh, updating chart...')
    
    // If chart doesn't exist yet, initialize it
    if (!chart.value) {
      console.log('📈 Chart not initialized yet, initializing now...')
      await nextTick()
      setTimeout(() => {
        initializeChart()
        isChartLoading.value = false
      }, 100)
    } else {
      // Chart exists, update the data
      console.log('📈 Updating existing chart with new data...')
      candlestickSeries.value.setData(chartCandleData.value)
      volumeSeries.value.setData(chartVolumeData.value)
      
      // Add trade markers if enabled
      if (showTradeDisplay.value) {
        addTradeMarkers()
      }
      
      // Force chart to fit content to the new data range
      setTimeout(() => {
        if (chart.value) {
          chart.value.timeScale().fitContent()
        }
      }, 100)
    }
  } else {
    console.log('⚠️ Still no chart data available after refresh')
  }
}

// Function to update top holders with WebSocket data
const updateTopHolders = (newHolders) => {
  if (newHolders && Array.isArray(newHolders)) {
    console.log('🏆 Updating top holders with WebSocket data:', newHolders.length, 'holders')
    
    isHoldersUpdating.value = true
    
    // Add flag for animation
    const holdersWithFlag = newHolders.map(holder => ({
      ...holder,
      isNewlyUpdated: true
    }))
    
    // Update top holders data
    topHoldersData.value = holdersWithFlag
    
    // Remove flag after 2 seconds
    setTimeout(() => {
      topHoldersData.value = topHoldersData.value.map(holder => ({
        ...holder,
        isNewlyUpdated: false
      }))
      isHoldersUpdating.value = false
    }, 2000)
    
    // Show notification
    showNotification('Top holders updated!', 'success')
    
    console.log('✅ Top holders updated successfully from WebSocket')
  }
}

// Function to show notifications
const showNotification = (message, type = 'info') => {
  console.log(`🔔 ${type.toUpperCase()}: ${message}`)
  
  // You can implement your own notification system here
  // For now, we'll just log to console
}

// Methods
const goBack = () => {
  router.back()
}

const setTimeframe = (timeframe) => {
  selectedTimeframe.value = timeframe
  console.log(`🔄 Switching to ${timeframe} timeframe`)
  
  // If we have real transaction data, convert it to new timeframe
  if (transactionData.value.length > 0) {
    console.log(`🔄 Converting transaction data to ${timeframe} timeframe`)
    const chartData = convertTransactionsToChartData(transactionData.value)
    
    if (chartData.candleData.length > 0) {
      // Update chart with new timeframe data
      chartCandleData.value = chartData.candleData
      chartVolumeData.value = chartData.volumeData
      hasChartData.value = true
      
      console.log(`✅ Created ${chartData.candleData.length} candles for ${timeframe} timeframe`)
      
      // Update chart series if they exist
      if (candlestickSeries.value && volumeSeries.value) {
        candlestickSeries.value.setData(chartData.candleData)
        volumeSeries.value.setData(chartData.volumeData)
        
        // Re-add trade markers if enabled
        if (showTradeDisplay.value) {
          addTradeMarkers()
        }
        
        // Update current price to latest candle
        if (chartData.candleData.length > 0) {
          const latestCandle = chartData.candleData[chartData.candleData.length - 1]
          currentPrice.value = latestCandle.close
          
          if (chartData.candleData.length > 1) {
            const previousCandle = chartData.candleData[chartData.candleData.length - 2]
            const change = ((latestCandle.close - previousCandle.close) / previousCandle.close) * 100
            priceChange.value = parseFloat(change.toFixed(2))
          }
        }
        
        // Force chart to fit content to the new data range and apply spacing
        setTimeout(() => {
          if (chart.value) {
            // Apply time scale options for proper bar spacing
            chart.value.timeScale().applyOptions({
              barSpacing: 12, // Consistent spacing between bars
              minBarSpacing: 8, // Minimum spacing
              rightOffset: 5,
              fixLeftEdge: false,
              fixRightEdge: false,
            })
            chart.value.timeScale().fitContent()
          }
        }, 100)
      }
      return
    }
  }
  
  // No fallback - if no real transaction data, show empty chart
  console.log('⚠️ No real transaction data available for timeframe change')
  chartCandleData.value = []
  chartVolumeData.value = []
  hasChartData.value = false
  
  if (candlestickSeries.value) {
    candlestickSeries.value.setData([])
  }
  if (volumeSeries.value) {
    volumeSeries.value.setData([])
  }
}

const setChartType = (type) => {
  selectedChartType.value = type
  // In a real implementation, this would change the data source
  // For demo purposes, we'll just change the price multiplier
  const multiplier = type === 'usd' ? 0.000045 : 1 // Simulating USD/SOL rate
  
  // Regenerate data with new multiplier
  setTimeframe(selectedTimeframe.value)
}

const toggleTradeDisplay = () => {
  showTradeDisplay.value = !showTradeDisplay.value
  if (showTradeDisplay.value) {
    addTradeMarkers()
  } else {
    // Clear markers
    if (candlestickSeries.value) {
      candlestickSeries.value.setMarkers([])
    }
  }
}

const hideAllBubbles = () => {
  // Hide all trade bubbles - similar to pump.fun functionality
  if (candlestickSeries.value) {
    candlestickSeries.value.setMarkers([])
  }
  showTradeDisplay.value = false
}

const toggleNoData = () => {
  // Toggle between having data and no data for testing
  hasChartData.value = !hasChartData.value
  
  if (!hasChartData.value) {
    // Clear chart data
    chartCandleData.value = []
    chartVolumeData.value = []
    if (candlestickSeries.value) {
      candlestickSeries.value.setData([])
    }
    if (volumeSeries.value) {
      volumeSeries.value.setData([])
    }
  } else {
    // Regenerate data
    const { candleData, volumeData } = generateCandlestickData(true)
    chartCandleData.value = candleData
    chartVolumeData.value = volumeData
    
    if (candlestickSeries.value && volumeSeries.value) {
      candlestickSeries.value.setData(candleData)
      volumeSeries.value.setData(volumeData)
    }
  }
}

const setTradeTab = (tab) => {
  activeTradeTab.value = tab
  // Don't auto-set currency, let user choose
  // tradeCurrency.value = tab === 'buy' ? 'SOL' : 'TOKENS'
  // Clear amount when switching tabs
  tradeAmount.value = ''
  showCurrencyDropdown.value = false // Close dropdown when switching tabs
  
  // Set appropriate expected price
  if (tab === 'buy') {
    expectedPrice.value = calculatedMarketCap.value.marketCapUSD || currentPrice.value
  } else {
    expectedPrice.value = calculatedMarketCap.value.priceSOL || 0.000000035
  }
}

// Toggle currency dropdown
const toggleCurrencyDropdown = () => {
  showCurrencyDropdown.value = !showCurrencyDropdown.value
}

// Select currency from dropdown
const selectCurrency = (currency) => {
  tradeCurrency.value = currency
  showCurrencyDropdown.value = false
  // Clear amount when changing currency
  tradeAmount.value = ''
}

// Get currency symbol for display
const getCurrencySymbol = () => {
  return tradeCurrency.value === 'SOL' ? 'SOL' : (tokenInfo.value.ticker || 'TOKENS')
}

// Get balance display
const getBalanceDisplay = () => {
  if (activeTradeTab.value === 'buy') {
    return tradeCurrency.value === 'SOL' ? '0.0459 SOL' : '0 TOKENS'
  } else {
    return tradeCurrency.value === 'SOL' ? '0.0459 SOL' : '0 TOKENS'
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Helper methods for formatting transaction data
const formatAddress = (address) => {
  if (!address) return 'Unknown'
  return address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address
}

const formatTransactionId = (txId) => {
  if (!txId) return 'Unknown'
  return txId.length > 10 ? `${txId.slice(0, 6)}...${txId.slice(-4)}` : txId
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now - date
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const getAvatarForAddress = (address) => {
  // Generate a consistent avatar based on address
  const avatars = [
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    'https://images.pexels.com/photos/33535/monkey-ape-thinking-mimic.jpg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1'
  ]
  
  if (!address) return avatars[0]
  
  // Use address hash to consistently select avatar
  const hash = address.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return avatars[Math.abs(hash) % avatars.length]
}

// Load token data from API
const loadTokenData = async (mintAddress) => {
  if (!mintAddress) {
    tokenLoadError.value = 'No mint address provided'
    isTokenLoading.value = false
    return
  }

  try {
    isTokenLoading.value = true
    tokenLoadError.value = null

    const response = await fetch(`https://launchpad-wl8n.onrender.com/api/token/coin/${mintAddress}`)
    
    if (!response.ok) {
      throw new Error(`Failed to load token data: ${response.status}`)
    }

    const responseData = await response.json()
    
    // Проверяем структуру ответа и извлекаем токен
    const tokenData = responseData.success && responseData.data ? responseData.data.token : responseData.token || responseData
    
    // Проверяем, что токен данные существуют
    if (!tokenData) {
      console.log('⚠️ No token data found in response:', responseData)
      return // Keep default token info
    }
    
    console.log('✅ Token data extracted:', tokenData)
    
    // Update token info with API data
    tokenInfo.value = {
      ...tokenInfo.value,
      name: tokenData.name || tokenInfo.value.name,
      ticker: tokenData.symbol || tokenInfo.value.ticker,
      description: tokenData.description || tokenInfo.value.description,
      image: tokenData.image_url && tokenData.image_url !== 'placeholder' 
        ? tokenData.image_url 
        : tokenInfo.value.image,
      website: tokenData.website || tokenInfo.value.website,
      twitter: tokenData.twitter || tokenInfo.value.twitter,
      telegram: tokenData.telegram || tokenInfo.value.telegram,
      totalSupply: tokenData.supply ? tokenData.supply.toLocaleString() : tokenInfo.value.totalSupply,
      created: tokenData.createdAt ? new Date(tokenData.createdAt).toLocaleString() : tokenInfo.value.created,
      mintAddress: tokenData.mint_address
    }

    console.log('Token data loaded:', tokenData)
    
  } catch (error) {
    console.error('Failed to load token data:', error)
    tokenLoadError.value = error.message
  } finally {
    isTokenLoading.value = false
  }
}

// New: Calculate market cap based on chartlogic.md
const calculateMarketCap = (tokenPrice, circulatingSupply, solPriceUSD = 100) => {
  const marketCapSOL = circulatingSupply * tokenPrice
  const marketCapUSD = marketCapSOL * solPriceUSD
  
  return {
    marketCapSOL,
    marketCapUSD,
    circulatingSupply: circulatingSupply / 1000000, // Convert to millions
    priceSOL: tokenPrice
  }
}

// New: Process market cap from API data according to chartpricelogic.md
const processMarketCapFromAPI = (apiData, solPriceUSD = 167) => {
  const { data } = apiData
  
  // Extract data from API
  const priceSOL = data.priceInSol
  const priceUSD = data.priceInUSD
  const virtualSolReserves = parseFloat(data.virtualSolReserves)
  const virtualTokenReserves = parseFloat(data.virtualTokenReserves)
  const realSolReserves = parseFloat(data.realSolReserves)
  const realTokenReserves = parseFloat(data.realTokenReserves)
  const tokenTotalSupply = parseFloat(data.tokenTotalSupply)
  
  // Calculate token price using bonding curve formula from API calculation details
  // Use normalized values as provided in calculationDetails
  const solReservesNormalized = virtualSolReserves / Math.pow(10, 9) // Convert lamports to SOL
  const tokenReservesNormalized = virtualTokenReserves / Math.pow(10, 6) // Convert base units to tokens
  const tokenPriceSOL = solReservesNormalized / tokenReservesNormalized
  
  // Calculate market cap using correct formula: Market Cap = Total Supply × Current Token Price × SOL Price USD
  // Total supply needs to be converted from base units to actual tokens
  const totalSupplyInActualTokens = tokenTotalSupply / Math.pow(10, 6) // Convert base units to actual tokens
  const marketCapUSD = totalSupplyInActualTokens * tokenPriceSOL * solPriceUSD
  
  // Calculate circulating supply (sold tokens)
  const circulatingSupply = (tokenTotalSupply - realTokenReserves) / Math.pow(10, 6) // In millions
  
  // Market cap in SOL
  const marketCapSOL = totalSupplyInActualTokens * tokenPriceSOL

  console.log('📊 Market cap calculation from API (chartpricelogic.md):')
  console.log(`   Virtual SOL reserves: ${virtualSolReserves} lamports (${solReservesNormalized} SOL)`)
  console.log(`   Virtual token reserves: ${virtualTokenReserves} base units (${tokenReservesNormalized} tokens)`)
  console.log(`   Token price SOL: ${tokenPriceSOL}`)
  console.log(`   Token total supply: ${tokenTotalSupply} base units (${totalSupplyInActualTokens} tokens)`)
  console.log(`   SOL price USD: $${solPriceUSD}`)
  console.log(`   Market cap calculation: ${totalSupplyInActualTokens} × ${tokenPriceSOL} × $${solPriceUSD}`)
  console.log(`   Market cap USD: $${marketCapUSD}`)
  console.log(`   Market cap SOL: ${marketCapSOL} SOL`)

  return {
    marketCapSOL,
    marketCapUSD,
    circulatingSupply,
    totalSupply: totalSupplyInActualTokens / 1000000, // Convert to millions for display
    priceSOL: tokenPriceSOL,
    priceUSD: tokenPriceSOL * solPriceUSD,
    volume24h: 0 // Need to get from events
  }
}

// New: Load market cap data from API
const loadMarketCapData = async (mintAddress) => {
  try {
    console.log('🔄 Loading market cap data for mint:', mintAddress)
    
    const response = await fetch(`https://launchpad-wl8n.onrender.com/api/token/price/${mintAddress}`)
    
    if (!response.ok) {
      throw new Error(`Failed to load market cap data: ${response.status}`)
    }

    const responseData = await response.json()
    
    if (!responseData.success) {
      throw new Error(responseData.message || 'Failed to load market cap data')
    }

    console.log('✅ Market cap data loaded:', responseData)
    
    // Process market cap data according to chartlogic.md
    const marketCapData = processMarketCapFromAPI(responseData)
    calculatedMarketCap.value = marketCapData
    
    // Update current price with API market cap data
    currentPrice.value = marketCapData.marketCapUSD
    
    console.log('📊 Processed market cap data:', marketCapData)
    console.log('💰 Updated currentPrice to:', currentPrice.value)
    
  } catch (error) {
    console.error('❌ Failed to load market cap data:', error)
    // Keep default market cap on error
  }
}

// New: Load top holders data from API
const loadTopHoldersData = async (mintAddress) => {
  if (!mintAddress) {
    console.warn('No mint address provided for top holders data')
    return
  }

  try {
    isTopHoldersLoading.value = true
    topHoldersError.value = null

    console.log('🔄 Loading top holders data for mint:', mintAddress)

    const response = await fetch(`https://launchpad-wl8n.onrender.com/api/websocket/holders/top/${mintAddress}`)
    
    if (!response.ok) {
      throw new Error(`Failed to load top holders data: ${response.status}`)
    }

    const responseData = await response.json()
    
    if (!responseData.success) {
      throw new Error(responseData.message || 'Failed to load top holders data')
    }

    console.log('✅ Top holders data loaded:', responseData)
    
    // Total token supply from API data (1,000,000,000 tokens)
    const TOTAL_SUPPLY = 1000000000 // 1B tokens (from your API data)
    
    // Calculate bonding curve balance (remaining tokens not held by top holders)
    const topHoldersBalance = responseData.data.holders.reduce((sum, holder) => sum + holder.balance, 0)
    const bondingCurveBalance = TOTAL_SUPPLY - topHoldersBalance
    
    // According to chartlogic.md, bonding curve should show percentage of remaining tokens
    // not the percentage of total supply
    console.log('📊 Bonding curve calculation:')
    console.log(`   Total supply: ${(TOTAL_SUPPLY / 1000000).toFixed(2)}M tokens`)
    console.log(`   Top holders balance: ${(topHoldersBalance / 1000000).toFixed(2)}M tokens`)
    console.log(`   Bonding curve balance: ${(bondingCurveBalance / 1000000).toFixed(2)}M tokens`)
    console.log(`   Bonding curve percentage: ${((bondingCurveBalance / TOTAL_SUPPLY) * 100).toFixed(2)}%`)
    
    console.log('📊 Supply calculation:')
    console.log(`   Total supply: ${(TOTAL_SUPPLY / 1000000).toFixed(2)}M tokens`)
    console.log(`   Top holders balance: ${(topHoldersBalance / 1000000).toFixed(2)}M tokens`)
    console.log(`   Bonding curve balance: ${(bondingCurveBalance / 1000000).toFixed(2)}M tokens`)
    
    // Calculate percentages with proper precision
    console.log('📊 Percentage calculation:')
    responseData.data.holders.forEach(holder => {
      const percentage = (holder.balance / TOTAL_SUPPLY) * 100
      console.log(`   ${holder.holder_address}: ${percentage.toFixed(6)}%`)
    })
    
    // Create bonding curve entry
    const bondingCurveEntry = {
      rank: 0, // Will be sorted later
      holder_address: 'bonding curve',
      balance: bondingCurveBalance,
      balance_formatted: (bondingCurveBalance / 1000000).toLocaleString(),
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_bonding_curve: true
    }
    
    // Combine bonding curve with top holders
    const allHolders = [bondingCurveEntry, ...responseData.data.holders]
    
    // Transform data to include percentages based on total supply
    const holdersWithPercentages = allHolders.map(holder => {
      let percentage, formattedPercentage
      
      if (holder.is_bonding_curve) {
        // For bonding curve, show percentage of remaining tokens
        percentage = (holder.balance / TOTAL_SUPPLY) * 100
        formattedPercentage = percentage.toFixed(2) // 2 decimal places for bonding curve
      } else {
        // For regular holders, show percentage of total supply
        percentage = (holder.balance / TOTAL_SUPPLY) * 100
        // Use more decimal places for small percentages
        formattedPercentage = percentage < 0.01 ? percentage.toFixed(6) : percentage.toFixed(2)
      }
      
      console.log(`📊 Holder calculation: ${holder.holder_address}`)
      console.log(`   Balance: ${holder.balance.toLocaleString()}`)
      console.log(`   Total supply: ${TOTAL_SUPPLY.toLocaleString()}`)
      console.log(`   Percentage: ${percentage}`)
      console.log(`   Formatted: ${formattedPercentage}%`)
      
      return {
        ...holder,
        percentage: formattedPercentage
      }
    })
    
    // Log expected percentages based on your data
    console.log('📊 Expected percentages based on your data:')
    console.log(`   Holder 1 (102,278,470.285936): ${(102278470.285936 / 1000000000 * 100).toFixed(2)}%`)
    console.log(`   Holder 2 (6,529,742.887571): ${(6529742.887571 / 1000000000 * 100).toFixed(2)}%`)
    console.log(`   Bonding curve: ${(999999891.191786 / 1000000000 * 100).toFixed(2)}%`)
    
    // Sort by balance (highest first)
    holdersWithPercentages.sort((a, b) => b.balance - a.balance)
    
    // Update ranks
    holdersWithPercentages.forEach((holder, index) => {
      holder.rank = index + 1
    })
    
    topHoldersData.value = holdersWithPercentages
    
    console.log(`✅ Loaded ${holdersWithPercentages.length} top holders with percentages`)
    console.log('📊 Top holders data sample:', holdersWithPercentages.slice(0, 3))

  } catch (error) {
    console.error('❌ Failed to load top holders data:', error)
    topHoldersError.value = error.message
    
    // Fallback to default data on error
    topHoldersData.value = topHolders.value
  } finally {
    isTopHoldersLoading.value = false
  }
}

// New: Load transaction data from database
const loadTransactionData = async (mintAddress) => {
  if (!mintAddress) {
    console.warn('No mint address provided for transaction data')
    return
  }

  try {
    isTransactionDataLoading.value = true
    transactionDataError.value = null

    console.log('🔄 Loading transaction data for mint:', mintAddress)

    const response = await fetch(`https://launchpad-wl8n.onrender.com/api/websocket/database/trades/mint/${mintAddress}?limit=1000`)
    
    if (!response.ok) {
      throw new Error(`Failed to load transaction data: ${response.status}`)
    }

    const responseData = await response.json()
    
    if (!responseData.success) {
      throw new Error(responseData.message || 'Failed to load transaction data')
    }
    console.log(`FULL DATA: ${JSON.stringify(responseData)}`)
    console.log(responseData)
    
    // Extract trades array from response
    const trades = responseData.data.trades || []
    transactionData.value = trades
    
    console.log(`✅ Loaded ${transactionData.value.length} transactions from database`)
    console.log(`📊 Trades array:`, trades)
    console.log('📊 Transaction data sample:', transactionData.value.slice(0, 3))

    // Check if we have any transactions
    if (transactionData.value.length === 0) {
      console.log('⚠️ No transactions found - showing "No data here"')
      // No transactions - show empty state
      chartCandleData.value = []
      chartVolumeData.value = []
      hasChartData.value = false
      
      // Update chart series if they exist
      if (candlestickSeries.value && volumeSeries.value) {
        candlestickSeries.value.setData([])
        volumeSeries.value.setData([])
        console.log('📈 Chart series cleared - no transactions')
      }
      
      // Mark loading as complete
      isChartLoading.value = false
      return
    }

    // Convert transaction data to chart data
    const chartData = convertTransactionsToChartData(transactionData.value)
    console.log('📊 Converted chart data:', {
      candles: chartData.candleData.length,
      volumes: chartData.volumeData.length
    })
    
    if (chartData.candleData.length > 0) {
      // Update chart with real transaction data
      chartCandleData.value = chartData.candleData
      chartVolumeData.value = chartData.volumeData
      hasChartData.value = true
      
      // Use real transaction data without forcing upward trend
      console.log('✅ Using real transaction data for chart candles')
      console.log('📊 Sample candle from real data:', chartCandleData.value[0])
      
      // Update current market cap from API data instead of transaction data
      if (calculatedMarketCap.value.marketCapUSD > 0) {
        console.log(`🔍 Using API market cap data:`)
        console.log(`   Market cap from API: $${calculatedMarketCap.value.marketCapUSD.toFixed(2)}`)
        console.log(`   Market cap SOL: ${calculatedMarketCap.value.marketCapSOL.toFixed(2)} SOL`)
        
        currentPrice.value = calculatedMarketCap.value.marketCapUSD // Use API market cap
        expectedPrice.value = calculatedMarketCap.value.marketCapUSD
        
        console.log(`💰 Updated currentPrice to: $${currentPrice.value.toFixed(2)}`)
        
        // Force reactivity update
        nextTick(() => {
          console.log('🔄 Force UI update - currentPrice:', currentPrice.value)
        })
      } else {
        // Fallback to transaction data if API data not available
        const latestTransaction = transactionData.value[0] // Most recent first
        if (latestTransaction) {
          const TOTAL_SUPPLY = 1000000000000 // 1 trillion tokens (1T)
          const tokenPriceSOL = parseFloat(latestTransaction.price_per_token)
          const solPriceUSD = 167 // SOL price in USD
          const marketCap = TOTAL_SUPPLY * tokenPriceSOL * solPriceUSD
          
          console.log(`🔍 Fallback to transaction data:`)
          console.log(`   Token price SOL: ${tokenPriceSOL.toFixed(8)}`)
          console.log(`   SOL price USD: $${solPriceUSD}`)
          console.log(`   Market cap calculation: ${TOTAL_SUPPLY} × ${tokenPriceSOL} × $${solPriceUSD} = ${marketCap}`)
          console.log(`   Market cap formatted: $${marketCap.toFixed(2)}`)
          
          currentPrice.value = marketCap
          expectedPrice.value = marketCap
          
          console.log(`💰 Updated currentPrice to: $${currentPrice.value.toFixed(2)}`)
        }
      }
      
      // Update chart series if they exist
      if (candlestickSeries.value && volumeSeries.value) {
        console.log('🎯 About to set chart data...')
        console.log('  Candle data sample:', chartData.candleData.slice(0, 2))
        console.log('  Volume data sample:', chartData.volumeData.slice(0, 2))
        
        candlestickSeries.value.setData(chartData.candleData)
        volumeSeries.value.setData(chartData.volumeData)
        
        console.log('✅ Chart data set successfully')
        
        // Force chart to fit content to the new data range
        setTimeout(() => {
          if (chart.value) {
            chart.value.timeScale().fitContent()
            
            // Force price scale to show proper range
            const priceScale = chart.value.priceScale('right')
            if (priceScale && chartData.candleData.length > 0) {
              const allPrices = chartData.candleData.flatMap(candle => [candle.open, candle.high, candle.low, candle.close])
              const minPrice = Math.min(...allPrices)
              const maxPrice = Math.max(...allPrices)
              const padding = (maxPrice - minPrice) * 0.1 // 10% padding
              
              console.log(`📈 Setting price range: ${(minPrice - padding).toFixed(2)} - ${(maxPrice + padding).toFixed(2)}`)
              
              // Apply automatic scaling with some padding
              priceScale.applyOptions({
                autoScale: true,
                scaleMargins: {
                  top: 0.1,
                  bottom: 0.1,
                },
              })
            }
            
            // Final verification: check what's displayed on chart
            console.log('🎯 FINAL VERIFICATION - Chart state after data update:')
            try {
              const visibleRange = chart.value.timeScale().getVisibleRange()
              console.log('  Visible time range:', visibleRange)
              
              // Get the price scale
              const priceScale = chart.value.priceScale('right')
              console.log('  Price scale:', priceScale)
              
              // Get visible logical range for more details
              const logicalRange = chart.value.timeScale().getVisibleLogicalRange()
              console.log('  Logical range:', logicalRange)
              
              // Check series options
              const seriesOptions = candlestickSeries.value.options()
              console.log('  Series options:', seriesOptions)
              
              console.log('🎯 CHART VERIFICATION COMPLETE')
            } catch (error) {
              console.log('  Error checking chart state:', error)
            }
          }
        }, 200)
        
        console.log('📈 Chart series updated with real transaction data')
      }
      
      console.log('📈 Chart data updated with real transaction data')
      console.log('✅ Chart ready to display!')
      
      // Mark loading as complete since we have data
      isChartLoading.value = false
    } else {
      console.log('⚠️ No valid chart data from transactions - showing empty chart')
      // No fallback - show empty chart if no real transactions
      chartCandleData.value = []
      chartVolumeData.value = []
      hasChartData.value = false
      
      // Update chart series if they exist
      if (candlestickSeries.value && volumeSeries.value) {
        candlestickSeries.value.setData([])
        volumeSeries.value.setData([])
        console.log('📈 Chart series cleared - no real data')
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to load transaction data:', error)
    transactionDataError.value = error.message
    
    // No fallback - show empty chart on error
    chartCandleData.value = []
    chartVolumeData.value = []
    hasChartData.value = false
    
    // Update chart series if they exist
    if (candlestickSeries.value && volumeSeries.value) {
      candlestickSeries.value.setData([])
      volumeSeries.value.setData([])
      console.log('📈 Chart series cleared - error loading real data')
    }
  } finally {
    isTransactionDataLoading.value = false
  }
}

// New: Convert transaction data to chart data (REAL TRANSACTIONS ONLY)
const convertTransactionsToChartData = (transactions) => {
  if (!transactions || transactions.length === 0) {
    console.log('⚠️ No transactions provided - returning empty data')
    return { candleData: [], volumeData: [] }
  }

  console.log('🔄 Converting REAL transactions to chart data...')
  console.log(`📊 Processing ${transactions.length} real transactions`)

  // Sort transactions by timestamp (oldest first for chart)
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  
  // Calculate market cap progression based on real transactions
  const TOTAL_SUPPLY = 1000000000000 // 1 trillion tokens (1T)
  let currentMarketCap = calculatedMarketCap.value.marketCapUSD > 0 ? calculatedMarketCap.value.marketCapUSD : 0 // Use API market cap or 0
  
  const candleData = []
  const volumeData = []
  
  // Group transactions by timeframe intervals
  const timeframeMinutes = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1h': 60,
    '4h': 240,
    '1d': 1440
  }
  const intervalMs = (timeframeMinutes[selectedTimeframe.value] || 1) * 60 * 1000
  
  // Create time intervals from first to last transaction
  const firstTransactionTime = new Date(sortedTransactions[0].timestamp).getTime()
  const lastTransactionTime = new Date(sortedTransactions[sortedTransactions.length - 1].timestamp).getTime()
  
  console.log(`📊 Time range: ${new Date(firstTransactionTime).toISOString()} to ${new Date(lastTransactionTime).toISOString()}`)
  console.log(`📊 Interval: ${selectedTimeframe.value} (${intervalMs / 60000} minutes)`)

  // Process each time interval
  for (let time = firstTransactionTime; time <= lastTransactionTime; time += intervalMs) {
    const timestamp = Math.floor(time / 1000)
    
    // Find transactions in this time interval
    const intervalStart = time
    const intervalEnd = time + intervalMs
    const transactionsInInterval = sortedTransactions.filter(transaction => {
      const transactionTime = new Date(transaction.timestamp).getTime()
      return transactionTime >= intervalStart && transactionTime < intervalEnd
    })

    // Only create candle if we have real transactions in this interval
    if (transactionsInInterval.length === 0) {
      console.log(`⏭️ Skipping interval ${new Date(time).toLocaleTimeString()} - no transactions`)
      continue
    }

    console.log(`📈 Processing interval ${new Date(time).toLocaleTimeString()} with ${transactionsInInterval.length} transactions`)

    // Calculate market cap impact for this interval
    let intervalMarketCapChange = 0
    let totalVolume = 0
    
    transactionsInInterval.forEach(transaction => {
      const solAmount = parseFloat(transaction.amount_sol || 0)
      totalVolume += solAmount
      
      // Calculate market cap change based on transaction type and amount
      // Using bonding curve formula: Market Cap = Total Supply × Price × SOL Price USD
      if (transaction.type === 'buy') {
        // Buy increases market cap (more SOL in bonding curve = higher price)
        // Simplified calculation: each SOL added increases price proportionally
        const priceIncrease = solAmount / TOTAL_SUPPLY // Price increase per SOL
        const marketCapIncrease = TOTAL_SUPPLY * priceIncrease * 167 // SOL price USD
        intervalMarketCapChange += marketCapIncrease
      } else if (transaction.type === 'sell') {
        // Sell decreases market cap (less SOL in bonding curve = lower price)
        const priceDecrease = solAmount / TOTAL_SUPPLY // Price decrease per SOL
        const marketCapDecrease = TOTAL_SUPPLY * priceDecrease * 167 // SOL price USD
        intervalMarketCapChange -= marketCapDecrease
      }
    })

    // Calculate OHLC based on real market cap progression
    const open = currentMarketCap
    const close = currentMarketCap + intervalMarketCapChange
    
    // Create realistic high/low based on transaction volatility
    const volatility = Math.abs(intervalMarketCapChange) * 0.1 // 10% of price change as volatility
    const high = Math.max(open, close) + volatility
    const low = Math.min(open, close) - volatility
    
    // Update current market cap for next interval
    currentMarketCap = close

    console.log(`💰 Market cap: $${open.toFixed(2)} → $${close.toFixed(2)} (change: ${intervalMarketCapChange > 0 ? '+' : ''}${intervalMarketCapChange.toFixed(2)})`)

    candleData.push({ 
      time: timestamp, 
      open: parseFloat(open.toFixed(2)), 
      high: parseFloat(high.toFixed(2)), 
      low: parseFloat(low.toFixed(2)), 
      close: parseFloat(close.toFixed(2)) 
    })
    
    volumeData.push({ 
      time: timestamp, 
      value: parseFloat(totalVolume.toFixed(2)), 
      color: close > open ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)' // Green if up, red if down
    })
  }

  console.log(`✅ Created ${candleData.length} REAL candles from ${transactions.length} transactions`)
  console.log('📈 Final market cap:', currentMarketCap.toFixed(2))
  console.log('📈 Sample candle data:', candleData.slice(0, 3))
  console.log('📊 Sample volume data:', volumeData.slice(0, 3))
  
  return { candleData, volumeData }
}

// New: Group transactions by time intervals
const groupTransactionsByTime = (transactions, timeframe) => {
  const groups = {}
  
  // Use shorter intervals to make candles closer together
  const timeframeMinutes = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1h': 60,
    '4h': 240,
    '1d': 60 // Use 1-hour intervals for daily view to make candles closer
  }
  
  const intervalMinutes = timeframeMinutes[timeframe] || 1
  
  transactions.forEach(transaction => {
    const timestamp = new Date(transaction.timestamp)
    // Round down to the nearest interval
    const timeKey = Math.floor(timestamp.getTime() / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000)
    
    if (!groups[timeKey]) {
      groups[timeKey] = []
    }
    groups[timeKey].push(transaction)
  })
  
  // Sort groups by time key
  const sortedGroups = {}
  Object.keys(groups)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(key => {
      sortedGroups[key] = groups[key]
    })
  
  return sortedGroups
}

async function buyToken() {
  try {
    // Set loading state
    isTransactionPending.value = true
    
    // Validate inputs
    if (!tradeAmount.value || parseFloat(tradeAmount.value) <= 0) {
      alert('Please enter a valid amount to buy');
      isTransactionPending.value = false
      return;
    }

    if (!window.solana || !window.solana.isPhantom) {
      alert('Phantom wallet not found! Please install Phantom wallet.');
      isTransactionPending.value = false
      return;
    }

    // Connect wallet
    await window.solana.connect();

    const mintAddress = tokenInfo.value.mintAddress || route.params.mint_address;
    if (!mintAddress) {
      alert('Token mint address not found');
      return;
    }

    let solAmount = parseFloat(tradeAmount.value);
    // For buy: use market cap USD, for sell: use price per token SOL
    const currentExpectedPrice = expectedPrice.value || currentPrice.value;
    const currentSlippage = slippage.value || 5;
    
    // If user entered token amount, convert to SOL amount
    if (tradeCurrency.value === 'TOKENS') {
      // Convert tokens to SOL: SOL = tokens * price_per_token
      const pricePerTokenSOL = calculatedMarketCap.value.priceSOL || 0.000000035; // Default fallback
      solAmount = parseFloat(tradeAmount.value) * pricePerTokenSOL;
      console.log(`🔄 Converting ${parseFloat(tradeAmount.value)} tokens to ${solAmount} SOL at price ${pricePerTokenSOL} SOL per token`);
    }

    console.log('Buying tokens:', {
      mintAddress,
      originalAmount: parseFloat(tradeAmount.value),
      currency: tradeCurrency.value,
      solAmount: solAmount,
      expectedPrice: currentExpectedPrice,
      slippage: currentSlippage
    });

    // Send request to buy API endpoint
    const response = await fetch(`https://launchpad-wl8n.onrender.com/api/token/buy/${mintAddress}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: solAmount, // Send SOL amount to API
        expectedPrice: currentExpectedPrice,
        slippage: currentSlippage,
        userAddress: window.solana.publicKey.toString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    
    if (!responseData.success) {
      alert('Error: ' + (responseData.message || 'Failed to process buy request'));
      isTransactionPending.value = false
      return;
    }

    console.log('Server response:', responseData);

    // Extract transaction from response
    const { transaction, transactionDetails } = responseData.data;
    
    if (!transaction) {
      throw new Error('No transaction received from server');
    }

    // Import Solana web3.js and Buffer
    const { Transaction, Connection, clusterApiUrl } = await import('@solana/web3.js');
    const { Buffer } = await import('buffer');
    
    // Create connection
    const connection = new Connection(clusterApiUrl('devnet'));
    
    // 1. Десериализовать транзакцию
    const tx = Transaction.from(Buffer.from(transaction, 'base64'));

    console.log('Transaction details:', {
      amount: transactionDetails.amount,
      solAmount: transactionDetails.solAmount,
      currentPrice: transactionDetails.currentPrice,
      expectedPrice: transactionDetails.expectedPrice,
      slippage: transactionDetails.slippage,
      minTokensToReceive: transactionDetails.minTokensToReceive
    });

    // Transaction is already prepared by backend (feePayer and blockhash set)
    console.log('🔧 Transaction prepared by backend:', {
      feePayer: tx.feePayer?.toString(),
      recentBlockhash: tx.recentBlockhash
    });

    // ИСПРАВЛЕНИЕ: Установить правильные isSigner флаги для BUY операций
    console.log('🔧 Fixing isSigner flags for BUY operation...');
    const instruction = tx.instructions[0];
    if (instruction.keys.length >= 3) {
      // fee_receiver (индекс 2) не должен быть подписантом для BUY операций
      instruction.keys[2].isSigner = false;
      console.log('✅ Fixed fee_receiver isSigner flag:', instruction.keys[2].isSigner);
    }

    // Get fresh blockhash before sending transaction
    console.log('🔄 Getting fresh blockhash...');
    const latestBlockhash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    console.log('✅ Fresh blockhash set:', latestBlockhash.blockhash);

    // Sign transaction with Phantom
    const signedTx = await window.solana.signTransaction(tx);
    
    // Send transaction
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    
    console.log('Transaction sent:', signature);
    
    // Confirm transaction
    await connection.confirmTransaction(signature);
    
    
    // Clear the input
    tradeAmount.value = '';
    
    // Refresh token data and top holders after successful transaction
    const mintAddressParam = route.params.mint_address;
    if (mintAddressParam) {
      console.log('🔄 Refreshing data after successful buy transaction...')
      await loadTokenData(mintAddressParam);
      await loadMarketCapData(mintAddressParam);
      await loadTopHoldersData(mintAddressParam);
      console.log('✅ Data refreshed after buy transaction')
    }

  } catch (error) {
    console.error('Error buying tokens:', error);
    
    // More detailed error messages
    let errorMessage = 'Unknown error occurred';
    
    if (error.message.includes('User rejected')) {
      errorMessage = 'Transaction was cancelled by user';
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient SOL balance';
    } else if (error.message.includes('slippage')) {
      errorMessage = 'Price moved too much (slippage exceeded)';
    } else {
      errorMessage = error.message;
    }
    
    alert('❌ Error buying tokens: ' + errorMessage);
  } finally {
    // Reset loading state
    isTransactionPending.value = false
  }
}

async function sellToken() {
  try {
    // Set loading state
    isTransactionPending.value = true
    
    // Validate inputs
    if (!tradeAmount.value || parseFloat(tradeAmount.value) <= 0) {
      alert('Please enter a valid amount to sell');
      isTransactionPending.value = false
      return;
    }

    if (!window.solana || !window.solana.isPhantom) {
      alert('Phantom wallet not found! Please install Phantom wallet.');
      isTransactionPending.value = false
      return;
    }

    // Connect wallet
    await window.solana.connect();

    const mintAddress = tokenInfo.value.mintAddress || route.params.mint_address;
    if (!mintAddress) {
      alert('Token mint address not found');
      return;
    }

    let tokenAmount = parseFloat(tradeAmount.value);
    const currentSlippage = slippage.value || 5;
    
    // Get the correct price per token in SOL (not market cap)
    const pricePerTokenSOL = calculatedMarketCap.value.priceSOL || 0.000000035; // Default fallback
    
    // If user entered SOL amount, convert to token amount
    if (tradeCurrency.value === 'SOL') {
      // Convert SOL to tokens: tokens = SOL / price_per_token
      tokenAmount = parseFloat(tradeAmount.value) / pricePerTokenSOL;
      console.log(`🔄 Converting ${parseFloat(tradeAmount.value)} SOL to ${tokenAmount} tokens at price ${pricePerTokenSOL} SOL per token`);
    }

    console.log('Selling tokens:', {
      mintAddress,
      originalAmount: parseFloat(tradeAmount.value),
      currency: tradeCurrency.value,
      tokenAmount: tokenAmount,
      expectedPriceSOL: pricePerTokenSOL, // Use price per token in SOL
      slippage: currentSlippage
    });

    // Send request to sell API endpoint
    const response = await fetch(`https://launchpad-wl8n.onrender.com/api/token/sell/${mintAddress}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: tokenAmount, // Send token amount to API
        expectedPrice: pricePerTokenSOL, // Send price per token in SOL, not market cap
        slippage: currentSlippage,
        userAddress: window.solana.publicKey.toString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    
    if (!responseData.success) {
      alert('Error: ' + (responseData.message || 'Failed to process sell request'));
      isTransactionPending.value = false
      return;
    }

    console.log('Server response:', responseData);

    // Extract transaction from response
    const { transaction, transactionDetails } = responseData.data;
    
    if (!transaction) {
      throw new Error('No transaction received from server');
    }

    // Import Solana web3.js and Buffer
    const { Transaction, Connection, clusterApiUrl } = await import('@solana/web3.js');
    const { Buffer } = await import('buffer');
    
    // Create connection
    const connection = new Connection(clusterApiUrl('devnet'));
    
    // 1. Десериализовать транзакцию
    const tx = Transaction.from(Buffer.from(transaction, 'base64'));

    console.log('Transaction details:', {
      amount: transactionDetails.amount,
      solAmount: transactionDetails.solAmount,
      currentPrice: transactionDetails.currentPrice,
      expectedPrice: transactionDetails.expectedPrice,
      slippage: transactionDetails.slippage,
      minSolToReceive: transactionDetails.minSolToReceive,
      pricePerTokenSOL: pricePerTokenSOL
    });

    // Transaction is already prepared by backend (feePayer and blockhash set)
    console.log('🔧 Transaction prepared by backend:', {
      feePayer: tx.feePayer?.toString(),
      recentBlockhash: tx.recentBlockhash
    });

    // Get fresh blockhash before sending transaction
    console.log('🔄 Getting fresh blockhash...');
    const latestBlockhash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    console.log('✅ Fresh blockhash set:', latestBlockhash.blockhash);

    // Sign transaction with Phantom
    const signedTx = await window.solana.signTransaction(tx);
    
    // Send transaction
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    
    console.log('Transaction sent:', signature);
    
    // Confirm transaction
    await connection.confirmTransaction(signature);
    
    
    // Clear the input
    tradeAmount.value = '';
    
    // Refresh token data and top holders after successful transaction
    const mintAddressParam = route.params.mint_address;
    if (mintAddressParam) {
      console.log('🔄 Refreshing data after successful sell transaction...')
      await loadTokenData(mintAddressParam);
      await loadMarketCapData(mintAddressParam);
      await loadTopHoldersData(mintAddressParam);
      console.log('✅ Data refreshed after sell transaction')
    }

  } catch (error) {
    console.error('Error selling tokens:', error);
    
    // More detailed error messages
    let errorMessage = 'Unknown error occurred';
    
    if (error.message.includes('User rejected')) {
      errorMessage = 'Transaction was cancelled by user';
    } else if (error.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient token balance';
    } else if (error.message.includes('slippage')) {
      errorMessage = 'Price moved too much (slippage exceeded)';
    } else {
      errorMessage = error.message;
    }
    
    alert('❌ Error selling tokens: ' + errorMessage);
  } finally {
    // Reset loading state
    isTransactionPending.value = false
  }
}

// Lifecycle
onMounted(async () => {
  console.log('🚀 Component mounted, starting initialization...')
  await nextTick()
  
  // Add click outside listener for currency dropdown
  document.addEventListener('click', (event) => {
    const tokenSelector = document.querySelector('.token-selector')
    if (tokenSelector && !tokenSelector.contains(event.target)) {
      showCurrencyDropdown.value = false
    }
  })
  
  // Load token data from API if mint_address is provided in route params
  const mintAddress = route.params.mint_address
  if (mintAddress) {
    console.log('📡 Loading token data for mint:', mintAddress)
    await loadTokenData(mintAddress)
    
    console.log('💰 Loading market cap data for mint:', mintAddress)
    // Load market cap data from API first
    await loadMarketCapData(mintAddress)
    
    console.log('📊 Loading transaction data for mint:', mintAddress)
    // Load transaction data from database
    await loadTransactionData(mintAddress)
    
    console.log('👥 Loading top holders data for mint:', mintAddress)
    // Load top holders data from API
    await loadTopHoldersData(mintAddress)
    
    console.log('🔌 Connecting to WebSocket for token events:', mintAddress)
    // Connect to WebSocket for real-time token events
    connectWebSocket(mintAddress)
  }
  
  console.log('📈 Chart data status:', {
    hasChartData: hasChartData.value,
    candleDataLength: chartCandleData.value.length,
    isChartLoading: isChartLoading.value
  })
  
  // Ensure we have chart data before initializing
  if (hasChartData.value && chartCandleData.value.length > 0) {
    console.log('✅ Chart data ready, initializing chart...')
    
    // Wait for DOM to be fully ready
    await nextTick()
    
    // Add small delay to ensure DOM is rendered
    setTimeout(() => {
      initializeChart()
      isChartLoading.value = false
    }, 100)
  } else {
    console.log('⚠️ No chart data available initially - waiting for WebSocket data or showing "No data here"')
    // No data initially - show empty chart with "No data here" message
    // But don't set hasChartData to false yet, as WebSocket might bring data
    chartCandleData.value = []
    chartVolumeData.value = []
    
    await nextTick()
    setTimeout(() => {
      initializeChart()
      isChartLoading.value = false
    }, 100)
  }
  
  // Update current price from latest candle
  if (chartCandleData.value.length > 0) {
    const latestCandle = chartCandleData.value[chartCandleData.value.length - 1]
    currentPrice.value = latestCandle.close
    // Set initial expected price to current price
    if (expectedPrice.value === 0) {
      expectedPrice.value = latestCandle.close
    }
  }
  
  if (chartVolumeData.value.length > 0) {
    const latestVolume = chartVolumeData.value[chartVolumeData.value.length - 1]
    currentVolume.value = latestVolume.value
  }
})

onUnmounted(() => {
  // Clean up chart and resize observer
  if (chart.value) {
    if (chart.value._resizeObserver) {
      chart.value._resizeObserver.disconnect()
    }
    chart.value.remove()
  }
  
  // Disconnect WebSocket
  disconnectWebSocket()
})
</script>

<style scoped>
.token-chart-page {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
  background: #0f0f23;
  min-height: 100vh;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s ease;
}

.back-btn:hover {
  color: #ffffff;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.token-avatar {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.token-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.token-details {
  flex: 1;
}

.token-name {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
}

.token-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #9ca3af;
}

.created-info {
  color: #10b981;
}

.websocket-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.websocket-status.connected {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.websocket-status.disconnected {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.websocket-error {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
}

.websocket-error .error-text {
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
}

.websocket-error .retry-btn {
  padding: 4px 8px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 4px;
  color: #ef4444;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.websocket-error .retry-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

/* Loading and Error States */
.loading-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-left-color: #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #9ca3af;
  font-size: 14px;
}

.error-container {
  padding: 20px;
}

.error-text {
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Main Content Layout - Enlarged Chart */
.main-content {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  margin-bottom: 32px;
}

.chart-section {
  min-width: 0; /* Prevents grid overflow */
}

.chart-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.chart-left-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chart-right-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.timeframe-buttons {
  display: flex;
  gap: 2px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 2px;
}

.timeframe-btn {
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 28px;
  text-align: center;
}

.timeframe-btn.active {
  background: #42b883;
  color: #ffffff;
}

.timeframe-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.chart-display-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn.active {
  background: rgba(66, 184, 131, 0.15);
  color: #42b883;
  border-color: rgba(66, 184, 131, 0.3);
}

.control-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.chart-type-buttons {
  display: flex;
  gap: 2px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 2px;
}

.chart-type-btn {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.chart-type-btn.active {
  background: #42b883;
  color: #ffffff;
}

.chart-type-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.price-info {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.current-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-label-section {
  flex: 1;
}

.price-label {
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.4;
}

.price-stats {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-left: 8px;
  font-size: 12px;
}

.stat-value {
  color: #ffffff;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', monospace;
  margin-left: 4px;
}

.stat-value.high {
  color: #10b981;
}

.stat-value.low {
  color: #ef4444;
}

.price-change-pct {
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.price-change-pct.positive {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
}

.price-change-pct.negative {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}

.volume-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.volume-label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 2px;
}

.volume-value {
  font-size: 14px;
  color: #ffffff;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', monospace;
}

.hovered-time {
  font-size: 12px;
  color: #42b883;
  font-weight: 600;
  margin-top: 4px;
  display: block;
  background: rgba(66, 184, 131, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.price-data {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-changes {
  display: flex;
  gap: 12px;
  align-items: center;
}

.price-value {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Monaco', 'Menlo', monospace;
}

.price-change {
  font-size: 14px;
  font-weight: 600;
}

.price-change-vs-prev {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
}

.price-change.positive,
.price-change-vs-prev.positive {
  color: #10b981;
}

.price-change.negative,
.price-change-vs-prev.negative {
  color: #ef4444;
}

.volume-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.volume-label {
  font-size: 12px;
  color: #9ca3af;
}

.volume-data {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.volume-value {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.volume-change {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
}

.volume-change.positive {
  color: #10b981;
}

.volume-change.negative {
  color: #ef4444;
}

.ohlc-data {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.ohlc-row {
  display: flex;
  gap: 16px;
}

.ohlc-item {
  display: flex;
  gap: 4px;
  align-items: center;
}

.ohlc-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
  min-width: 15px;
}

.ohlc-value {
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  font-family: 'Monaco', 'Menlo', monospace;
}

.ohlc-value.high {
  color: #10b981;
}

.ohlc-value.low {
  color: #ef4444;
}

.ohlc-value.positive {
  color: #10b981;
}

.ohlc-value.negative {
  color: #ef4444;
}

/* Professional Trading Metrics */
.trading-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius:  6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.metric-label {
  font-size: 10px;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 10px;
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', monospace;
}

.metric-value.positive {
  color: #10b981;
}

.metric-value.negative {
  color: #ef4444;
}

.metric-value.neutral {
  color: #60a5fa;
}

.chart-wrapper {
  position: relative;
  height: 500px;
  background: linear-gradient(135deg, #0a0a1a 0%, #0f0f23 100%);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.chart-canvas {
  width: 100%;
  height: 100%;
  cursor: crosshair;
  transition: all 0.3s ease;
}

.chart-canvas:hover {
  transform: scale(1.001);
}

.chart-canvas:active {
  cursor: grabbing;
}

.chart-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 10;
}

/* No Data State (pump.fun style) */
.no-data-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  z-index: 10;
}

.no-data-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  opacity: 0.6;
}

.no-data-icon {
  color: #4b5563;
  width: 80px;
  height: 80px;
  margin-bottom: 8px;
}

.no-data-title {
  color: #9ca3af;
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

.no-data-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
  font-weight: 400;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(66, 184, 131, 0.2);
  border-top: 3px solid #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chart-tooltip {
  position: absolute;
  background: rgba(26, 27, 35, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  pointer-events: none;
  z-index: 10;
  min-width: 140px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tooltip-time {
  font-size: 12px;
  color: #42b883;
  font-weight: 600;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 4px;
}

.tooltip-ohlc {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.ohlc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ohlc-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}

.ohlc-value {
  font-size: 11px;
  color: #ffffff;
  font-family: 'Monaco', 'Menlo', monospace;
}

.tooltip-volume {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 4px;
}

/* Right Sidebar - Same Height as Chart */
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: fit-content;
}

.trading-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
}

.trading-tabs {
  display: flex;
  gap: 2px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 16px;
}

.trade-tab {
  flex: 1;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.trade-tab.active {
  background: #42b883;
  color: #ffffff;
}

.trading-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.balance-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.balance-label {
  color: #9ca3af;
}

.balance-value {
  color: #ffffff;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', monospace;
}

.max-btn {
  padding: 4px 8px;
  background: rgba(66, 184, 131, 0.1);
  border: 1px solid rgba(66, 184, 131, 0.3);
  border-radius: 4px;
  color: #42b883;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.max-btn:hover {
  background: rgba(66, 184, 131, 0.2);
}

.trade-input-section {
  margin-bottom: 20px;
}

.trade-amount {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.amount-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  outline: none;
}

.amount-input::placeholder {
  color: #6b7280;
}

.token-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.token-selector:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* Currency dropdown styles */
.currency-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(26, 27, 35, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  margin-top: 4px;
  min-width: 120px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: #ffffff;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.currency-symbol {
  font-weight: 600;
  font-size: 14px;
  color: #42b883;
}

.currency-name {
  font-size: 12px;
  color: #9ca3af;
}

/* Expected Price Styles */
.trade-price {
  margin-bottom: 12px;
}

.price-label {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
  font-weight: 500;
}

.price-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  font-family: 'Monaco', 'Menlo', monospace;
}

.price-input::placeholder {
  color: #6b7280;
}

.price-input:focus {
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.1);
}

/* Slippage Styles */
.trade-slippage {
  margin-bottom: 16px;
}

.slippage-label {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
  font-weight: 500;
}

.slippage-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.slippage-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  max-width: 80px;
}

.slippage-input::placeholder {
  color: #6b7280;
}

.slippage-input:focus {
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.1);
}

.slippage-presets {
  display: flex;
  gap: 4px;
}

.slippage-preset {
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slippage-preset.active {
  background: #42b883;
  color: #ffffff;
  border-color: #42b883;
}

.slippage-preset:hover:not(.active) {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.place-trade-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.place-trade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.place-trade-btn:disabled:hover {
  transform: none !important;
}

.place-trade-btn.buy {
  background: #10b981;
}

.place-trade-btn.buy:hover {
  background: #059669;
  transform: translateY(-1px);
}

.place-trade-btn.sell {
  background: #ef4444;
}

.place-trade-btn.sell:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* Transaction loading styles */
.transaction-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.place-trade-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

.place-trade-btn:disabled:hover {
  transform: none !important;
}

.trade-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-label {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #42b883 0%, #10b981 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-description {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.action-btn.watchlist:hover {
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.action-btn.twitter:hover {
  border-color: rgba(29, 161, 242, 0.3);
  color: #1da1f2;
}

.contract-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contract-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.contract-label {
  color: #6b7280;
}

.contract-value {
  color: #ffffff;
  font-family: 'Monaco', 'Menlo', monospace;
}

.contract-link {
  color: #42b883;
  cursor: pointer;
  text-decoration: none;
}

.contract-link:hover {
  text-decoration: underline;
}

.copy-icon,
.external-icon {
  cursor: pointer;
  transition: color 0.2s ease;
}

.copy-icon:hover,
.external-icon:hover {
  color: #ffffff;
}

.top-holders-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
}

.top-holders-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}



.holders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.holders-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.bubble-map-btn {
  padding: 6px 12px;
  background: rgba(100, 108, 255, 0.1);
  border: 1px solid rgba(100, 108, 255, 0.3);
  border-radius: 6px;
  color: #646cff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bubble-map-btn:hover {
  background: rgba(100, 108, 255, 0.2);
}

.holders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.holder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
}

.holder-rank {
  color: #6b7280;
  font-weight: 500;
  min-width: 20px;
}

.holder-type {
  color: #ffffff;
  flex: 1;
}

.holder-type.bonding-curve {
  color: #42b883;
  font-weight: 600;
}

.holder-percentage {
  color: #42b883;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* Token Info and Top Holders Main Content */
.token-info-main-content {
  display: grid;
  grid-template-columns: 70% 30%;
  gap: 7px;
  margin-bottom: 32px;
}

/* Token Description Section */
.token-description-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
}

.token-description-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.token-large-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.token-description-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.token-header-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-direction: column;
}

.token-image-section {
  flex-shrink: 0;
}

.token-large-image {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.token-info-text {
  flex: 1;
  min-width: 0;
}

.token-description {
  margin-bottom: 0;
}

.token-description {
  margin-bottom: 8px;
}

.description-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
  line-height: 1.2;
}

.description-text {
  font-size: 16px;
  color: #d1d5db;
  line-height: 1.7;
  text-align: justify;
}

.social-links-section {
  margin-bottom: 8px;
}

.social-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 16px;
}

.social-links-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #ffffff;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.social-link.website:hover {
  border-color: rgba(100, 108, 255, 0.5);
  box-shadow: 0 8px 16px rgba(100, 108, 255, 0.2);
}

.social-link.twitter:hover {
  border-color: rgba(29, 161, 242, 0.5);
  box-shadow: 0 8px 16px rgba(29, 161, 242, 0.2);
}

.social-link.telegram:hover {
  border-color: rgba(0, 136, 204, 0.5);
  box-shadow: 0 8px 16px rgba(0, 136, 204, 0.2);
}

.social-link.discord:hover {
  border-color: rgba(114, 137, 218, 0.5);
  box-shadow: 0 8px 16px rgba(114, 137, 218, 0.2);
}

.social-link.github:hover {
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 16px rgba(255, 255, 255, 0.1);
}

.social-link.medium:hover {
  border-color: rgba(0, 171, 107, 0.5);
  box-shadow: 0 8px 16px rgba(0, 171, 107, 0.2);
}

.external-link-icon {
  margin-left: auto;
  opacity: 0.7;
}

.token-stats-section {
  margin-bottom: 0;
}

.stats-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.stat-label {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  color: #ffffff;
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* Trades Section - Inside Token Description */
.trades-section {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}

.trades-header {
  margin-bottom: 20px;
}

.trades-tabs {
  display: flex;
  gap: 2px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 16px;
  width: fit-content;
}

.trades-tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trades-tab.active {
  background: #42b883;
  color: #ffffff;
}

.trades-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #9ca3af;
}

.filter-toggle {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
}

.filter-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.1);
  transition: 0.2s;
  border-radius: 18px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: #6b7280;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #42b883;
}

input:checked + .toggle-slider:before {
  transform: translateX(14px);
  background-color: #ffffff;
}

.filter-label {
  color: #ffffff;
  font-weight: 500;
}

.size-input {
  width: 60px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #ffffff;
  font-size: 11px;
  outline: none;
}

.size-note,
.following-note,
.own-trades-note {
  color: #6b7280;
  font-style: italic;
}

.trades-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.header-cell {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  text-transform: lowercase;
}

.table-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.trade-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr;
  gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.trade-cell {
  font-size: 14px;
  color: #ffffff;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-avatar {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.account-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-name {
  color: #42b883;
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', monospace;
}

.trade-type {
  font-weight: 600;
  text-transform: lowercase;
}

.trade-type.buy {
  color: #10b981;
}

.trade-type.sell {
  color: #ef4444;
}

.warning-icon {
  color: #fbbf24;
  margin-left: 4px;
}

.transaction-link {
  color: #646cff;
  text-decoration: none;
  font-family: 'Monaco', 'Menlo', monospace;
}

.transaction-link:hover {
  text-decoration: underline;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.page-info {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
}

.trades-count {
  font-size: 12px;
  color: #6b7280;
}

/* Loading and error states for trades */
.loading-trades {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #9ca3af;
  font-size: 14px;
}

.error-trades {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  text-align: center;
}

.error-trades .error-text {
  color: #ef4444;
  font-size: 14px;
  font-weight: 500;
}

/* No trades available state */
.no-trades-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
}

.no-trades-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  opacity: 0.7;
}

.no-trades-text {
  color: #9ca3af;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.no-trades-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
  font-weight: 400;
}

/* Loading and error states for top holders */
.loading-holders {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #9ca3af;
  font-size: 12px;
}

.error-holders {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
}

.error-holders .error-text {
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
}

.retry-btn {
  padding: 8px 16px;
  background: rgba(66, 184, 131, 0.1);
  border: 1px solid rgba(66, 184, 131, 0.3);
  border-radius: 6px;
  color: #42b883;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: rgba(66, 184, 131, 0.2);
  transform: translateY(-1px);
}

/* Top holders updating animation styles */
.holders-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.updating-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  font-size: 12px;
  font-weight: 500;
}

.updating-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.holder-item {
  transition: all 0.3s ease;
}

.holder-item.updated {
  background-color: rgba(16, 185, 129, 0.1);
  border-left: 3px solid #10b981;
  transform: translateX(4px);
}

/* Mobile Styles */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr 320px;
  }
  

  
  .token-header-layout {
    gap: 20px;
  }
  
  .token-large-image {
    width: 100px;
    height: 100px;
  }
  
  .description-title {
    font-size: 24px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .right-sidebar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .token-info-main-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .chart-wrapper {
    height: 400px;
  }
  
  .token-header-layout {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
  }
  
  .token-large-image {
    width: 150px;
    height: 150px;
  }
  
  .description-title {
    font-size: 26px;
  }
  
  .social-links-grid {
    gap: 6px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

@media (max-width: 768px) {
  .token-chart-page {
    padding: 16px;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .token-info {
    width: 100%;
  }
  
  .token-name {
    font-size: 20px;
  }
  
  .token-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .chart-controls {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .chart-wrapper {
    height: 300px;
  }
  
  .right-sidebar {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  

  
  .token-description-section {
    padding: 20px;
  }
  
  .top-holders-section {
    padding: 16px;
  }
  
  .token-header-layout {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }
  
  .token-large-image {
    width: 120px;
    height: 120px;
  }
  
  .description-title {
    font-size: 22px;
  }
  
  .description-text {
    font-size: 15px;
  }
  
  .social-title,
  .stats-title {
    font-size: 16px;
  }
  
  .social-links-grid {
    gap: 4px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }
  
  .stat-item {
    padding: 12px;
  }
  
  .stat-value {
    font-size: 16px;
  }
  
  .table-header,
  .trade-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .trade-cell {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
  }
  
  .trade-cell:before {
    content: attr(data-label);
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
  
  .pagination {
    flex-direction: column;
    gap: 12px;
  }
  
  .pagination-info {
    order: -1;
  }
}

@media (max-width: 480px) {
  
  .token-description-section {
    padding: 16px;
  }
  
  .top-holders-section {
    padding: 12px;
  }
  
  .token-large-image {
    width: 140px;
    height: 140px;
  }
  
  .description-title {
    font-size: 18px;
  }
  
  .description-text {
    font-size: 14px;
  }
  
  .social-title,
  .stats-title {
    font-size: 15px;
  }
  
  .social-link {
    padding: 4px 8px;
    font-size: 11px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    padding: 10px;
  }
  
  .stat-value {
    font-size: 14px;
  }
}
</style>