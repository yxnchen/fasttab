const DEFAULT_FAVICON_SHA256 = '59bfe9bc385ad69f50793ce4a53397316d7a875a7148a63c16df9b674c6cda64'

const defaultFaviconCache = new Map<string, Promise<boolean>>()

async function checkIsDefaultFavicon(faviconUrl: string): Promise<boolean> {
  if (defaultFaviconCache.has(faviconUrl)) {
    return defaultFaviconCache.get(faviconUrl)!
  }

  const promise = (async () => {
    try {
      const img = new Image()
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Image load failed'))
        img.src = faviconUrl
      })
      
      if (img.naturalWidth === 16 && img.naturalHeight === 16) {
        return true
      }
      
      if (typeof fetch !== 'undefined') {
        const response = await fetch(faviconUrl, { cache: 'no-store' })
        if (response.ok) {
          const buffer = await response.arrayBuffer()
          const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
          return hashHex === DEFAULT_FAVICON_SHA256
        }
      }
      
      return false
    } catch (e) {
      console.error('Favicon check error:', e)
      return false
    }
  })()
  
  defaultFaviconCache.set(faviconUrl, promise)
  return promise
}

export function useFavicon() {
  const getFaviconUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      const origin = `${urlObj.protocol}//${urlObj.hostname}`
      return `https://www.google.com/s2/favicons?domain=${origin}&sz=128`
    } catch {
      return 'https://www.google.com/s2/favicons?domain=https://example.com&sz=128'
    }
  }

  const getDefaultFaviconUrl = (): string => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL('default-favicon.svg')
    }
    return '/default-favicon.svg'
  }

  const getValidFaviconUrl = async (url: string): Promise<string> => {
    const faviconUrl = getFaviconUrl(url)
    const isDefault = await checkIsDefaultFavicon(faviconUrl)
    
    if (isDefault) {
      return getDefaultFaviconUrl()
    }
    
    return faviconUrl
  }

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  return {
    getFaviconUrl,
    getDefaultFaviconUrl,
    getValidFaviconUrl,
    validateUrl,
    checkIsDefaultFavicon
  }
}
