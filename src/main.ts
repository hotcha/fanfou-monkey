import { setupAutoLoad } from './auto-load'
import { expandReply } from './expand-reply'
import { expandUserInfo } from './expand-user-info'

function start() {
  setupAutoLoad()
  expandUserInfo()
  expandReply()
}

start()
