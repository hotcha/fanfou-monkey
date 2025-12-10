export function expandUserInfo() {
  const expandBtn = document.querySelector('#user_infos a[title="点击展开"]') as HTMLAnchorElement | null
  if (expandBtn)
    expandBtn.click()
}
