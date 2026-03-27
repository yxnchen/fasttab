interface Group {
  id: string
  name: string
  columns: number
  shortcuts: string[]
  collapsed: boolean
  createdAt: number
}

interface Shortcut {
  id: string
  name: string
  url: string
  faviconUrl: string
  groupId: string
  createdAt: number
}

interface ExportData {
  version: string
  exportedAt: string
  data: {
    groups: {
      id: string
      name: string
      columns: number
      collapsed: boolean
      createdAt: number
      shortcuts: Shortcut[]
    }[]
  }
}

export function useExport() {
  const cleanFaviconUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      urlObj.searchParams.delete('_t')
      return urlObj.toString()
    } catch {
      return url
    }
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toISOString().replace('T', ' ').slice(0, 19)
  }

  const createBlob = (content: string, type: string): Blob => {
    return new Blob([content], { type })
  }

  const downloadFile = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getFileName = (extension: string): string => {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    return `fasttab-export-${date}.${extension}`
  }

  const exportDataToJSON = async (groups: { [key: string]: Group }, shortcuts: { [key: string]: Shortcut }): Promise<void> => {
    try {
      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: {
          groups: []
        }
      }

      Object.values(groups).sort((a, b) => a.createdAt - b.createdAt).forEach(group => {
        const groupShortcuts = group.shortcuts
          .map(id => shortcuts[id])
          .filter(s => s !== undefined)

        exportData.data.groups.push({
          id: group.id,
          name: group.name,
          columns: group.columns,
          collapsed: group.collapsed,
          createdAt: group.createdAt,
          shortcuts: groupShortcuts.map(s => ({
            ...s,
            faviconUrl: cleanFaviconUrl(s.faviconUrl)
          }))
        })
      })

      const content = JSON.stringify(exportData, null, 2)
      const blob = createBlob(content, 'application/json;charset=utf-8')
      downloadFile(blob, getFileName('json'))
    } catch (error) {
      console.error('Failed to export data as JSON:', error)
      throw error
    }
  }

  const exportDataToTXT = async (groups: { [key: string]: Group }, shortcuts: { [key: string]: Shortcut }): Promise<void> => {
    try {
      let content = ''
      const now = new Date()
      const exportDate = formatDate(now.getTime())

      content += '========================================\n'
      content += 'FastTab Export\n'
      content += '========================================\n'
      content += `Exported: ${exportDate}\n`
      content += 'Version: 1.0.0\n\n'

      Object.values(groups).sort((a, b) => a.createdAt - b.createdAt).forEach((group, index) => {
        content += '========================================\n'
        content += `Group: ${group.name}\n`
        content += `Columns: ${group.columns}\n`
        content += `Collapsed: ${group.collapsed ? 'Yes' : 'No'}\n`
        content += `Created: ${formatDate(group.createdAt)}\n`
        content += '----------------------------------------\n'

        const groupShortcuts = group.shortcuts
          .map(id => shortcuts[id])
          .filter(s => s !== undefined)

        content += `Shortcuts (${groupShortcuts.length}):\n`

        groupShortcuts.forEach((shortcut, sIndex) => {
          content += `  ${sIndex + 1}. ${shortcut.name}\n`
          content += `     URL: ${shortcut.url}\n`
          content += `     Favicon: ${cleanFaviconUrl(shortcut.faviconUrl)}\n\n`
        })

        if (index < Object.keys(groups).length - 1) {
          content += '\n'
        }
      })

      const blob = createBlob(content, 'text/plain;charset=utf-8')
      downloadFile(blob, getFileName('txt'))
    } catch (error) {
      console.error('Failed to export data as TXT:', error)
      throw error
    }
  }

  return {
    exportDataToJSON,
    exportDataToTXT
  }
}
