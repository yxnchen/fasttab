import { useStorage } from './useStorage'
import { useFavicon } from './useFavicon'

interface ImportedGroup {
  id: string
  name: string
  columns: number
  collapsed: boolean
  createdAt: number
  shortcuts: ImportedShortcut[]
}

interface ImportedShortcut {
  id: string
  name: string
  url: string
  faviconUrl: string
  groupId: string
  createdAt: number
}

interface ImportResult {
  success: boolean
  groupsCount: number
  shortcutsCount: number
  error?: string
}

interface JSONExportData {
  version: string
  exportedAt: string
  data: {
    groups: ImportedGroup[]
  }
}

export type ImportMode = 'overwrite' | 'append'

export function useImport() {
  const storage = useStorage()
  const { getFaviconUrl, validateUrl } = useFavicon()

  const generateId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  const parseJSON = async (file: File): Promise<ImportedGroup[]> => {
    const text = await file.text()
    const data: JSONExportData = JSON.parse(text)

    if (!data.data || !Array.isArray(data.data.groups)) {
      throw new Error('Invalid JSON format: missing data.groups array')
    }

    return data.data.groups.map(group => {
      const newGroupId = generateId()
      return {
        id: newGroupId,
        name: group.name || 'Unnamed Group',
        columns: group.columns || 5,
        collapsed: group.collapsed || false,
        createdAt: group.createdAt || Date.now(),
        shortcuts: (group.shortcuts || []).map(shortcut => ({
          id: generateId(),
          name: shortcut.name || 'Unnamed',
          url: shortcut.url || '',
          faviconUrl: shortcut.faviconUrl || getFaviconUrl(shortcut.url || ''),
          groupId: newGroupId,
          createdAt: shortcut.createdAt || Date.now()
        }))
      }
    })
  }

  const parseTXT = async (file: File): Promise<ImportedGroup[]> => {
    const text = await file.text()
    const lines = text.split('\n')
    const groups: ImportedGroup[] = []
    let currentGroup: Partial<ImportedGroup> | null = null
    let currentShortcuts: ImportedShortcut[] = []

    const groupRegex = /^Group: (.+)$/
    const columnsRegex = /^Columns: (\d+)$/
    const collapsedRegex = /^Collapsed: (Yes|No)$/
    const createdRegex = /^Created: (.+)$/
    const shortcutCountRegex = /^Shortcuts \((\d+)\):$/
    const shortcutNameRegex = /^\s+\d+\.\s+(.+)$/
    const shortcutUrlRegex = /^\s+URL: (.+)$/
    const shortcutFaviconRegex = /^\s+Favicon: (.+)$/

    for (const line of lines) {
      const groupMatch = line.match(groupRegex)
      if (groupMatch) {
        if (currentGroup && currentGroup.name) {
          groups.push({
            id: currentGroup.id || generateId(),
            name: currentGroup.name,
            columns: currentGroup.columns || 5,
            collapsed: currentGroup.collapsed || false,
            createdAt: currentGroup.createdAt || Date.now(),
            shortcuts: currentShortcuts
          })
        }
        const newGroupId = generateId()
        currentGroup = {
          id: newGroupId,
          name: groupMatch[1].trim()
        }
        currentShortcuts = []
        continue
      }

      if (!currentGroup) continue

      const columnsMatch = line.match(columnsRegex)
      if (columnsMatch) {
        currentGroup.columns = parseInt(columnsMatch[1], 10) || 5
        continue
      }

      const collapsedMatch = line.match(collapsedRegex)
      if (collapsedMatch) {
        currentGroup.collapsed = collapsedMatch[1] === 'Yes'
        continue
      }

      const createdMatch = line.match(createdRegex)
      if (createdMatch) {
        const timestamp = new Date(createdMatch[1]).getTime()
        currentGroup.createdAt = isNaN(timestamp) ? Date.now() : timestamp
        continue
      }

      const shortcutCountMatch = line.match(shortcutCountRegex)
      if (shortcutCountMatch) continue

      const shortcutNameMatch = line.match(shortcutNameRegex)
      if (shortcutNameMatch) {
        currentShortcuts.push({
          id: generateId(),
          name: shortcutNameMatch[1].trim(),
          url: '',
          faviconUrl: '',
          groupId: currentGroup.id || generateId(),
          createdAt: Date.now()
        })
        continue
      }

      const shortcutUrlMatch = line.match(shortcutUrlRegex)
      if (shortcutUrlMatch && currentShortcuts.length > 0) {
        const url = shortcutUrlMatch[1].trim()
        currentShortcuts[currentShortcuts.length - 1].url = url
        continue
      }

      const shortcutFaviconMatch = line.match(shortcutFaviconRegex)
      if (shortcutFaviconMatch && currentShortcuts.length > 0) {
        currentShortcuts[currentShortcuts.length - 1].faviconUrl = shortcutFaviconMatch[1].trim()
        continue
      }
    }

    if (currentGroup && currentGroup.name) {
      groups.push({
        id: currentGroup.id || generateId(),
        name: currentGroup.name,
        columns: currentGroup.columns || 5,
        collapsed: currentGroup.collapsed || false,
        createdAt: currentGroup.createdAt || Date.now(),
        shortcuts: currentShortcuts
      })
    }

    return groups.map(group => ({
      ...group,
      shortcuts: group.shortcuts.map(shortcut => ({
        ...shortcut,
        faviconUrl: shortcut.faviconUrl && validateUrl(shortcut.faviconUrl)
          ? shortcut.faviconUrl
          : getFaviconUrl(shortcut.url)
      }))
    }))
  }

  const importOverwrite = async (groups: ImportedGroup[]): Promise<ImportResult> => {
    try {
      const newGroups: { [key: string]: any } = {}
      const newShortcuts: { [key: string]: any } = {}

      for (const group of groups) {
        const shortcutIds = group.shortcuts.map(s => s.id)
        newGroups[group.id] = {
          id: group.id,
          name: group.name,
          columns: group.columns,
          shortcuts: shortcutIds,
          collapsed: group.collapsed,
          createdAt: group.createdAt
        }

        for (const shortcut of group.shortcuts) {
          newShortcuts[shortcut.id] = shortcut
        }
      }

      await storage.setData({ groups: newGroups, shortcuts: newShortcuts })

      return {
        success: true,
        groupsCount: groups.length,
        shortcutsCount: Object.keys(newShortcuts).length
      }
    } catch (error) {
      return {
        success: false,
        groupsCount: 0,
        shortcutsCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const importAppend = async (groups: ImportedGroup[]): Promise<ImportResult> => {
    try {
      const existingGroups = await storage.getGroups()
      const existingShortcuts = await storage.getShortcuts()

      const existingNames = new Set(Object.values(existingGroups).map((g: any) => g.name))

      for (const group of groups) {
        let groupName = group.name
        let counter = 1
        while (existingNames.has(groupName)) {
          groupName = `${group.name} (${counter})`
          counter++
        }
        existingNames.add(groupName)

        const shortcutIds = group.shortcuts.map(s => s.id)
        existingGroups[group.id] = {
          id: group.id,
          name: groupName,
          columns: group.columns,
          shortcuts: shortcutIds,
          collapsed: group.collapsed,
          createdAt: group.createdAt
        }

        for (const shortcut of group.shortcuts) {
          existingShortcuts[shortcut.id] = shortcut
        }
      }

      await storage.setData({ groups: existingGroups, shortcuts: existingShortcuts })

      return {
        success: true,
        groupsCount: groups.length,
        shortcutsCount: groups.reduce((sum, g) => sum + g.shortcuts.length, 0)
      }
    } catch (error) {
      return {
        success: false,
        groupsCount: 0,
        shortcutsCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const detectFileType = (file: File): 'json' | 'txt' | null => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension === 'json') return 'json'
    if (extension === 'txt') return 'txt'
    return null
  }

  const importData = async (file: File, mode: ImportMode): Promise<ImportResult> => {
    try {
      const fileType = detectFileType(file)
      if (!fileType) {
        return {
          success: false,
          groupsCount: 0,
          shortcutsCount: 0,
          error: 'Unsupported file type. Please use .json or .txt files.'
        }
      }

      let groups: ImportedGroup[]
      if (fileType === 'json') {
        groups = await parseJSON(file)
      } else {
        groups = await parseTXT(file)
      }

      if (groups.length === 0) {
        return {
          success: false,
          groupsCount: 0,
          shortcutsCount: 0,
          error: 'No valid groups found in the file.'
        }
      }

      if (mode === 'overwrite') {
        return await importOverwrite(groups)
      } else {
        return await importAppend(groups)
      }
    } catch (error) {
      return {
        success: false,
        groupsCount: 0,
        shortcutsCount: 0,
        error: error instanceof Error ? error.message : 'Failed to parse file'
      }
    }
  }

  return {
    importData,
    detectFileType
  }
}
