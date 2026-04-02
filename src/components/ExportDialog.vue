<template>
  <div class="export-dialog-overlay" @click="handleClose">
    <div class="export-dialog" @click.stop>
      <div class="export-dialog-header">
        <h2>Export Your Data</h2>
        <button class="close-btn" @click="handleClose" title="Close">&times;</button>
      </div>

      <div class="export-dialog-body">
        <p class="description">Choose export format:</p>

        <div class="export-options">
          <button class="export-option" @click="handleExport('json')">
            <div class="export-option-icon">📄</div>
            <div class="export-option-title">Export as JSON</div>
            <div class="export-option-desc">Full data structure</div>
          </button>

          <button class="export-option" @click="handleExport('txt')">
            <div class="export-option-icon">📝</div>
            <div class="export-option-title">Export as TXT</div>
            <div class="export-option-desc">Readable format</div>
          </button>
        </div>
      </div>

      <div class="export-dialog-footer">
        <button class="cancel-btn" @click="handleClose">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  export: [format: 'json' | 'txt']
}>()

const handleClose = () => {
  emit('close')
}

const handleExport = (format: 'json' | 'txt') => {
  emit('export', format)
}
</script>

<style scoped>
.export-dialog-overlay {
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

.export-dialog {
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

.export-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.export-dialog-header h2 {
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

.export-dialog-body {
  padding: 24px;
}

.description {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: var(--text-color);
  opacity: 0.8;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-color);
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.export-option:hover {
  border-color: var(--primary-color);
  background: rgba(52, 152, 219, 0.05);
  transform: translateY(-2px);
}

.export-option:active {
  transform: translateY(0);
}

.export-option-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg);
  border-radius: 8px;
}

.export-option-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
}

.export-option-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

.export-dialog-footer {
  padding: 16px 24px 24px 24px;
}

.cancel-btn {
  width: 100%;
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

.cancel-btn:active {
  transform: translateY(0);
}
</style>
