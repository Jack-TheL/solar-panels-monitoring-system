<script setup> 
import BASE_API_URL from '@/base-api-url';
import axios from 'axios';
</script>

<template>
  <v-container class="fill-height">
    <v-card>
      <v-card-title style="font-weight: bold; font-size: 1.5rem;">กำหนดค่าการแจ้งเตือนระบบ</v-card-title>
      <v-card-text>
        <v-divider :thickness="2" class="border-opacity-75 mt-1 mb-4" color="info"></v-divider>
        <v-form>
          <!-- System Alert -->
          <v-row class="align-center">
            <v-col cols="6">
              <v-label class="custom-label">กำหนดให้กับทั้งระบบ</v-label>
              <div class="text-subtitle-2"> กำหนดค่าให้กับทุกการแจ้งเตือน</div>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="settings.system_alert_delay"
                label="วินาที"
                type="number"
                :disabled="!settings.system_alert_enabled"
              ></v-text-field>
            </v-col>
            <v-col cols="2">
              <v-switch
                v-model="settings.system_alert_enabled"
                inset color="primary"
              ></v-switch>
            </v-col>
          </v-row>
          <v-divider :thickness="2" class="border-opacity-75 mt-1 mb-4" color="info"></v-divider>
          <!-- Over Heat Alert -->
          <v-row class="align-center">
            <v-col cols="6">
              <v-label class="custom-label">เมื่ออุณหภูมิเกินค่าที่กำหนด</v-label>
              <div class="text-subtitle-2"> ระยะเวลาที่จะเกิดการแจ้งเตือนอีกครั้ง</div>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="settings.over_heat_alert_delay"
                label="วินาที"
                type="number"
                :disabled="settings.system_alert_enabled"
              ></v-text-field>
            </v-col>
            <v-col cols="2">
              <v-switch
                v-model="settings.over_heat_alert_enabled"
                inset color="primary"
                :disabled="settings.system_alert_enabled"
              ></v-switch>
            </v-col>
          </v-row>
          <v-divider :thickness="2" class="border-opacity-75 mt-1 mb-4" color="info"></v-divider>
          <!-- Panel Fail -->
          <v-row class="align-center">
            <v-col cols="6">
              <v-label class="custom-label">เมื่อความแสงเกินค่าที่กำหนด<br/>แต่โซล่าเซลล์ไม่ผลิตไฟฟ้า</v-label>
              <div class="text-subtitle-2"> ระยะเวลาที่จะเกิดการแจ้งเตือนอีกครั้ง</div>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="settings.panel_fail_delay"
                label="วินาที"
                type="number"
                :disabled="settings.system_alert_enabled"
              ></v-text-field>
            </v-col>
            <v-col cols="2">
              <v-switch
                v-model="settings.panel_fail_enabled"
                inset color="primary"
                :disabled="settings.system_alert_enabled"
              ></v-switch>
            </v-col>
          </v-row>
          <v-divider :thickness="2" class="border-opacity-75 mt-1 mb-4" color="info"></v-divider>
          <!-- Sensor Fail Alert -->
          <v-row class="align-center">
            <v-col cols="6">
              <v-label class="custom-label">เมื่อเซ็นเซอร์หยุดทำงาน</v-label>
              <div class="text-subtitle-2"> ช่วงเวลาที่ปล่อยให้หยุดทำงานก่อนแจ้งเตือน </div>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="settings.sensor_fail_alert_delay"
                label="วินาที"
                type="number"
                :disabled="settings.system_alert_enabled"
              ></v-text-field>
            </v-col>
            <v-col cols="2">
              <v-switch
                v-model="settings.sensor_fail_alert_enabled"
                inset color="primary"
                :disabled="settings.system_alert_enabled"
              ></v-switch>
            </v-col>
          </v-row>
          <v-divider :thickness="2" class="border-opacity-75 mt-1 mb-4" color="info"></v-divider>
          <!-- MCU Disconnect -->
          <v-row class="align-center">
            <v-col cols="6">
              <v-label class="custom-label">เมื่อไมโครคอนโทรเลอร์<br/>ไม่ตอบสนอง</v-label>
              <div class="text-subtitle-2"> ช่วงเวลาที่ปล่อยให้ขาดการเชื่อมต่อก่อนแจ้งเตือน </div>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="settings.mcu_disconnect_delay"
                label="วินาที"
                type="number"
                :disabled="settings.system_alert_enabled"
              ></v-text-field>
            </v-col>
            <v-col cols="2">
              <v-switch
                v-model="settings.mcu_disconnect_enabled"
                inset color="primary"
                :disabled="settings.system_alert_enabled"
              ></v-switch>
            </v-col>
          </v-row>
          <v-divider :thickness="2" class="border-opacity-75 mt-1 mb-4" color="info"></v-divider>
          <!-- Email Alert -->
          <v-row class="align-center">
            <v-col cols="6">
              <v-label class="custom-label">ส่งแจ้งเตือนไปที่อัเมล</v-label>
              <div class="text-subtitle-2"> เปิด-ปิดการแจ้งเตือนอีเมล </div>
            </v-col>
            <v-col cols="4"></v-col>
            <v-col cols="2">
              <v-switch
                v-model="settings.email_alert_enabled"
                inset color="primary"
                :disabled="settings.system_alert_enabled"
              ></v-switch>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="saveSettings">Save</v-btn>
        <v-btn color="secondary" @click="resetSettings">Reset</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
