const STORAGE_KEY = 'fasttab_data'

interface StorageData {
  shortcuts: { [key: string]: any }
  groups: { [key: string]: any }
}

const DEFAULT_DATA: StorageData = {
  shortcuts: {},
  groups: {}
}

export function useStorage() {
  const getData = async (): Promise<StorageData> => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || DEFAULT_DATA)
      })
    })
  }

  const setData = async (data: StorageData): Promise<void> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: data }, resolve)
    })
  }

  const getShortcuts = async (): Promise<{ [key: string]: any }> => {
    const data = await getData()
    return data.shortcuts
  }

  const setShortcuts = async (shortcuts: { [key: string]: any }): Promise<void> => {
    const data = await getData()
    data.shortcuts = shortcuts
    await setData(data)
  }

  const getGroups = async (): Promise<{ [key: string]: any }> => {
    const data = await getData()
    return data.groups
  }

  const setGroups = async (groups: { [key: string]: any }): Promise<void> => {
    const data = await getData()
    data.groups = groups
    await setData(data)
  }

  const addShortcut = async (shortcut: any): Promise<void> => {
    const shortcuts = await getShortcuts()
    shortcuts[shortcut.id] = shortcut
    await setShortcuts(shortcuts)
  }

  const updateShortcut = async (id: string, updates: Partial<any>): Promise<void> => {
    const shortcuts = await getShortcuts()
    if (shortcuts[id]) {
      shortcuts[id] = { ...shortcuts[id], ...updates }
      await setShortcuts(shortcuts)
    }
  }

  const deleteShortcut = async (id: string): Promise<void> => {
    const shortcuts = await getShortcuts()
    delete shortcuts[id]
    await setShortcuts(shortcuts)
  }

  const addGroup = async (group: any): Promise<void> => {
    const groups = await getGroups()
    groups[group.id] = group
    await setGroups(groups)
  }

  const updateGroup = async (id: string, updates: Partial<any>): Promise<void> => {
    const groups = await getGroups()
    if (groups[id]) {
      groups[id] = { ...groups[id], ...updates }
      await setGroups(groups)
    }
  }

  const deleteGroup = async (id: string): Promise<void> => {
    const groups = await getGroups()
    delete groups[id]
    await setGroups(groups)
  }

  return {
    getData,
    setData,
    getShortcuts,
    setShortcuts,
    getGroups,
    setGroups,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    addGroup,
    updateGroup,
    deleteGroup
  }
}
