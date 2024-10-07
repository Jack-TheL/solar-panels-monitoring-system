<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, reactive, onMounted } from 'vue';
import BASE_API_URL from '@/base-api-url';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const panelId = route.params.panelId;

const formValid = ref(false);
const isEditing = ref(false);
const showPassword = ref(false);

const panelData = reactive({});
const panelBeforeEdit = reactive({});

const fetchPanelData = async () => {
  try {
    const response = await axios.get(`${BASE_API_URL}/api/panels/${panelId}`);
    Object.assign(panelBeforeEdit, response.data);
    Object.assign(panelData, response.data);
  } catch (error) {
    console.error('Error fetching panel data:', error);
  }
};
const submitForm = async () => {
  try {
    if (!formValid.value) {alert('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
    const payload = {
      ...panelData,
      Pmax: parseFloat(panelData.Pmax),
      Imp: parseFloat(panelData.Imp),
      Vmp: parseFloat(panelData.Vmp),
      Isc: parseFloat(panelData.Isc),
      Voc: parseFloat(panelData.Voc),
      min_light: parseInt(panelData.min_light)
    };
    const response = await axios.put(`${BASE_API_URL}/api/update-panel/${panelId}`, payload);
    if (response.status === 200) {
      alert('Updated panel successfully');
      isEditing.value = false;
      Object.assign(panelBeforeEdit, panelData);
    } else { alert('Failed to update panel');}
  } catch (error) {
    console.error('Error updating panel:', error);
    alert('Unable to connect to the server. Please try again later.');
  }
};
const deletePanel = async () => {
  const confirmDelete = confirm('คุณต้องการลบแผงนี้ใช่หรือไม่?');
  if (!confirmDelete) return;
  try {
    const response = await axios.delete(`${BASE_API_URL}/api/delete-panel/${panelId}`);
    if (response.status === 200) {
      alert('Delete panel successfully');
      router.replace({ name: 'panels' }); ;
    } else { alert('Failed to delete panel'); }
  } catch (error) {
    console.error('Error deleting panel:', error);
    alert('Unable to connect to the server. Please try again later.');
  }
};
const editSettings = () => { isEditing.value = true;};
const cancelEditing = () => {
  Object.assign(panelData, panelBeforeEdit);
  isEditing.value = false;
};
const togglePassword = () => { showPassword.value = !showPassword.value; };
onMounted(() => { fetchPanelData();});
</script>

<template>
  <v-container class="dark-theme" fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="mx-auto my-4" max-width="100%">
          <v-card-title class="text-h5 text-center">กำหนด/แก้ไขค่าโซล่าเซลล์แผงใหม่</v-card-title>
          <v-form ref="solarForm" v-model="formValid">
            <v-card-text>
              <!-- Solar Panel Setup -->
              <h3 class="text-h6">ข้อมูลแผงโซล่าเซลล์</h3>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="panelData.name"
                    label="Panel Name"
                    :readonly="!isEditing"
                    outlined required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-textarea
                    v-model="panelData.location"
                    label="Panel Location"
                    :readonly="!isEditing"
                    rows="3" outlined auto-grow
                  ></v-textarea>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="panelData.Pmax"
                    label="Maximum Power (W)"
                    type="number" :readonly="!isEditing"
                    outlined required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="panelData.Imp"
                    label="Maximum Current (A)"
                    type="number" :readonly="!isEditing"
                    outlined required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="panelData.Vmp"
                    label="Maximum Voltage (V)"
                    type="number" :readonly="!isEditing"
                    outlined required
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="panelData.Isc"
                    label="Short Circuit Current (A)"
                    type="number" :readonly="!isEditing"
                    outlined required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="panelData.Voc"
                    label="Open Circuit Voltage (V)"
                    type="number" :readonly="!isEditing"
                    outlined required
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-divider class="my-4"></v-divider>
              <h3 class="text-h6">กำหนดอุณหภูมิและความเข้มแสงที่จะแจ้งเตือน</h3>
              <v-row>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="panelData.min_temp"
                    label="Min Operating Temp (°C)"
                    type="number" :readonly="!isEditing"
                    outlined required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="panelData.max_temp"
                    label="Max Operating Temp (°C)"
                    type="number" :readonly="!isEditing"
                    outlined required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="panelData.min_light"
                    label="Min Operating Light (Lux)"
                    type="number" :readonly="!isEditing"
                    outlined required
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-divider class="my-4"></v-divider>
              <div class="mb-4">
                <h3 class="text-h6">กำหนดความเร็วพัดลมแต่ละระดับ</h3>
                <v-row>
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model="panelData.fan_lv1"
                      label="Level 1 (%)"
                      type="number" :readonly="!isEditing"
                      outlined required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model="panelData.fan_lv2"
                      label="Level 2 (%)"
                      type="number" :readonly="!isEditing"
                      outlined required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-text-field
                      v-model="panelData.fan_lv3"
                      label="Level 3 (%)"
                      type="number" :readonly="!isEditing"
                      outlined required
                    ></v-text-field>
                  </v-col>
                </v-row>
              </div>
              <v-divider class="my-4"></v-divider>
              <!-- Wi-Fi Settings -->
              <h3 class="text-h6">ชื่อและรหัสไวไฟ</h3>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="panelData.ssid"
                    label="WiFi Name" :readonly="!isEditing"
                    outlined required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="panelData.password"
                    :type="showPassword ? 'text' : 'password'"
                    label="WiFi Password" :readonly="!isEditing"
                    outlined requiredd
                  >
                    <template v-slot:append>
                      <v-btn icon @click="togglePassword" theme="dark">
                        <v-icon>{{ showPassword ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                      </v-btn>
                    </template>
                  </v-text-field>
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-actions>
              <!-- ปุ่มสำหรับ Edit, Save, Cancel, Delete -->
              <v-row justify="center">
                <v-btn color="green" @click="editSettings" v-if="!isEditing">Edit</v-btn>
                <v-btn color="blue" @click="submitForm" :disabled="!formValid" v-if="isEditing">Save</v-btn>
                <v-btn color="orange" @click="cancelEditing" v-if="isEditing">Cancel</v-btn>
                <v-btn color="red" @click="deletePanel" v-if="isEditing">Delete Panel</v-btn>
              </v-row>
            </v-card-actions>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-container.dark-theme {
  background-color: #121212;
  color: white;
  min-height: 100vh;
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
