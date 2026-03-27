import { ref, computed } from 'vue'
import { useStorage } from './useStorage'

export function useGroups() {
  const storage = useStorage()
  const groups = ref<{ [key: string]: any }>({})
  const shortcuts = ref<{ [key: string]: any }>({})

  const loadGroups = async () => {
    const [loadedGroups, loadedShortcuts] = await Promise.all([
      storage.getGroups(),
      storage.getShortcuts()
    ])
    groups.value = loadedGroups
    shortcuts.value = loadedShortcuts
  }

  const groupList = computed(() => {
    return Object.values(groups.value).sort((a, b) => a.createdAt - b.createdAt)
  })

  const createGroup = async (name: string, columns: number = 5): Promise<string> => {
    const id = Date.now().toString()
    const group = {
      id,
      name,
      columns,
      shortcuts: [],
      collapsed: false,
      createdAt: Date.now()
    }
    await storage.addGroup(group)
    groups.value[id] = group
    return id
  }

  const updateGroupSettings = async (id: string, updates: any): Promise<void> => {
    await storage.updateGroup(id, updates)
    if (groups.value[id]) {
      groups.value[id] = { ...groups.value[id], ...updates }
    }
  }

  const removeGroup = async (id: string): Promise<void> => {
    const group = groups.value[id]
    if (group) {
      for (const shortcutId of group.shortcuts) {
        await storage.deleteShortcut(shortcutId)
        delete shortcuts.value[shortcutId]
      }
    }
    await storage.deleteGroup(id)
    delete groups.value[id]
  }

  const toggleGroupCollapse = async (id: string): Promise<void> => {
    const group = groups.value[id]
    if (group) {
      await updateGroupSettings(id, { collapsed: !group.collapsed })
    }
  }

  const getGroupShortcuts = (groupId: string) => {
    const group = groups.value[groupId]
    if (!group) return []
    return group.shortcuts
      .map(id => shortcuts.value[id])
      .filter(s => s !== undefined)
  }

  const addShortcutToState = (shortcut: any) => {
    shortcuts.value[shortcut.id] = shortcut
  }

  const updateShortcut = async (id: string, updates: Partial<any>): Promise<void> => {
    await storage.updateShortcut(id, updates)
    if (shortcuts.value[id]) {
      shortcuts.value[id] = { ...shortcuts.value[id], ...updates }
    }
  }

  const deleteShortcut = async (id: string): Promise<void> => {
    await storage.deleteShortcut(id)
    delete shortcuts.value[id]
  }

  return {
    groups,
    shortcuts,
    groupList,
    loadGroups,
    createGroup,
    updateGroupSettings,
    removeGroup,
    toggleGroupCollapse,
    getGroupShortcuts,
    addShortcutToState,
    updateShortcut,
    deleteShortcut
  }
}
