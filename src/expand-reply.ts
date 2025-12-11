// 例子: https://fanfou.com/statuses/wXkY9O03MZA
// https://fanfou.com/statuses/v4SCgZO8QyI
// https://fanfou.com/%E7%88%B1%E8%87%AA

function expand(root: Element, isStatusPage = false) {
  if (root.nodeName === 'BODY') {
    if (isStatusPage) {
      const info = root.querySelector('#info')
      fetchStatus({ root: info, el: info, isStatusPage: true })
      return
    }

    root.querySelectorAll('.message li').forEach(el => fetchStatus({ root: el, el }))
    return
  }

  if (root.nodeName === 'LI') {
    fetchStatus({ root, el: root, isStatusPage })
  }
}

const MAX_FETCH_COUNT = 3

interface FetchStatusOptions {
  root: Element | null
  el: Element | null
  isStatusPage?: boolean
  fetchCount?: number
}

async function fetchStatus({ root, el, isStatusPage = false, fetchCount = 0 }: FetchStatusOptions) {
  if (!root || !el)
    return

  if (isStatusPage) {
    // 网页已有自带的回复，不再处理
    if (document.getElementById('reply-bottombox'))
      return
  }

  // 消息内容是否为 "抱歉**此条饭否已不可见"
  const messageText = el.querySelector('.content')?.textContent?.trim() ?? ''
  const isMsgInvisible = messageText === '原贴已被删除' || !!messageText.match(/^抱歉.+此条饭否已不可见$/)

  console.log(messageText)
  const replyAnchor = (isMsgInvisible ? el.querySelector('.stamp a') : el.querySelector('.reply a')) as HTMLAnchorElement | null
  if (!replyAnchor)
    return

  if (replyAnchor.dataset.expanded === 'true')
    return

  replyAnchor.dataset.expanded = 'true'

  try {
    const response = await fetch(replyAnchor.href)
    if (!response.ok) {
      // 一般是 404
      replyAnchor.style.textDecoration = 'line-through'
      root.querySelector('.ff-expand')?.remove()
      throw new Error(`Response status: ${response.status}`)
    }

    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const reply = doc.getElementById('topbox')

    // 移除 “展开” 按钮
    root.querySelector('.ff-expand')?.remove()

    if (!reply)
      return

    // console.log(fetchCount, reply)
    const info = extraMsg(reply)
    const { user, repostUser, message } = info

    // eg. 如果是 "我只向关注我的人公开我的消息" 这种情况，返回的 message 为空
    if (!message) {
      replyAnchor.style.textDecoration = 'line-through'
      return
    }

    let replyList = root.querySelector('.ff-reply-list')
    if (!replyList) {
      replyList = document.createElement('div')
      replyList.classList.add('ff-reply-list')

      // 无头像
      if (!root.querySelector('.avatar')) {
        replyList.classList.add('ff-reply-no-avatar')
      }

      root.appendChild(replyList)
    }

    const replyItem = document.createElement('div')
    replyItem.classList.add('ff-reply')

    // 标题: 头像 - 用户名 - 时间 - 发送方法
    // 内容: 消息正文 + 图片
    replyItem.innerHTML = `
        <div class="ff-reply-title">
          <a class="ff-reply-avatar" href="${user.link}" target="_blank"><img src="${user.avatar}" alt="${user.username}" /></a>
          <a class="ff-reply-username" href="${user.link}" target="_blank">${user.username}</a>
          <span>·</span>
          <a class="ff-reply-timestamp" href="${replyAnchor.href}" target="_blank" title="${info.timestamp}">${info.timestampText}</a>
          <div class="ff-reply-method">
            <span>通过</span>
            <a href="${info.methodLink}" target="_blank">${info.methodName}</a>
          </div>
        </div>
        <div class="ff-reply-body">
          <div class="ff-reply-content">${message}</div>
        </div>
      `

    // 存在图片
    const hasPhoto = !!info.image
    if (hasPhoto) {
      const imgContainer = document.createElement('a')
      imgContainer.href = info.image.split('@')[0] // 使用原图: 去掉链接后面的 @ 等参数
      imgContainer.classList.add('photo', 'zoom')
      imgContainer.innerHTML = `
        <img src="${info.image}" />
        <span></span>
      `
      replyItem.querySelector(`.ff-reply-body`)?.appendChild(imgContainer)
    }

    const contentDiv = replyItem.querySelector(`.ff-reply-content`)!
    if (message.includes(`@${user.username}`)) {
      contentDiv.innerHTML = contentDiv.innerHTML.replaceAll(user.username, makeUserLink(user))
    }

    if (repostUser && message.includes(`@${repostUser.username}`)) {
      contentDiv.innerHTML = contentDiv.innerHTML.replaceAll(repostUser.username, makeUserLink(repostUser))
    }

    const hasMore = !!reply.querySelector<HTMLAnchorElement>('.reply a')
    if (hasMore) {
      // 增加一个 "展开" 的 a 标签, 点击后继续展开
      const expandDiv = document.createElement('div')
      expandDiv.classList.add('ff-expand')

      expandDiv.innerHTML = `
        <a href="javascript:void(0)">继续展开↓</a>
      `
      expandDiv.addEventListener('click', async () => {
        await fetchStatus({ root, el: reply, isStatusPage, fetchCount: 0 }) // 重置 fetchCount
        expandDiv.remove()
      })
      replyItem.querySelector(`.ff-reply-body`)?.after(expandDiv)
    }

    replyList.appendChild(replyItem)

    if (hasPhoto) {
      // @ts-expect-error 官网的点击图片放大功能
      window.FF.app.Zoom.init(replyItem)
    }

    if (!hasMore)
      return

    // 防止无限递归
    if (fetchCount >= MAX_FETCH_COUNT - 1) {
      return
    }

    // 递归展开回复
    await fetchStatus({ root, el: reply, isStatusPage, fetchCount: fetchCount + 1 })
  }
  catch (error) {
    console.error((error as Error).message, replyAnchor)
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
  const timestampText = timeAnchor?.textContent?.trim() ?? ''

  // 5. 提取发送方法
  const methodAnchor = doc.querySelector<HTMLAnchorElement>('#latest .method a')
  const methodName = methodAnchor?.textContent?.trim()?.replace('通过', '') ?? ''
  const methodLink = methodAnchor?.getAttribute('href') ?? ''

  return { user, message, image, repostUser, timestamp, timestampText, methodName, methodLink }
}

function makeUserLink(user: User) {
  return `<a href="${user.link}" target="_blank">${user.username}</a>`
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
