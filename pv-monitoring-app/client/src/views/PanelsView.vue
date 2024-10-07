<script setup> 
import BASE_API_URL from '@/base-api-url';
import { RouterLink } from 'vue-router'
import axios from 'axios';

</script>

<template>
  <v-card theme="dark" flat>
    <v-card-title class="d-flex align-center pe-4">
      <v-icon icon="mdi-solar-panel"></v-icon> &nbsp; Solar Panels
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
      <RouterLink :to="{ name: 'new-panel' }">
        <v-btn color="primary" class="me-2" v-if="user.role==='admin'">
          New Solar Panel
        </v-btn>
      </RouterLink>
    </v-card-title>
    <v-divider></v-divider>
    
    <v-data-table v-model:search="search" :headers="computedHeaders" :items="items">
      <template v-slot:item="{ item }">
        <tr @click="goToConfig(item)" class="row">
          <td>{{ item.name }}</td>
          <td v-if="user.role === 'admin'">{{ item.owner }}</td>
          <td v-else class="text-center">{{ item.Pmax ? item.Pmax: '--' }}</td>
          <td class="text-center">{{ item.created }}</td>
          <td class="text-center">{{ item.updated }}</td>
          <td class="text-center">
            <v-chip
              :color="item.status ? 'green' : 'red'"
              :text="item.status ? 'Online' : 'Offline'"
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
      headersUser: [
        { title: 'ชื่อแผงโซล่าเซลล์', align: 'start', key: 'name' },
        { title: 'กำลังการผลิต (W)', align: 'center', key: 'Pmax' },
        { title: 'วันที่เพิ่ม', align: 'center', key: 'created' },
        { title: 'วันที่แก้ไขล่าสุด', align: 'center', key: 'updated' },
        { title: 'สถานะการทำงาน', align: 'center', key: 'status' }
      ],
      headersAdmin: [
        { title: 'ชื่อแผงโซล่าเซลล์', align: 'start', key: 'name' },
        { title: 'เจ้าของแผง', align: 'start', key: 'owner' },
        { title: 'วันที่เพิ่ม', align: 'center', key: 'created' },
        { title: 'วันที่แก้ไขล่าสุด', align: 'center', key: 'updated' },
        { title: 'สถานะการทำงาน', align: 'center', key: 'status' }
      ],
      items: []
    };
  },
  computed: {
    computedHeaders() {
      return this.user.role === 'admin' ? this.headersAdmin : this.headersUser;
    }
  },
  methods: {
    goToConfig(item) { 
      this.$router.push({ name: 'config-panel', params: { panelId: item.id } });
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
        const response = await axios.get(`${BASE_API_URL}/api/panels`,{
          params: { userId: this.user.id, role: this.user.role } });
          console.log(response.data);
        this.items = response.data;
        for(let i=0; i<this.items.length; i++){
          this.items[i].created = this.formatTimestamp(this.items[i].created);
          this.items[i].updated = this.formatTimestamp(this.items[i].updated);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  },
  mounted() { this.fetchData(); }
};
</script>

<style scoped>
.row:hover {
  background-color: rgba(255, 255, 255, 0.1);
  cursor: pointer;
}
</style>
