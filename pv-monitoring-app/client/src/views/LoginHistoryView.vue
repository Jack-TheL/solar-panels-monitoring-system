<script setup> 
import BASE_API_URL from '@/base-api-url';
import { RouterLink } from 'vue-router'
import axios from 'axios';
</script>

<template>
  <v-card theme="dark" flat>
    <v-card-title class="d-flex align-center pe-4">
      <v-icon icon="mdi-clipboard-text-clock-outline"></v-icon> &nbsp; ประวัติการเข้าใช้งานระบบ
      <v-spacer></v-spacer>
      <v-text-field
       class="me-4"
        v-model="search"
        density="comfortable"
        label="Search"
        prepend-inner-icon="mdi-magnify"
        variant="solo-filled"
        flat
        hide-details
        single-line
      ></v-text-field>
      <RouterLink :to="{ name: 'new-user' }">
        <v-btn color="primary" class="me-2" v-if="user.role==='admin'">
          New User
        </v-btn>
      </RouterLink>
    </v-card-title>
    <v-divider></v-divider>
    
    <v-data-table v-model:search="search" :headers="headers" :items="items">
      <template v-slot:item="{ item }">
        <tr
          :class="user.role === 'admin' ? 'row' : ''" 
          @click="user.role === 'admin' && goToUser(item)">
          <td >{{item.username}} </td>
          <td class="text-center">{{item.email}} </td>
          <td class="text-center"> {{item.timestamp}}</td>
          <td class="text-center">
            <v-chip
            :color="item.login ? 'green' : 'red'"
            :text="item.login ? 'เข้าสู่ระบบ':'ออกจากระบบ'"
            class="text-uppercase"
            size="small"
            label
            ></v-chip> 
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      search: '',
      user: JSON.parse(localStorage.getItem('user')),
      headers: [
        { title: 'ชื่อผู้ใช้', align: 'start', key: 'username' },
        { title: 'อีเมล', align: 'center', key: 'email' },
        { title: 'วันเวลา', align: 'center', key: 'timestamp' },
        { title: 'หมายเหตุ', align: 'center', key: 'login'}
      ],
      items: [],
    }
  },
  methods: {
    goToUser(item) {
      this.$router.push({ name: 'edit-user', params: { userId: item.user_id } });
    },
    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      const options = { 
        year: 'numeric', month: 'long', 
        day: 'numeric', hour: '2-digit', 
        minute: '2-digit',second: '2-digit',
        hour12: false,
      };
      return date.toLocaleString('th-TH', options);
    },
    async fetchData() {
      try {
        const response = await axios.get(`${BASE_API_URL}/api/login-history`,{
          params: { userId: this.user.id, role: this.user.role } });
        this.items = response.data;
        console.log(this.items);
        for(let i=0; i<this.items.length; i++){
          this.items[i].timestamp = this.formatTimestamp(this.items[i].timestamp)
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  },
  mounted() { this.fetchData(); }
}
</script>

<style scoped>
.row:hover {
  background-color: rgba(255, 255, 255, 0.1);
  cursor: pointer;
}
</style>
