import './assets/main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Vuetify
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { VDateInput } from 'vuetify/labs/VDateInput'; // นำเข้า VDateInput
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

// @canvasjs/vue-charts
import CanvasJSChart from '@canvasjs/vue-charts';

import App from './App.vue';
import router from './router';

// Vuetify
const vuetify = createVuetify({
  components: {
    ...components,
    VDateInput, // เพิ่ม VDateInput เข้าไป
  },
  directives,
  // theme: { defaultTheme: 'dark' }
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(vuetify); // Vuetify
app.use(CanvasJSChart); // install the CanvasJS Vuejs Chart Plugin

app.mount('#app');
