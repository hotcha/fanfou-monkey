import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Fanfou Enhancer',
        icon: 'https://static.fanfou.com/favicon.ico',
        namespace: 'npm/vite-plugin-monkey',
        match: ['https://fanfou.com/*'],
        grant: ['unsafeWindow'],
      },
    }),
  ],
})
