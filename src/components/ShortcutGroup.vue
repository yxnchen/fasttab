<template>
  <div class="group-container">
    <div class="group-header">
      <div class="group-title">
        <button class="collapse-btn" @click="toggleCollapse" :title="group.collapsed ? 'Expand' : 'Collapse'">
          {{ group.collapsed ? '▶' : '▼' }}
        </button>
        <h3>{{ group.name }}</h3>
        <span class="count">({{ shortcuts.length }})</span>
      </div>
      <div class="group-actions">
        <button class="add-btn" @click="showAdd = true" title="Add Shortcut">+</button>
        <button 
          class="refresh-btn" 
          @click="handleRefreshIcons"
          :class="{ loading: isRefreshingIcons }"
          title="Refresh Icons"
        >
          <svg 
            viewBox="0 0 24 24" 
            width="14" 
            height="14"
            :class="{ spin: isRefreshingIcons }"
          >
            <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
        <button class="edit-btn" @click="handleEditGroup" title="Edit Group">⋮</button>
        <button class="delete-btn" @click="confirmDelete" title="Delete Group">×</button>
      </div>
    </div>

    <div 
      class="group-body"
      :class="{ collapsed: group.collapsed }"
      :style="{ '--group-columns': group.columns }"
    >
      <div class="shortcut-list">
        <ShortcutItem 
          v-for="shortcut in shortcuts"
          :key="shortcut.id"
          :shortcut="shortcut"
          @edit="handleEditShortcut"
          @delete="handleDeleteShortcut"
        />
        
        <div 
          v-if="!group.collapsed" 
          class="add-shortcut-item"
          @click="showAdd = true"
          title="Add shortcut"
        >
          <div class="add-shortcut-icon">+</div>
          <div class="add-shortcut-label">Add</div>
        </div>
      </div>
    </div>

    <div 
      class="resize-handle"
      @mousedown="startResize"
      title="Drag to resize"
    ></div>

    <AddShortcut 
      v-if="showAdd" 
      :show="showAdd"
      :group-id="group.id"
      :shortcut="editingShortcut"
      @close="handleCloseAddShortcut"
      @submit="handleSubmitShortcut"
    />

    <GroupManager
      v-if="showEditGroup"
      :show="showEditGroup"
      :group="group"
      @close="showEditGroup = false"
      @submit="handleUpdateGroup"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { Group } from '../types/group'
import ShortcutItem from './ShortcutItem.vue'
import AddShortcut from './AddShortcut.vue'
import { useStorage } from '../composables/useStorage'
import GroupManager from './GroupManager.vue'
import { useIconRefresh } from '../composables/useIconRefresh'

const useGroupsData: any = inject('useGroupsData')
const { getGroupShortcuts, addShortcutToState, updateShortcut } = useGroupsData

const props = defineProps<{
  group: Group
}>()

const emit = defineEmits<{
  toggleCollapse: [id: string]
  deleteGroup: [id: string]
  updateGroup: [id: string, data: any]
  editGroup: [group: any]
}>()

const storage = useStorage()
const { refreshGroupIcons } = useIconRefresh()

const showAdd = ref(false)
const showEditGroup = ref(false)
const showEditShortcut = ref(false)
const editingShortcutId = ref<string | null>(null)
const isRefreshingIcons = ref(false)

const shortcuts = computed(() => {
  return getGroupShortcuts(props.group.id)
})

const isResizing = ref(false)
const resizeStartX = ref(0)
const resizeStartColumns = ref(0)

const toggleCollapse = () => {
  emit('toggleCollapse', props.group.id)
}

const confirmDelete = () => {
  if (confirm(`Are you sure you want to delete the group "${props.group.name}"?`)) {
    emit('deleteGroup', props.group.id)
  }
}

const handleAddShortcut = async (data: any) => {
  const id = Date.now().toString()
  const shortcut = {
    id,
    ...data,
    createdAt: Date.now()
  }
  
  await storage.addShortcut(shortcut)
  addShortcutToState(shortcut)
  
  const updatedShortcuts = [...props.group.shortcuts, id]
  emit('updateGroup', props.group.id, { shortcuts: updatedShortcuts })
}

const handleEditGroup = () => {
  showEditGroup.value = true
}

const handleUpdateGroup = async (data: { name: string; columns: number }) => {
  emit('updateGroup', props.group.id, {
    name: data.name,
    columns: data.columns
  })
  showEditGroup.value = false
}

