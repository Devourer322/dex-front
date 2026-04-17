<template>
  <div class="create-token-page">
    <div class="create-token-container">
      <div class="page-header">
        <h1 class="page-title">create new coin</h1>
      </div>

      <div class="form-section">
        <div class="section-header">
          <h2 class="section-title">coin details</h2>
          <p class="section-subtitle">choose carefully, these can't be changed once the coin is created</p>
        </div>

        <form @submit.prevent="createToken" class="token-form">
          <!-- Coin Name and Ticker -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">coin name</label>
              <input 
                v-model="formData.coinName"
                type="text" 
                placeholder="name your coin"
                class="form-input"
                required
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">ticker</label>
              <input 
                v-model="formData.ticker"
                type="text" 
                placeholder="add a coin ticker (e.g. DOGE)"
                class="form-input"
                required
              />
            </div>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label">description <span class="optional">(optional)</span></label>
            <textarea 
              v-model="formData.description"
              placeholder="write a short description"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <!-- Social Links -->
          <div class="social-links-section">
            <button 
              type="button"
              class="add-social-btn"
              @click="toggleSocialLinks"
            >
              <svg class="link-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              add social links <span class="optional">(optional)</span>
              <svg 
                :class="['dropdown-arrow', { 'rotated': showSocialLinks }]" 
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              >
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>

            <div v-if="showSocialLinks" class="social-inputs">
              <div class="form-group">
                <label class="form-label">website</label>
                <input 
                  v-model="formData.website"
                  type="url" 
                  placeholder="https://yourwebsite.com"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label">X</label>
                <input 
                  v-model="formData.twitter"
                  type="url" 
                  placeholder="https://x.com/youraccount"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label">telegram</label>
                <input 
                  v-model="formData.telegram"
                  type="url" 
                  placeholder="https://t.me/yourchannel"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <!-- Image Upload -->
          <div class="upload-section">
            <div class="upload-area" @click="triggerImageUpload" @dragover.prevent @drop.prevent="handleImageDrop">
              <input 
                ref="imageInput"
                type="file" 
                accept="image/*"
                @change="handleImageUpload"
                class="file-input"
              />
              
              <div v-if="!formData.image" class="upload-placeholder">
                <svg class="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                <h3 class="upload-title">select video or image to upload</h3>
                <p class="upload-subtitle">or drag and drop it here</p>
                <button type="button" class="select-file-btn">select file</button>
              </div>

              <div v-else class="image-preview">
                <img :src="formData.image" alt="Token image" class="preview-image" />
                <button type="button" @click.stop="removeImage" class="remove-image-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Upload Info -->
            <div class="upload-info">
              <div class="info-section">
                <svg class="info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <div class="info-content">
                  <h4 class="info-title">file size and type</h4>
                  <ul class="info-list">
                    <li>image - max 15mb, ".jpg", ".gif" or ".png" recommended</li>
                    <li>video - max 30mb, ".mp4" recommended</li>
                  </ul>
                </div>
              </div>

              <div class="info-section">
                <svg class="info-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                <div class="info-content">
                  <h4 class="info-title">resolution and aspect ratio</h4>
                  <ul class="info-list">
                    <li>image - min. 1000x1000px, 1:1 square recommended</li>
                    <li>video - 16:9 or 9:16, 1080p+ recommended</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Banner Upload -->
            <div class="banner-section">
              <button 
                type="button"
                class="add-banner-btn"
                @click="toggleBannerUpload"
              >
                <svg class="banner-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                add banner <span class="optional">(optional)</span>
                <svg 
                  :class="['dropdown-arrow', { 'rotated': showBannerUpload }]" 
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                >
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>

              <div v-if="showBannerUpload" class="banner-upload">
                <div class="banner-upload-area" @click="triggerBannerUpload" @dragover.prevent @drop.prevent="handleBannerDrop">
                  <input 
                    ref="bannerInput"
                    type="file" 
                    accept="image/*"
                    @change="handleBannerUpload"
                    class="file-input"
                  />
                  
                  <div v-if="!formData.banner" class="banner-placeholder">
                    <svg class="upload-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                    <p class="banner-text">select banner image</p>
                    <button type="button" class="select-banner-btn">select file</button>
                  </div>

                  <div v-else class="banner-preview">
                    <img :src="formData.banner" alt="Banner image" class="preview-banner" />
                    <button type="button" @click.stop="removeBanner" class="remove-banner-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Warning -->
          <div class="warning-section">
            <svg class="warning-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p class="warning-text">
              coin data (social links, banner, etc) can only be added now, and can't be changed or edited after creation
            </p>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="create-coin-btn" :disabled="!isFormValid || isCreating">
            {{ isCreating ? 'creating coin...' : 'create coin' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// Form data
const formData = ref({
  coinName: '',
  ticker: '',
  description: '',
  website: '',
  twitter: '',
  telegram: '',
  image: null,
  banner: null
})

// UI state
const showSocialLinks = ref(false)
const showBannerUpload = ref(false)
const isCreating = ref(false)
const router = useRouter()

// File inputs
const imageInput = ref(null)
const bannerInput = ref(null)

// Computed
const isFormValid = computed(() => {
  return formData.value.coinName.trim() && formData.value.ticker.trim()
})

// Methods
const toggleSocialLinks = () => {
  showSocialLinks.value = !showSocialLinks.value
}

const toggleBannerUpload = () => {
  showBannerUpload.value = !showBannerUpload.value
}

const triggerImageUpload = () => {
  imageInput.value?.click()
}

const triggerBannerUpload = () => {
  bannerInput.value?.click()
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.value.image = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const handleBannerUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.value.banner = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const handleImageDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.value.image = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const handleBannerDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.value.banner = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  formData.value.image = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

const removeBanner = () => {
  formData.value.banner = null
  if (bannerInput.value) {
    bannerInput.value.value = ''
  }
}

const createToken = async () => {
  if (!isFormValid.value) return
  
  isCreating.value = true
  
  try {
    // 1. Проверяем наличие Phantom Wallet
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Phantom wallet не найден. Пожалуйста, установите Phantom wallet.')
    }

    // 2. Подключаемся к Phantom
    const response = await window.solana.connect()
    const userPubkey = response.publicKey.toString()
    
    console.log('Connected to Phantom:', userPubkey)

    // 3. Подготавливаем данные для токена
    const tokenData = {
      name: formData.value.coinName,
      symbol: formData.value.ticker,
      description: formData.value.description,
      decimals: 9,
      supply: 1000000000000, // 1 триллион токенов
      user_pubkey: userPubkey,
      website: formData.value.website || undefined,
      twitter: formData.value.twitter || undefined,
      telegram: formData.value.telegram || undefined,
      image: formData.value.image || undefined
    }

    console.log('Creating token with data:', tokenData)

    // 4. Отправляем запрос на создание токена
    const result = await fetch('http://localhost:3000/api/bonding-curve/create-real-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData)
    })

    if (!result.ok) {
      const errorData = await result.json()
      throw new Error(errorData.message || 'Ошибка создания токена')
    }

    const data = await result.json()
    
    if (data.success) {
      console.log('🎉 Token created successfully!')
      console.log('Token ID:', data.data.tokenId)
      console.log('Bonding curve address:', data.data.bondingCurveAddress)
      console.log('Transaction:', data.data.transactionSignature)
      
     
      // Перенаправляем на страницу токена с правильным mint_address
      router.push(`/coin/${data.data.tokenId}`)
      
    } else {
      throw new Error(data.message || 'Ошибка создания токена')
    }
    
  } catch (error) {
    console.error('Error creating token:', error)
    alert(`Ошибка создания токена: ${error.message}`)
  } finally {
    isCreating.value = false
  }
}
</script>

<style scoped>
.create-token-page {
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
}

.create-token-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  text-transform: lowercase;
}

