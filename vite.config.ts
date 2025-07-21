import { fileURLToPath } from 'node:url'
import autoprefixer from 'autoprefixer'
import path from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const filename = fileURLToPath(import.meta.url)
const pathSegments = path.dirname(filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': path.resolve(pathSegments, './src'),
      '@aqua': path.resolve(pathSegments, './aqua'),
      '@chartlib': path.resolve(pathSegments, './src/core/chart'),
      '@utils': path.resolve(pathSegments, './src/core/utilities'),
    },
  },
  css: {
    modules: {
      scopeBehaviour: 'global',
    },
    postcss: {
      plugins: [autoprefixer({})],
    },
    preprocessorOptions: {
      scss: {
        sourceMapIncludeSources: true,
        additionalData(source: string, fp: string) {
          if (path.extname(fp) === '.vue') {
            return `@use "@aqua/aqua-vars.module.scss" as *;
${source}
            `
          } else {
            // Not a vue file, please use the SCSS module system directly
            return source
          }
        },
      },
    },
  },
})
