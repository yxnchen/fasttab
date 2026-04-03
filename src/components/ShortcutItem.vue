<template>
  <div class="shortcut-item">
    <a 
      :href="shortcut.url"
      :title="shortcut.name"
      class="shortcut-link"
      @click.stop
    >
      <img 
        :src="displayFaviconUrl" 
        :alt="shortcut.name"
        class="shortcut-icon"
        @error="handleFaviconError"
      />
      <div class="shortcut-name">{{ shortcut.name }}</div>
    </a>
    
    <button 
      class="delete-btn"
      @click.stop="handleDelete"
      title="Delete shortcut"
    >
      <svg viewBox="0 0 24 24" width="12" height="12">
        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    </button>
    
    <button 
      class="edit-btn"
      @click.stop="handleEdit"
      title="Edit shortcut"
    >
      <svg viewBox="0 0 24 24" width="12" height="12">
        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    </button>
    
    <button 
      class="copy-btn"
      :class="{ copied }"
      @click.stop="handleCopy"
      :title="copied ? 'Copied!' : 'Copy URL'"
    >
      <svg viewBox="0 0 24 24" width="12" height="12">
        <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Shortcut } from '../types/shortcut'
import { useFavicon } from '../composables/useFavicon'

const props = defineProps<{
  shortcut: Shortcut
}>()

const { checkIsDefaultFavicon, getDefaultFaviconUrl } = useFavicon()

const copied = ref(false)
const isDefaultFavicon = ref(false)
let copyTimeout: number | null = null

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

const displayFaviconUrl = computed(() => {
  if (isDefaultFavicon.value) {
    return getDefaultFaviconUrl()
  }
  return props.shortcut.faviconUrl
})

onMounted(async () => {
  if (props.shortcut.faviconUrl) {
    try {
      const isDefault = await checkIsDefaultFavicon(props.shortcut.faviconUrl)
      isDefaultFavicon.value = isDefault
    } catch (e) {
      console.error('Failed to check favicon:', e)
    }
  }
})

const handleFaviconError = () => {
  isDefaultFavicon.value = true
}

const handleEdit = () => {
  emit('edit', props.shortcut.id)
}

const handleDelete = () => {
  emit('delete', props.shortcut.id)
}

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.shortcut.url)
    copied.value = true
    
    if (copyTimeout) clearTimeout(copyTimeout)
    copyTimeout = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    const textarea = document.createElement('textarea')
    textarea.value = props.shortcut.url
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    
    copied.value = true
    if (copyTimeout) clearTimeout(copyTimeout)
    copyTimeout = setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}
</script>

<style scoped>
.shortcut-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.shortcut-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  flex: 1;
}

.shortcut-item:hover .shortcut-link {
  background: var(--card-hover);
}

.delete-btn,
.edit-btn,
.copy-btn {
  position: absolute;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-color);
  background: var(--btn-bg);
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.shortcut-item:hover .delete-btn,
.shortcut-item:hover .edit-btn,
.shortcut-item:hover .copy-btn {
  opacity: 1;
}

.delete-btn {
  top: 4px;
  right: 4px;
}

.edit-btn {
  bottom: 4px;
  right: 4px;
}

.copy-btn {
  top: 50%;
  right: 0;
  transform: translateY(-50%) translateX(4px);
}

.shortcut-item:hover .copy-btn {
  transform: translateY(-50%) translateX(4px);
}

.delete-btn:hover,
.edit-btn:hover {
  background: var(--btn-hover-bg);
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.copy-btn:hover {
  background: var(--btn-hover-bg);
  transform: translateY(-50%) scale(1.1) translateX(4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.delete-btn:active,
.edit-btn:active {
  transform: scale(0.95);
}

.copy-btn:active {
  transform: translateY(-50%) scale(0.95) translateX(4px);
}

.copy-btn.copied {
  background: #4ade80;
  color: #fff;
}

.copy-btn.copied svg {
  animation: success-pulse 0.3s ease;
}

@keyframes success-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.shortcut-icon {
  width: var(--shortcut-size);
  height: var(--shortcut-size);
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.shortcut-item:hover .shortcut-icon {
  transform: scale(1.1);
}

.shortcut-name {
  font-size: 12px;
  color: var(--text-color);
  text-align: center;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
</style>
