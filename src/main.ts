import { setupAutoLoad } from './auto-load'
import { disableAutoFocus } from './disable-auto-focus'
import { expandUserInfo } from './expand-user-info'
import { messageEnhance } from './message-enhance'
import { setupPasteUpload } from './paste-upload'

function start() {
  setupAutoLoad()
  expandUserInfo()
  messageEnhance()
  setupPasteUpload()
  disableAutoFocus()
}

start()
