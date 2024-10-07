<script setup>
import Alert from '@/components/AlertDialog.vue'
import Refreshbtn from '@/components/RefreshButton.vue';
import BASE_API_URL from '@/base-api-url';
import { RouterView } from 'vue-router'
import axios from 'axios';
</script>

<template>
  <v-card>
    <v-layout>
      <!-- App Bar -->
      <v-app-bar color="primary" prominent>
        <v-app-bar-nav-icon variant="text" @click.stop="rail = !rail"></v-app-bar-nav-icon>
        <v-toolbar-title>Solar Panels Monitoring Application</v-toolbar-title>
        <v-spacer></v-spacer>
        <template v-if="$vuetify.display.mdAndUp">
           <Alert />
        </template>
         <Refreshbtn/>
      </v-app-bar>
      <!-- Navigation Drawer -->
      <v-navigation-drawer
        v-model="drawer"
        :rail="rail"
        permanent
        @click="rail = false"
        :width="270"
        theme="dark"
      >
        <!--Account Profile Section -->
        <v-list nav>
          <v-list-item
            :prepend-avatar="`/user_profile.png`"
            :title="user.username"
            :subtitle="user.email"
          >
            <template v-slot:append>
              <v-btn icon="mdi-chevron-left" variant="text" @click.stop="rail = !rail"></v-btn>
            </template>
          </v-list-item>
        </v-list>
        <v-divider></v-divider>
        <!-- Navigation links Section -->
        <v-list density="compact" nav>
          <v-list-item prepend-icon="mdi-home-city-outline" title="Home" :to="{ name: 'home' }">
          </v-list-item>
          <v-list-item
            prepend-icon="mdi-monitor-dashboard"
            title="Dashboard"
            :to="{ name: 'dashboard' }"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-chart-multiple"
            title="Reports"
            :to="{ name: 'reports' }"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-clipboard-text-clock-outline"
            title="Login history"
            :to="{ name: 'login-history' }"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-solar-panel"
            title="Solar Panels"
            :to="{ name: 'panels' }"
          ></v-list-item>
          <v-list-item v-if="user.role === 'admin'"
            prepend-icon="mdi-clipboard-alert"
            title="Configure Alerts"
            :to="{ name: 'alert-configuration' }"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-logout"
            title="Sign out"
            @click="logout"
            :to="{ name: 'login' }"
          ></v-list-item>
        </v-list>
      </v-navigation-drawer>
      <!-- Main Content -->
      <v-main style="background-color:#181818;">
        <RouterView />
      </v-main>
    </v-layout>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      user: JSON.parse(localStorage.getItem('user')),
      drawer: true,
      rail: true
    }
  },
  methods:{
    async logout(){
      await axios.post(`${BASE_API_URL}/api/save-history`, {
        login: false,
        userId: this.user.id
      });
      localStorage.clear();
    },
  }
}
</script>

<style scoped>
/* add if needed */
</style>
