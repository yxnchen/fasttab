// 注册Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = '/sw.js'
    
    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('[Service Worker] Registration successful with scope: ', registration.scope)
        
        // 监听更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('[Service Worker] New worker installing')
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[Service Worker] New content available, refresh to update')
                // 可以在这里显示一个提示让用户刷新
              } else {
                console.log('[Service Worker] Content cached for offline use')
              }
            }
          })
        })
      })
      .catch((error) => {
        console.error('[Service Worker] Registration failed:', error)
      })
    
    // 监听Service Worker控制的变化
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  })
}
