import { setupAutoLoad } from './auto-load'
import { expandUserInfo } from './expand-user-info'
import { messageEnhance } from './message-enhance'
import { setupPasteUpload } from './paste-upload'

function start() {
  setupAutoLoad()
  expandUserInfo()
  messageEnhance()
  setupPasteUpload()
}

start()