const handleRefreshIcons = async () => {
  if (isRefreshingIcons.value) return

  isRefreshingIcons.value = true

  try {
    await refreshGroupIcons(props.group.id, shortcuts.value)
    
    await useGroupsData.loadGroups()
  } catch (error) {
    console.error('Failed to refresh icons:', error)
  } finally {
    isRefreshingIcons.value = false
  }
}

const editingShortcut = computed(() => {
  if (!editingShortcutId.value) return null
  return shortcuts.value.find(s => s.id === editingShortcutId.value)
})

const handleEditShortcut = (shortcutId: string) => {
  editingShortcutId.value = shortcutId
  showAdd.value = true
}

const handleDeleteShortcut = async (shortcutId: string) => {
  await storage.deleteShortcut(shortcutId)
  
  const shortcutsShortcuts = useGroupsData.shortcuts
  delete shortcutsShortcuts[shortcutId]
  
  const updatedShortcuts = props.group.shortcuts.filter((id: string) => id !== shortcutId)
  emit('updateGroup', props.group.id, { shortcuts: updatedShortcuts })
}

const handleSubmitShortcut = async (data: any) => {
  if (editingShortcutId.value) {
    await updateShortcut(editingShortcutId.value, {
      name: data.name,
      url: data.url,
      faviconUrl: data.faviconUrl
    })
  } else {
    const id = Date.now().toString()
    const shortcut = {
      id,
      ...data,
      createdAt: Date.now()
    }
    
    await storage.addShortcut(shortcut)
    addShortcutToState(shortcut)
    
    const updatedShortcuts = [...props.group.shortcuts, id]
    emit('updateGroup', props.group.id, { shortcuts: updatedShortcuts })
  }
  
  showAdd.value = false
  editingShortcutId.value = null
}

const handleCloseAddShortcut = () => {
  showAdd.value = false
  editingShortcutId.value = null
}

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  resizeStartX.value = e.clientX
  resizeStartColumns.value = props.group.columns
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  
  const deltaX = e.clientX - resizeStartX.value
  const containerWidth = (e.target as HTMLElement).parentElement?.offsetWidth || 500
  const shortcutWidth = containerWidth / resizeStartColumns.value
  const columnDelta = Math.round(deltaX / shortcutWidth)
  
  const newColumns = Math.max(2, Math.min(8, resizeStartColumns.value + columnDelta))
  
  if (newColumns !== props.group.columns) {
    emit('updateGroup', props.group.id, { columns: newColumns })
  }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}
</script>

<style scoped>
.group-container {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  box-shadow: var(--shadow);
  break-inside: avoid;
  margin-bottom: 24px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-color);
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.collapse-btn:hover {
  background: var(--bg-color);
}

h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.count {
  font-size: 12px;
  color: var(--text-muted);
}

.group-actions {
  display: flex;
  gap: 4px;
}

.add-btn,
.edit-btn,
.delete-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  background: var(--bg-color);
  color: var(--text-color);
  transition: all 0.2s ease;
}

.add-btn:hover,
.edit-btn:hover {
  background: var(--primary-color);
  color: white;
}

.delete-btn:hover {
  background: var(--danger-color);
  color: white;
}

.refresh-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: var(--bg-color);
  color: var(--text-color);
  transition: all 0.2s ease;
  padding: 0;
}

.refresh-btn:hover {
  background: #2ea043;
  color: white;
}

.refresh-btn.loading {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}

.group-body {
  padding: 0;
  transition: grid-template-columns 0.2s ease;
}

.group-body.collapsed {
  display: none;
}

.shortcut-list {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(var(--group-columns, 6), minmax(0, 1fr));
}

.add-shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-shortcut-item:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  background: rgba(52, 152, 219, 0.05);
}

.add-shortcut-icon {
  width: var(--shortcut-size);
  height: var(--shortcut-size);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--text-muted);
  font-weight: 600;
  transition: all 0.2s ease;
}

.add-shortcut-item:hover .add-shortcut-icon {
  color: var(--primary-color);
  transform: scale(1.05);
}

.add-shortcut-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  transition: color 0.2s ease;
}

.add-shortcut-item:hover .add-shortcut-label {
  color: var(--primary-color);
}

.resize-handle {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 40px;
  cursor: ew-resize;
  background: linear-gradient(to right, transparent 0%, var(--border-color) 50%, var(--border-color) 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
  border-radius: 4px;
}

.resize-handle:hover {
  opacity: 1;
}
</style>
