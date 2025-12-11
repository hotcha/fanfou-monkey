export function settings() {
  // 设置按钮
  const setting = document.querySelector<HTMLLIElement>('#navigation li:nth-last-of-type(2)')
  if (!setting) {
    console.warn('未找到设置按钮')
    return
  }

  // 原本设置 li 是包含一个设置页面链接
  // 修改: 在鼠标移动到上方时，显示一个自定义的下拉菜单, 包含一个 “自动加载更多” 选项

  console.log('设置功能待实现')
}
