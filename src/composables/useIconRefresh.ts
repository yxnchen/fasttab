import { useStorage } from './useStorage'
import type { Shortcut } from '../types/shortcut'

export function useIconRefresh() {
  const storage = useStorage()

  const removeTimestampParams = (url: string): string => {
    try {
      const urlObj = new URL(url)
      urlObj.searchParams.delete('_t')
      return urlObj.toString()
    } catch {
      return url
    }
  }

  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'))
      }, 5000)

      img.onload = () => {
        clearTimeout(timeout)
        resolve()
      }

      img.onerror = () => {
        clearTimeout(timeout)
        reject(new Error('Image load failed'))
      }

      img.src = url
    })
  }

  const clearFaviconCache = async (faviconUrl: string): Promise<void> => {
    if (!navigator.serviceWorker) {
      console.warn('Service Worker not supported')
      return
    }

    const controller = navigator.serviceWorker.controller
    if (!controller) {
      console.warn('Service Worker not active')
      return
    }

    return new Promise((resolve) => {
      controller.postMessage({
        type: 'CLEAR_FAVICON_URL',
        url: faviconUrl
      })
      
      setTimeout(resolve, 100)
    })
  }

  const refreshGroupIcons = async (groupId: string, shortcuts: Shortcut[]): Promise<void> => {
    if (!shortcuts.length) return

    const refreshPromises = shortcuts.map(async (shortcut) => {
      try {
        await clearFaviconCache(shortcut.faviconUrl)

        const cleanUrl = removeTimestampParams(shortcut.faviconUrl)
        const timestamp = Date.now()
        const separator = cleanUrl.includes('?') ? '&' : '?'
        const newUrl = `${cleanUrl}${separator}_t=${timestamp}`

        await preloadImage(newUrl)

        await storage.updateShortcut(shortcut.id, { faviconUrl: newUrl })
      } catch (error) {
        console.error(`Failed to refresh icon for ${shortcut.name}:`, error)
      }
    })

    await Promise.all(refreshPromises)
  }

  return {
    refreshGroupIcons
  }
}
