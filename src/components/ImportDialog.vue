<template>
  <div class="import-dialog-overlay" @click="handleClose">
    <div class="import-dialog" @click.stop>
      <div class="import-dialog-header">
        <h2>Import Data</h2>
        <button class="close-btn" @click="handleClose" title="Close">&times;</button>
      </div>

      <div class="import-dialog-body">
        <div v-if="!selectedFile">
          <p class="description">Select a file to import (JSON or TXT):</p>
          <div class="file-drop-zone" @click="triggerFileInput" @drop.prevent="handleDrop" @dragover.prevent>
            <input
              ref="fileInput"
              type="file"
              accept=".json,.txt"
              @change="handleFileSelect"
              style="display: none"
            />
            <div class="drop-icon">📁</div>
            <div class="drop-text">Click or drag file here</div>
            <div class="drop-hint">Supports .json and .txt files</div>
          </div>
        </div>

        <div v-else>
          <div class="file-info">
            <div class="file-icon">{{ fileType === 'json' ? '📄' : '📝' }}</div>
            <div class="file-details">
              <div class="file-name">{{ selectedFile.name }}</div>
              <div class="file-type">{{ fileType?.toUpperCase() }} format</div>
            </div>
            <button class="remove-file-btn" @click="clearFile" title="Remove file">&times;</button>
          </div>

          <div class="mode-selection">
            <p class="description">Import mode:</p>
            <div class="mode-options">
              <label class="mode-option" :class="{ active: importMode === 'overwrite' }">
                <input type="radio" v-model="importMode" value="overwrite" />
                <div class="mode-content">
                  <div class="mode-title">Overwrite</div>
                  <div class="mode-desc">Replace all existing data</div>
                </div>
              </label>
              <label class="mode-option" :class="{ active: importMode === 'append' }">
                <input type="radio" v-model="importMode" value="append" />
                <div class="mode-content">
                  <div class="mode-title">Append</div>
                  <div class="mode-desc">Add to existing data</div>
                </div>
              </label>
            </div>
          </div>

          <div v-if="importMode === 'overwrite'" class="warning-box">
            ⚠️ This will delete all existing groups and shortcuts!
          </div>
        </div>

        <div v-if="result" class="result-box" :class="{ success: result.success, error: !result.success }">
          <div v-if="result.success">
            ✅ Import successful! Added {{ result.groupsCount }} groups and {{ result.shortcutsCount }} shortcuts.
          </div>
          <div v-else>
            ❌ Import failed: {{ result.error }}
          </div>
        </div>
      </div>

      <div class="import-dialog-footer">
        <button class="cancel-btn" @click="handleClose">Cancel</button>
        <button
          class="import-btn"
          :disabled="!selectedFile || isImporting"
          @click="handleImport"
        >
          {{ isImporting ? 'Importing...' : 'Import' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useImport, type ImportMode } from '../composables/useImport'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  imported: []
}>()

const { importData, detectFileType } = useImport()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const fileType = ref<'json' | 'txt' | null>(null)
const importMode = ref<ImportMode>('append')
const isImporting = ref(false)
const result = ref<{ success: boolean; groupsCount: number; shortcutsCount: number; error?: string } | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectFile(input.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    selectFile(event.dataTransfer.files[0])
  }
}

const selectFile = (file: File) => {
  const type = detectFileType(file)
  if (!type) {
    result.value = {
      success: false,
      groupsCount: 0,
      shortcutsCount: 0,
      error: 'Unsupported file type. Please use .json or .txt files.'
    }
    return
  }
  selectedFile.value = file
  fileType.value = type
  result.value = null
}

const clearFile = () => {
  selectedFile.value = null
  fileType.value = null
  result.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleClose = () => {
  emit('close')
}

const handleImport = async () => {
  if (!selectedFile.value) return

  isImporting.value = true
  result.value = null

  try {
    result.value = await importData(selectedFile.value, importMode.value)
    if (result.value.success) {
      emit('imported')
    }
  } catch (error) {
    result.value = {
      success: false,
      groupsCount: 0,
      shortcutsCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped>
.import-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.import-dialog {
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 480px;
  width: 90%;
  overflow: hidden;
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.import-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.import-dialog-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  line-height: 1;
}

.close-btn:hover {
  background: var(--bg-color);
  color: var(--text-color);
}

.import-dialog-body {
  padding: 24px;
}

.description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: var(--text-color);
  opacity: 0.8;
}

.file-drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-drop-zone:hover {
  border-color: var(--primary-color);
  background: rgba(52, 152, 219, 0.05);
}

.drop-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.drop-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.drop-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-color);
  border-radius: 10px;
  margin-bottom: 20px;
}

.file-icon {
  font-size: 32px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  word-break: break-all;
}

.file-type {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.remove-file-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.remove-file-btn:hover {
  background: var(--card-hover);
  color: var(--danger-color);
}

.mode-selection {
  margin-top: 20px;
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-color);
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-option:hover {
  border-color: var(--primary-color);
}

.mode-option.active {
  border-color: var(--primary-color);
  background: rgba(52, 152, 219, 0.05);
}

.mode-option input {
  display: none;
}

.mode-content {
  flex: 1;
}

.mode-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.mode-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.warning-box {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 8px;
  font-size: 13px;
  color: var(--danger-color);
}

.result-box {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
}

.result-box.success {
  background: rgba(46, 204, 113, 0.1);
  border: 1px solid rgba(46, 204, 113, 0.3);
  color: #27ae60;
}

.result-box.error {
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  color: var(--danger-color);
}

.import-dialog-footer {
  padding: 16px 24px 24px 24px;
  display: flex;
  gap: 12px;
}

.cancel-btn {
  flex: 1;
  padding: 12px;
  background: var(--bg-color);
  color: var(--text-color);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: var(--card-hover);
  transform: translateY(-1px);
}

.import-btn {
  flex: 1;
  padding: 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.import-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.import-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
