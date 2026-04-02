<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <h2>{{ isEdit ? 'Edit Shortcut' : 'Add New Shortcut' }}</h2>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="name">Name</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              placeholder="e.g., ChatGPT"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="url">URL</label>
            <input
              id="url"
              v-model="formData.url"
              type="url"
              placeholder="https://example.com"
              required
              @blur="handleUrlBlur"
            />
            <small class="hint">Favicon will be auto-fetched</small>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="close">Cancel</button>
            <button type="submit" class="btn-primary">
              {{ isEdit ? 'Update' : 'Add' }} Shortcut
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useFavicon } from '../composables/useFavicon'

const props = defineProps<{
  show: boolean
  shortcut?: any
  groupId: string
}>()

const emit = defineEmits<{
  close: []
  submit: [data: { name: string; url: string; faviconUrl: string; groupId: string }]
}>()

const { getFaviconUrl, validateUrl } = useFavicon()

const formData = reactive({
  name: '',
  url: '',
  faviconUrl: ''
})

const isEdit = computed(() => !!props.shortcut)

watch(() => props.shortcut, (newShortcut) => {
  if (newShortcut) {
    formData.name = newShortcut.name
    formData.url = newShortcut.url
    formData.faviconUrl = newShortcut.faviconUrl
  } else {
    formData.name = ''
    formData.url = ''
    formData.faviconUrl = ''
  }
}, { immediate: true })

watch(() => props.show, (show) => {
  if (show && !props.shortcut) {
    formData.name = ''
    formData.url = ''
    formData.faviconUrl = ''
  }
})

const handleUrlBlur = () => {
  if (validateUrl(formData.url)) {
    formData.faviconUrl = getFaviconUrl(formData.url)
  }
}

const handleSubmit = () => {
  if (!formData.faviconUrl && validateUrl(formData.url)) {
    formData.faviconUrl = getFaviconUrl(formData.url)
  }
  
  emit('submit', {
    name: formData.name,
    url: formData.url,
    faviconUrl: formData.faviconUrl,
    groupId: props.groupId
  })
  close()
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg);
  padding: 32px;
  border-radius: 12px;
  box-shadow: var(--shadow-hover);
  width: 100%;
  max-width: 400px;
}

h2 {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-color);
  color: var(--text-color);
  transition: border-color 0.2s ease;
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: var(--bg-color);
  color: var(--text-color);
}

.btn-cancel:hover {
  background: var(--cancel-hover-bg);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}
</style>
