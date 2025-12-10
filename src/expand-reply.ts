// 例子: https://fanfou.com/statuses/wXkY9O03MZA

const PREFIX = 'ff-'

function expand(root: Element, isStatusPage = false) {
  if (root.nodeName === 'BODY') {
    if (isStatusPage) {
      expandItem(root.querySelector('#info'), true)
      return
    }

    root.querySelectorAll('.message li').forEach(el => expandItem(el))
    return
  }

  if (root.nodeName === 'LI') {
    expandItem(root)
  }
}

async function expandItem(el: Element | null, isStatusPage = false) {
  if (!el)
    return

  if (isStatusPage) {
    // 网页已有自带的回复，不再处理
    if (document.getElementById('reply-bottombox'))
      return
  }

  // 消息内容是否为 "抱歉**此条饭否已不可见"
  const message = el.querySelector('.content')?.textContent?.trim() ?? ''
  const isMsgInvisible = !!message.match(/抱歉.+此条饭否已不可见/)

  console.log('expandItem', el)
  const anchor = (isMsgInvisible ? el.querySelector('.stamp a') : el.querySelector('.reply a')) as HTMLAnchorElement | null
  if (!anchor)
    return

  if (anchor.dataset.expanded === 'true')
    return
  anchor.dataset.expanded = 'true'

  try {
    const response = await fetch(anchor.href)
    if (!response.ok) {
      // todo: 显示错误信息, 一般是 404
      throw new Error(`Response status: ${response.status}`)
    }

    // const u = new URL(anchor.href)
    // const mId = u.pathname.split('/').pop()

    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const reply = doc.getElementById('topbox')
    if (reply) {
      console.log(reply)

      const info = extraMsg(reply)
      console.log(info)

      // prefixIds(reply, `${mId}-`)

      const replyDiv = document.createElement('div')
      replyDiv.className = `${PREFIX}reply`

      // 时间戳 - 头像 - 用户名 - 消息内容 - 发送方法
      const { user, repostUser } = info
      replyDiv.innerHTML = `
        <div class="${PREFIX}reply-timestamp">
          <a href="${anchor.href}" target="_blank">${info.timestamp}</a>
        </div>
        <div class="${PREFIX}reply-body">
          <div class="${PREFIX}reply-avatar">
            <a href="${user.link}" target="_blank"><img src="${user.avatar}" alt="${user.username}" /></a>
          </div>
          <div class="${PREFIX}reply-content">
            <a class="${PREFIX}reply-username" href="${user.link}" target="_blank">${user.username}</a>
            <span class="${PREFIX}reply-message">${info.message}</span>
            <span class="${PREFIX}reply-method">通过
              <a href="${info.methodLink}" target="_blank">${info.methodName}</a>
            </span>
          </div>
        </div>
      `

      // todo: 图片

      if (repostUser) {
        replyDiv.innerHTML = replyDiv.innerHTML.replace(repostUser.username, `<a href="${repostUser.link}" target="_blank">${repostUser.username}</a>`)
      }

      console.log('replyContainer', replyDiv)
      el.after(replyDiv)
    }
  }
  catch (error) {
    console.error((error as Error).message, anchor)
  }
}

interface User {
  link: string
  username: string
  avatar?: string
}

function extraMsg(doc: Element) {
  // 1. 提取 userLink 与 username
  const userAnchor = doc.querySelector<HTMLAnchorElement>('#info h1 a')
  if (!userAnchor)
    throw new Error('找不到用户链接')

  const user: User = {
    link: userAnchor.getAttribute('href') ?? '',
    username: userAnchor.textContent?.trim() ?? '',
    avatar: doc.querySelector<HTMLImageElement>('#avatar img')?.getAttribute('src') ?? '',
  }

  // 3. 提取消息内容
  const contentSpan = doc.querySelector<HTMLSpanElement>('#latest .content')
  const message = contentSpan?.textContent?.trim() ?? ''
  const image = contentSpan?.querySelector<HTMLImageElement>('img')?.getAttribute('src') ?? ''

  let repostUser: User | null = null
  const repostAnchor = contentSpan?.querySelector<HTMLAnchorElement>('a.former')
  if (repostAnchor) {
    repostUser = {
      link: repostAnchor.getAttribute('href') ?? '',
      username: repostAnchor.textContent?.trim() ?? '',
    }
  }

  // 4. 提取时间戳
  const timeAnchor = doc.querySelector<HTMLAnchorElement>('#latest a.time')
  const timestamp = timeAnchor?.getAttribute('title') ?? ''

  // 5. 提取发送方法
  const methodAnchor = doc.querySelector<HTMLAnchorElement>('#latest .method')
  const methodName = methodAnchor?.textContent?.trim() ?? ''
  const methodLink = methodAnchor?.getAttribute('href') ?? ''

  return { user, message, image, repostUser, timestamp, methodName, methodLink }
}

function prefixIds(el: Element, prefix: string) {
  [el, ...Array.from(el.querySelectorAll('[id]'))].forEach((el) => {
    if (!el.id.startsWith(prefix)) {
      el.classList.add(`${PREFIX}${el.id}`)
      el.id = prefix + el.id
    }
  })
}

export function expandReply() {
  const isStatusPage = location.pathname.startsWith('/statuses/')
  const isHomePage = location.pathname === '/home'

  expand(document.body, isStatusPage)

  // 监听后续动态加载（瀑布流）
  if (isHomePage) {
    const obs = new MutationObserver((muts) => {
      muts.forEach(m => m.addedNodes.forEach((n) => {
        if (n.nodeType === Node.ELEMENT_NODE)
          expand(n as Element, false) // 只处理元素节点
      }))
    })
    obs.observe(document.body, { childList: true, subtree: true })
  }
}
