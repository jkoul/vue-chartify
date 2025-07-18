import { fileURLToPath, URL } from 'node:url'
import autoprefixer from 'autoprefixer'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  css: {
    modules: {
      scopeBehaviour: 'global'
    },
    postcss: {
      plugins: [autoprefixer({})]
    },
    preprocessorOptions: {
      scss: {
        sourceMapIncludeSources: true
      }
    }
  }
})
