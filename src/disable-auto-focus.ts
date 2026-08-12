export function disableAutoFocus(): void {
  const textarea = document.querySelector<HTMLTextAreaElement>('#phupdate textarea')
  if (textarea && document.activeElement === textarea) {
    textarea.blur()
  }
}
