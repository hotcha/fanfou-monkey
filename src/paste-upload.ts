function isImage(type: string): boolean {
  return /^image\/(?:jpe?g|png|gif|bmp)$/.test(type)
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function showElement(el: HTMLElement | null): void {
  if (el)
    el.style.display = 'block'
}

async function onPaste(event: ClipboardEvent): Promise<void> {
  const items = Array.from(event.clipboardData?.items || [])
  const files = items.map(item => item.getAsFile()).filter((x): x is File => x instanceof File)
  const imageBlob = files.find(file => isImage(file.type))

  if (!imageBlob)
    return

  const imageType = imageBlob.type.replace('image/', '')

  const uploadFilename = document.querySelector<HTMLElement>('#upload-filename')
  if (uploadFilename) {
    uploadFilename.textContent = `image-from-clipboard.${imageType}`
    showElement(uploadFilename)
  }

  const close = document.querySelector<HTMLElement>('#ul_close')
  showElement(close)

  const message = document.querySelector<HTMLFormElement>('#message')
  if (message) {
    message.setAttribute('action', '/home/upload')
    message.setAttribute('enctype', 'multipart/form-data')
  }

  const actionField = document.querySelector<HTMLInputElement>('#phupdate input[name="action"]')
  if (actionField)
    actionField.value = 'photo.upload'

  const textarea = document.querySelector<HTMLTextAreaElement>('#phupdate textarea')
  if (textarea)
    textarea.setAttribute('name', 'desc')

  const base64 = document.querySelector<HTMLInputElement>('#upload-base64')
  if (base64)
    base64.value = await blobToBase64(imageBlob)

  const uploadWrapper = document.querySelector<HTMLElement>('#upload-wrapper')
  showElement(uploadWrapper)
}

export function setupPasteUpload(): void {
  const textarea = document.querySelector<HTMLTextAreaElement>('#phupdate textarea')
  if (!textarea)
    return

  textarea.addEventListener('paste', onPaste)
}
