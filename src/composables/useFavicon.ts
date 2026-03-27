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
    validateUrl
  }
}
