'use strict'

const CACHE_NAME = 'fasttab-v1'
const FAVICON_CACHE_PREFIX = 'favicon-'
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7天

// 需要缓存的静态资源
const STATIC_CACHE_URLS = [
  '/public/icon.svg'
]

// 安装Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('[Service Worker] Installation complete')
        return self.skipWaiting()
      })
  )
})

// 激活Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[Service Worker] Activation complete')
        return self.clients.claim()
      })
  )
})

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // 检查是否是favicon请求
  if (url.hostname === 'www.google.com' && url.pathname.startsWith('/s2/favicons')) {
    event.respondWith(handleFaviconRequest(event.request))
    return
  }
  
  // 其他请求使用正常的缓存策略
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request).then((response) => {
          // 只缓存成功且状态码为200的响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          
          // 克隆响应并缓存（可选：静态资源）
          const responseToCache = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
          
          return response
        })
      })
  )
})

// 处理favicon请求，使用CacheFirst策略
async function handleFaviconRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  // 如果缓存存在且未过期，返回缓存
  if (cachedResponse) {
    const cachedDate = cachedResponse.headers.get('date')
    if (cachedDate) {
      const cacheAge = Date.now() - new Date(cachedDate).getTime()
      if (cacheAge < CACHE_MAX_AGE) {
        console.log('[Service Worker] Serving cached favicon:', request.url)
        return cachedResponse
      }
    }
  }
  
  // 缓存未命中或已过期，从网络获取
  try {
    console.log('[Service Worker] Fetching favicon from network:', request.url)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone()
      cache.put(request, responseToCache)
    }
    
    return networkResponse
  } catch (error) {
    console.error('[Service Worker] Failed to fetch favicon:', error)
    // 返回缓存的响应（即使已过期）
    if (cachedResponse) {
      console.log('[Service Worker] Serving stale cached favicon as fallback')
      return cachedResponse
    }
    throw error
  }
}

// 监听消息（用于手动清理缓存等操作）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      ).then(() => {
        event.ports[0].postMessage({ success: true })
      })
    })
  }
  if (event.data && event.data.type === 'CLEAR_FAVICON_URL') {
    const faviconUrl = event.data.url
    if (faviconUrl) {
      caches.open(CACHE_NAME).then((cache) => {
        cache.delete(faviconUrl).catch((error) => {
          console.error('[Service Worker] Failed to clear favicon cache:', error)
        })
      })
    }
  }
})
