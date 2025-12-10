const MORE_ID = '#pagination-more' // “更多”按钮
const OFFSET = 200 // 距离底部多少 px 时触发
let ticking = false // 防止一次滚动多次触发

function clickMore() {
  const btn = document.querySelector(MORE_ID) as HTMLButtonElement | null
  if (!btn)
    return

  // 如果按钮被隐藏、禁用或正在加载，就跳过
  if (btn.style.display === 'none'
    || btn.disabled
    || btn.classList.contains('loading')
    || btn.textContent.includes('加载中')) {
    return
  }

  btn.click()
}

function onScroll() {
  if (ticking)
    return
  ticking = true

  window.requestAnimationFrame(() => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const needLoad = (scrollTop + windowHeight >= documentHeight - OFFSET)

    if (needLoad)
      clickMore()

    ticking = false
  })
}

export function setupAutoLoad() {
  if (window.location.pathname === '/home') {
    window.addEventListener('scroll', onScroll, { passive: true })
  }
}
