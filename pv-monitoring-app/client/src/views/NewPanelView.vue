<script setup>
import BASE_API_URL from '@/base-api-url';
import axios from 'axios';
</script>

<template>
  <v-container class="dark-theme" fluid>
    <v-row justify="center">
      <!-- Card for Form -->
      <v-col cols="12" md="8" lg="6">
        <v-card class="mx-auto my-4" max-width="100%">
          <v-card-title class="text-h5 text-center">เพิ่มแผงโซล่าเซลล์แผงใหม่</v-card-title>
          <v-form ref="solarForm" v-model="formValid">
            <v-card-text>
              <!-- Section 1: Owner Information -->
              <h3 class="text-h6">ข้อมูลเจ้าของแผงโซล่าเซลล์</h3>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="ownerUsername"
                    label="Owner Username"
                    :rules="[rules.required]"
                    outlined required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="ownerEmail"
                    label="Owner Email"
                    type="email"
                    :rules="[rules.required, rules.email]"
                    outlined required
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-divider class="my-4"></v-divider>
              <!-- Section 2: Solar Panel Information -->
              <h3 class="text-h6">ชื่อแผงโซล่าเซลล์</h3>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="panelName"
                    label="Panel Name"
                    :rules="[rules.required]"
                    outlined required
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-divider class="my-4"></v-divider>
              <!-- Section 3: ESP32 Information -->
              <h3 class="text-h6">MQTT Credentials และ MAC Address ของ ESP32</h3>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="mqtt_user"
                    label="Mqtt Username"
                    :rules="[rules.required]"
                    outlined required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="mqtt_pass"
                    label="Mqtt password"
                    :rules="[rules.required]"
                    outlined required
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="macAddress"
                    hint="กรอก MAC Address ในรูปแบบ 00:1A:2B:3C:4D:5E"
                    label="MAC Address"
                    :rules="[rules.required, rules.mac]"
                    outlined required
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-actions>
              <!-- Submit Button -->
              <v-row justify="center">
                <v-btn class="add-btn" @click="submitForm" :disabled="!formValid">Add New Panel</v-btn>
              </v-row>
            </v-card-actions>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      ownerUsername: '', ownerEmail: '',
      panelName: '', macAddress: '',
      mqtt_user:'', mqtt_pass: '',
      formValid: false,
      rules: {
        required: value => !!value || 'Required.',
        email: value => /.+@.+\..+/.test(value) || 'E-mail must be valid.',
        mac: value => /^[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}$/.test(value) || 'MAC Address format must be "00:1A:2B:3C:4D:5E".'
      }
    };
  },
  methods: {
    async submitForm() {
      if (this.$refs.solarForm.validate()) {
        try {
          const payload = {
            ownerUsername: this.ownerUsername,
            ownerEmail: this.ownerEmail,
            panelName: this.panelName,
            macAddress: this.macAddress,
            mqtt_user: this.mqtt_user, 
            mqtt_pass: this.mqtt_pass,
          };
          const response = await axios.post(`${BASE_API_URL}/api/new-panel`, payload);
          const result = response.data;
          if(response.status === 201 && result.message === "Panel added successfully"){
            alert(result.message); 
            this.ownerUsername = '';this.ownerEmail = '';
            this.panelName =  '';this.macAddress = '';
            this.mqtt_user= ''; this.mqtt_pass = '';
          }else{
            alert(result.message); 
          }
        } catch (error) {
          console.error('Error adding solar panel:', error);
          alert("Error adding solar panel");
        }
      } else {
        alert('Please fill out all required fields.');
      }
    }
  }
};
</script>

<style scoped>
.v-container.dark-theme {
  background-color: #121212;
  color: white;
  min-height: 10vh;
  padding: 7% 0px;
}
.v-card {
  background-color: #1e1e1e;
  color: white;
}
.add-btn {
  background-color: #10bfff;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
}
</style>
