<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <h2>{{ isEdit ? 'Edit Group' : 'Create New Group' }}</h2>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="groupName">Group Name</label>
            <input
              id="groupName"
              v-model="formData.name"
              type="text"
              placeholder="e.g., Chat Apps"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="columns">Columns (per row)</label>
            <input
              id="columns"
              v-model.number="formData.columns"
              type="number"
              min="2"
              max="8"
              step="1"
              required
            />
            <small class="hint">Drag the edge of the group to resize later</small>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="close">Cancel</button>
            <button type="submit" class="btn-primary">
              {{ isEdit ? 'Update' : 'Create' }} Group
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'

const props = defineProps<{
  show: boolean
  group?: {
    id: string
    name: string
    columns: number
  }
}>()

const emit = defineEmits<{
  close: []
  submit: [data: { name: string; columns: number }]
}>()

const formData = reactive({
  name: '',
  columns: 5
})

const isEdit = computed(() => !!props.group)

watch(() => props.group, (newGroup) => {
  if (newGroup) {
    formData.name = newGroup.name
    formData.columns = newGroup.columns
  } else {
    formData.name = ''
    formData.columns = 5
  }
}, { immediate: true })

watch(() => props.show, (show) => {
  if (show && !props.group) {
    formData.name = ''
    formData.columns = 5
  }
})

const handleSubmit = () => {
  emit('submit', {
    name: formData.name,
    columns: formData.columns
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
  color: #666;
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
  background: #e5e7eb;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}
</style>