.form-section {
  width: 100%;
}

.section-header {
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
  text-transform: lowercase;
}

.section-subtitle {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.token-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  text-transform: lowercase;
}

.optional {
  color: #6b7280;
  font-weight: 400;
}

.form-input {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.form-input::placeholder {
  color: #6b7280;
}

.form-textarea {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.form-textarea:focus {
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.form-textarea::placeholder {
  color: #6b7280;
}

.social-links-section {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.add-social-btn {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: none;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: lowercase;
}

.add-social-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.link-icon {
  flex-shrink: 0;
}

.dropdown-arrow {
  margin-left: auto;
  transition: transform 0.2s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.social-inputs {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-area {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.upload-area:hover {
  border-color: rgba(66, 184, 131, 0.5);
  background: rgba(66, 184, 131, 0.05);
}

.file-input {
  display: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  color: #6b7280;
}

.upload-title {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  margin: 0;
  text-transform: lowercase;
}

.upload-subtitle {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.select-file-btn {
  padding: 8px 16px;
  background: #42b883;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: lowercase;
}

.select-file-btn:hover {
  background: #369870;
}

.image-preview {
  position: relative;
  display: inline-block;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #ef4444;
  border: none;
  border-radius: 50%;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-image-btn:hover {
  background: #dc2626;
}

.upload-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-section {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.info-icon {
  color: #6b7280;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  margin: 0 0 8px 0;
  text-transform: lowercase;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-list li {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

.banner-section {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.add-banner-btn {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: none;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: lowercase;
}

.add-banner-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.banner-icon {
  flex-shrink: 0;
}

.banner-upload {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.banner-upload-area {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.banner-upload-area:hover {
  border-color: rgba(66, 184, 131, 0.5);
  background: rgba(66, 184, 131, 0.05);
}

.banner-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.banner-text {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.select-banner-btn {
  padding: 6px 12px;
  background: #42b883;
  border: none;
  border-radius: 4px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: lowercase;
}

.select-banner-btn:hover {
  background: #369870;
}

.banner-preview {
  position: relative;
  display: inline-block;
}

.preview-banner {
  max-width: 100%;
  max-height: 120px;
  border-radius: 6px;
  object-fit: cover;
}

.remove-banner-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #ef4444;
  border: none;
  border-radius: 50%;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-banner-btn:hover {
  background: #dc2626;
}

.warning-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 8px;
}

.warning-icon {
  color: #fbbf24;
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-text {
  font-size: 14px;
  color: #fbbf24;
  margin: 0;
  line-height: 1.4;
}

.create-coin-btn {
  width: 100%;
  padding: 16px;
  background: #42b883;
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: lowercase;
}

.create-coin-btn:hover:not(:disabled) {
  background: #369870;
  transform: translateY(-2px);
}

.create-coin-btn:disabled {
  background: #6b7280;
  cursor: not-allowed;
  transform: none;
}

/* Tablet Styles */
@media (max-width: 1024px) {
  .create-token-page {
    padding: 30px;
  }
  
  .create-token-container {
    padding: 28px;
  }
  
  .page-title {
    font-size: 28px;
  }
  
  .upload-info {
    grid-template-columns: 1fr;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .create-token-page {
    padding: 20px 16px;
  }
  
  .create-token-container {
    padding: 24px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .section-title {
    font-size: 18px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .upload-area {
    padding: 30px 16px;
  }
  
  .upload-info {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .info-section {
    padding: 12px;
  }
  
  .warning-section {
    padding: 12px;
  }
  
  .create-coin-btn {
    padding: 14px;
    font-size: 15px;
  }
}

/* Small Mobile Styles */
@media (max-width: 480px) {
  .create-token-page {
    padding: 16px 12px;
  }
  
  .create-token-container {
    padding: 20px;
  }
  
  .page-title {
    font-size: 22px;
  }
  
  .section-title {
    font-size: 16px;
  }
  
  .section-subtitle {
    font-size: 13px;
  }
  
  .form-input,
  .form-textarea {
    padding: 10px 12px;
    font-size: 13px;
  }
  
  .upload-area {
    padding: 24px 12px;
  }
  
  .upload-title {
    font-size: 15px;
  }
  
  .upload-subtitle {
    font-size: 13px;
  }
  
  .info-title {
    font-size: 13px;
  }
  
  .info-list li {
    font-size: 11px;
  }
  
  .warning-text {
    font-size: 13px;
  }
  
  .create-coin-btn {
    padding: 12px;
    font-size: 14px;
  }
}

/* Very Small Mobile */
@media (max-width: 360px) {
  .create-token-container {
    padding: 16px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .upload-area {
    padding: 20px 8px;
  }
}
</style>