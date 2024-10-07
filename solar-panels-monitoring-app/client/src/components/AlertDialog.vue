<script setup>
import BASE_API_URL from '@/base-api-url';
import axios from 'axios';
</script>

<template>
  <div class="pa-4 text-center">
    <v-btn icon="mdi-alert" color="primary" variant="flat">
      <v-badge v-if="hasUnreadNotifications > 0" color="error" :content="hasUnreadNotifications">
        <v-icon>mdi-bell</v-icon>
      </v-badge>
      <v-icon v-else>mdi-bell</v-icon>
      <v-dialog activator="parent" max-width="500" theme="dark">
        <template v-slot:default="{ isActive }">
          <v-card rounded="lg">
            <!-- Title -->
            <v-card-title class="d-flex justify-space-between align-center">
              
              <div class="text-h5 text-medium-emphasis ps-2">
                <v-icon class="mr-2" style="font-size: 30px;">mdi-bell</v-icon> Notifications
              </div>
              <v-btn icon="mdi-close" variant="text" @click="isActive.value = false"></v-btn>
            </v-card-title>
            <v-divider class="mb-4"></v-divider>
            <!-- Main Content -->
            <v-card-text>
              <div v-for="(notification, index) in notifications" :key="notification.id">
                <div class="d-flex align-center">
                  <v-icon
                    class="mr-2"
                    :color="notification.read ? 'transparent' : 'red'"
                    style="background-color: transparent; border-radius: 50%;"
                    v-if="!notification.read"
                  >
                    mdi-circle
                  </v-icon>
                  <v-icon
                    class="mr-2"
                    v-if="notification.read"
                    style="background-color: rgba(255, 0, 0, 0.2); border-radius: 50%;"
                  >
                    mdi-circle
                  </v-icon>
                  <div class="flex-grow-1">
                    <div class="font-weight-bold display-1">{{ notification.title }}</div>
                    <div class="font-weight-bold text-muted">{{ notification.dateTime }}</div>
                    <div class="text-small">{{ notification.message }}</div>
                    <div class="text-small" v-if="user.role === 'admin'">{{ notification.email }}</div>
                  </div>
                  <v-btn @click="markAsRead(notification.id)" v-if="!notification.read">
                    <v-icon>mdi-email-open</v-icon>
                  </v-btn>
                </div>
                <!-- Divider only for notifications that are not the last one -->
                <v-divider v-if="index < notifications.length - 1" class="my-2"></v-divider>
              </div>
            </v-card-text>
          </v-card>
        </template>
      </v-dialog>
    </v-btn>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: JSON.parse(localStorage.getItem('user')),
      notifications: [],
    };
  },
  computed: {
    hasUnreadNotifications() {
      return this.notifications.filter(notification => !notification.read).length;
    },
  },
  methods: {
    async fetchAlert(){
      try{
        const response = await axios.get(`${BASE_API_URL}/api/alerts/${this.user.role}/${this.user.id}`);
        const data = response.data;
        this.notifications = data.reverse().map(notification=>({
          id: Date.now(),
          title: notification.title,
          dateTime: new Date(notification.timestamp).toLocaleString(),
          message: notification.message,
          read: true,
          ...(this.user.role === 'admin' && { email: notification.email }), // ถ้าเป็น admin ให้เก็บ email
        }));
        console.log(this.notification);

      } catch (error) { console.error('Error fetching settings:', error); }
    },
    markAsRead(id) {
      const notification = this.notifications.find(n => n.id === id);
      if (notification) { notification.read = true; }
    },
    connectWebSocket(userId) {
      const socket = new WebSocket('wss://rrvxlzsz-3000.asse.devtunnels.ms/'); //ws://localhost:8080
      socket.onopen = () => {
        console.log('WebSocket connection opened');
        socket.send(JSON.stringify({ userId })); // ส่ง userId ไปยัง server
      };
      socket.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        this.notifications.unshift({ 
          id: Date.now(),
          title: notification.title,
          dateTime: notification.dateTime,
          message: notification.message,
          read: false,
        });
        console.log(this.notification);
      };
      socket.onclose = () => { console.log('WebSocket connection closed'); };
    },
  },
  mounted() { 
    this.fetchAlert();
    this.connectWebSocket(this.user.id);
  },
};
</script>

<style scoped>
.text-small { font-size: 0.875rem; }
</style>
