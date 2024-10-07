<script setup>
import BASE_API_URL from '@/base-api-url';
import axios from 'axios';
</script>

<template>
  <div class="pa-4 text-center">
    <v-dialog width="auto" scrollable theme="dark">
      <template v-slot:activator="{ props: activatorProps }">
        <v-btn
          color="#1b71ff"
          prepend-icon="mdi-solar-panel"
          text="เลือกแผงโซล่าเซลล์"
          variant="outlined"
          v-bind="activatorProps"
        ></v-btn>
      </template>

      <template v-slot:default="{ isActive }">
        <v-card prepend-icon="mdi-solar-panel" title="เลือกแผงโซล่าเซลล์">
          <v-divider class="mt-3"></v-divider>
          <v-card-text class="px-4" style="height: 300px">
            <v-radio-group
              v-model="selectedPanel"
              messages="เลือกแผงโซล่าเซลล์ที่ต้องการ"
              column
            >
              <!-- แสดงรายการแผงจากเซิร์ฟเวอร์ -->
              <v-radio
                v-for="panel in panels"
                :key="panel.id"
                :value="panel"
              >
                <template v-slot:label>
                  <div :class="{'mb-3':user.role === 'admin'}">
                    <strong>{{ panel.name }}</strong>
                    <br />
                    <span style="font-size: 0.8em;" v-if="user.role==='admin'" >
                      ({{panel.email}})</span> <!-- ใช้ subtitle ที่ต้องการแสดง -->
                  </div>
                </template>
              </v-radio>
            </v-radio-group>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn text="ปิด" @click="isActive.value = false"></v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="surface-variant"
              text="เลือก"
              variant="flat"
              @click="saveSelection(isActive)"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>

  
<script>
export default {
    data() {
      return {
        user: JSON.parse(localStorage.getItem('user')),
        selectedPanel: {},
        panels: [],
      };
    },
    methods: {
      async fetchPanels() {
        try {
          const response = await axios.get(`${BASE_API_URL}/api/select-panel`,{
          params: { userId: this.user.id, role: this.user.role } });
          this.panels = response.data;
        } catch (error) { console.error('Error fetching panels:', error);}
      },
      saveSelection(isActive) {
        this.$emit('panel-selected', this.selectedPanel); // ส่งค่าที่เลือกกลับไปให้ parent component
        isActive.value = false; // ปิด dialog
      },
    },
    mounted() { this.fetchPanels();},
};
</script>
  