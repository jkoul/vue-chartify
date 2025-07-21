import './assets/main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Aqua from '@aqua/aqua.js'

import App from './App.vue'
import router from './router'

import '@aqua/aqua-styles.module.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Aqua)

app.mount('#app')
