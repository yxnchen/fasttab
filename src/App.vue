<template>
  <div class="app">
    <div class="header">
      <h1>FastTab</h1>
      <div class="header-actions">
        <button class="import-btn" @click="showImportDialog = true" title="Import Data">
          Import
        </button>
        <button class="export-btn" @click="showExportDialog = true" title="Export Data">
          Export
        </button>
        <button class="add-group-btn" @click="showCreateGroup = true" title="Create New Group">
          + New Group
        </button>
      </div>
    </div>

    <div class="content">
      <EmptyState 
        v-if="groupList.length === 0" 
        @create-first-group="showCreateGroup = true"
      />
      
      <ShortcutGroup
        v-for="group in groupList"
        :key="group.id"
        :group="group"
        @toggle-collapse="handleToggleCollapse"
        @delete-group="handleDeleteGroup"
        @update-group="handleUpdateGroup"
        @edit-group="handleEditGroup"
      />
    </div>

    <GroupManager
      v-if="showCreateGroup"
      :show="showCreateGroup"
      @close="showCreateGroup = false"
      @submit="handleCreateGroup"
    />

    <ExportDialog
      v-if="showExportDialog"
      :show="showExportDialog"
      @close="showExportDialog = false"
      @export="handleExport"
    />

    <ImportDialog
      v-if="showImportDialog"
      :show="showImportDialog"
      @close="showImportDialog = false"
      @imported="handleImported"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, provide } from 'vue'
import { useStorage } from './composables/useStorage'
import { useGroups } from './composables/useGroups'
import { useExport } from './composables/useExport'
import ShortcutGroup from './components/ShortcutGroup.vue'
import GroupManager from './components/GroupManager.vue'
import ExportDialog from './components/ExportDialog.vue'
import ImportDialog from './components/ImportDialog.vue'
import EmptyState from './components/EmptyState.vue'

const storage = useStorage()
const useGroupsData = useGroups()
provide('useGroupsData', useGroupsData)

const { groupList } = useGroupsData

const showCreateGroup = ref(false)
const showExportDialog = ref(false)
const showImportDialog = ref(false)
const { exportDataToJSON, exportDataToTXT } = useExport()

const { loadGroups, createGroup, removeGroup, updateGroupSettings, toggleGroupCollapse } = useGroupsData

onMounted(async () => {
  await loadGroups()
  
  if (groupList.value.length === 0) {
    await initializeDefaultData()
  } else {
    await updateAllFavicons()
  }
})

const initializeDefaultData = async () => {
  const aiApps = [
    { name: 'ChatGPT', url: 'https://chat.openai.com', category: 'chat' },
    { name: 'Claude', url: 'https://claude.ai', category: 'chat' },
    { name: 'Gemini', url: 'https://gemini.google.com', category: 'chat' },
    { name: 'AutoGPT', url: 'https://news.agpt.co', category: 'agent' },
    { name: 'Poe', url: 'https://poe.com', category: 'chat' },
    { name: 'Perplexity', url: 'https://perplexity.ai', category: 'chat' },
    { name: 'Midjourney', url: 'https://www.midjourney.com', category: 'image' },
    { name: 'Stable Diffusion', url: 'https://stablediffusion.com', category: 'image' }
  ]

  const chatGroupId = await createGroup('Chat Applications', 6)
  const agentGroupId = await createGroup('AI Agents', 5)
  const imageGroupId = await createGroup('Image Generation', 5)

  for (const app of aiApps) {
    let groupId: string
    if (app.category === 'chat') groupId = chatGroupId
    else if (app.category === 'agent') groupId = agentGroupId
    else groupId = imageGroupId
    
    const shortcutId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const urlObj = new URL(app.url)
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.protocol}//${urlObj.hostname}&sz=128`
    
    const shortcut = {
      id: shortcutId,
      name: app.name,
      url: app.url,
      faviconUrl,
      groupId,
      createdAt: Date.now()
    }
    
    await storage.addShortcut(shortcut)
    
    const group = groupList.value.find(g => g.id === groupId)
    if (group) {
      await updateGroupSettings(groupId, {
        shortcuts: [...group.shortcuts, shortcutId]
      })
    }
  }
  
  await loadGroups()
}

const handleCreateGroup = async (data: { name: string; columns: number }) => {
  await createGroup(data.name, data.columns)
  showCreateGroup.value = false
}

const handleToggleCollapse = async (id: string) => {
  await toggleGroupCollapse(id)
}

const handleDeleteGroup = async (id: string) => {
  await removeGroup(id)
}

const handleUpdateGroup = async (id: string, updates: any) => {
  await updateGroupSettings(id, updates)
}

const handleEditGroup = async (group: any) => {
  await updateGroupSettings(group.id, {
    name: group.name,
    columns: group.columns
  })
}

const updateAllFavicons = async (): Promise<void> => {
  const allShortcuts = Object.values(useGroupsData.shortcuts.value)
  
  for (const shortcut of allShortcuts) {
    try {
      const urlObj = new URL(shortcut.url)
      const newFaviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.protocol}//${urlObj.hostname}&sz=128`
      
      if (newFaviconUrl !== shortcut.faviconUrl) {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CLEAR_FAVICON_URL',
            url: shortcut.faviconUrl
          })
        }
        
        await storage.updateShortcut(shortcut.id, { faviconUrl: newFaviconUrl })
        useGroupsData.shortcuts.value[shortcut.id].faviconUrl = newFaviconUrl
      }
    } catch (error) {
      console.error(`Failed to update favicon for ${shortcut.name}:`, error)
    }
  }
}

const handleExport = async (format: 'json' | 'txt') => {
  try {
    if (format === 'json') {
      await exportDataToJSON(useGroupsData.groups.value, useGroupsData.shortcuts.value)
    } else {
      await exportDataToTXT(useGroupsData.groups.value, useGroupsData.shortcuts.value)
    }
  } catch (error) {
    console.error('Export failed:', error)
    alert('Export failed. Please try again.')
  } finally {
    showExportDialog.value = false
  }
}

const handleImported = async () => {
  await loadGroups()
  showImportDialog.value = false
}
</script>

<style>
.app {
  min-height: 100vh;
  background: var(--bg-color);
  padding: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 32px;
  background: var(--card-bg);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.import-btn {
  padding: 8px 16px;
  background: #16a085;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.import-btn:hover {
  background: #1abc9c;
  transform: translateY(-2px);
}

.export-btn {
  padding: 8px 16px;
  background: #34495e;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn:hover {
  background: #2c3e50;
  transform: translateY(-2px);
}

h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
}

.add-group-btn {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-group-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.content {
  max-width: 1800px;
  margin: 0 auto;
  padding: 24px 32px;
  column-count: 2;
  column-gap: 24px;
}

@media (max-width: 1024px) {
  .content {
    column-count: 1;
    padding: 16px 24px;
  }
}
</style>