export default {
  data() { return { settings: {}, }; },
  async mounted() {  await this.fetchSettings();  },
  watch: {
    // Watch when system_alert_enabled is toggled
    'settings.system_alert_enabled'(newVal) {
      if (newVal) { this.disableOtherAlerts(); }
    },
    // Watch any other alert being toggled
    'settings.over_heat_alert_enabled'(newVal) {
      if (newVal) this.settings.system_alert_enabled = false;
    },
    'settings.panel_fail_enabled'(newVal) {
      if (newVal) this.settings.system_alert_enabled = false;
    },
    'settings.sensor_fail_alert_enabled'(newVal) {
      if (newVal) this.settings.system_alert_enabled = false;
    },
    'settings.mcu_disconnect_enabled'(newVal) {
      if (newVal) this.settings.system_alert_enabled = false;
    },
    'settings.email_alert_enabled'(newVal) {
      if (newVal) this.settings.system_alert_enabled = false;
    },
  },
  methods: {
    async fetchSettings() {
      try {
        const response = await axios.post(`${BASE_API_URL}/api/alert-config`);
        const data = response.data;
        this.settings = data;
        this.settings.system_alert_enabled = data.system_alert_enabled ? true:false;
        this.settings.over_heat_alert_enabled = data.over_heat_alert_enabled ? true:false;
        this.settings.panel_fail_enabled = data.panel_fail_enabled ? true:false;
        this.settings.sensor_fail_alert_enabled = data.sensor_fail_alert_enabled ? true:false;
        this.settings.mcu_disconnect_enabled = data.mcu_disconnect_enabled ? true:false;
        this.settings.email_alert_enabled = data.email_alert_enabled ? true:false;
      } catch (error) { console.error('Error fetching settings:', error); }
    },
    async saveSettings() {
      try {
        await axios.put(`${BASE_API_URL}/api/alert-config/update`, this.settings);
        alert("Alert configuration updated successfully.");
      } catch (error) { console.error('Error saving settings:', error); }
    },
    resetSettings() {
      this.settings = {
        system_alert_enabled: false,
        system_alert_delay: 60,
        over_heat_alert_enabled: true,
        over_heat_alert_delay: 30,
        panel_fail_enabled: true,
        panel_fail_delay: 300,
        sensor_fail_alert_enabled: true,
        sensor_fail_alert_delay: 60,
        mcu_disconnect_enabled: true,
        mcu_disconnect_delay: 300,
        email_alert_enabled: true,
      };  this.saveSettings();
    },
    disableOtherAlerts() {
      this.settings.over_heat_alert_enabled = false;
      this.settings.panel_fail_enabled = false;
      this.settings.sensor_fail_alert_enabled = false;
      this.settings.mcu_disconnect_enabled = false;
      this.settings.email_alert_enabled = false;
    },
  },
};
</script>

<style scoped>
.v-container { max-width: 800px;}
.v-card {
  background-color: #312e2eab;
  margin-top: 5%;
  margin-left: 8%;
  color: white;
}
.custom-label {
  font-size: 1.35rem;
  font-weight: bold;
  color: white;
  white-space: normal;
  word-wrap: break-word;
}
</style>
