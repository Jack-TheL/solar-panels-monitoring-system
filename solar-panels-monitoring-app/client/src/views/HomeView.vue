<script setup>
import DynamicLineChart from '@/components/DynamicLineChart.vue';
import CurrentDateTime from '@/components/CurrentDateTime.vue';
import HomePowerChart from '@/components/HomePowerChart.vue';
import SelectPanel from '@/components/SelectPanel.vue';
import HomePanel from '@/components/HomePanel.vue';
import { ref, reactive, onMounted, onUnmounted} from 'vue';
import BASE_API_URL from '@/base-api-url';
import axios from 'axios'

const user = ref(JSON.parse(localStorage.getItem('user')));
const chartKey = ref(0), cardKey = ref(0); const totalKey = ref(0);
const selectedPanelName = ref('N/A');
const apiURL = ref(BASE_API_URL); const apiURL2 = ref(BASE_API_URL);
const currentDate =  new Date();
const selectedPanelId = ref();
const timeout = ref();
// Panel Monitoring
let summary = ref({ totalAttachedPanels: "0", totalPmax: "0", totalWh:"0"});
let inithPowerData = reactive({ power: []});
let inithAllPowerData = reactive([]);

const fetchPaneltData = async () => {
  try {
    const response = await axios.get(`${BASE_API_URL}/api/dashboard-chart/${selectedPanelId.value}`);
    const data = response.data; 
    inithPowerData.power =  data.power.map(data => ({x:data.x, y:data.y/1000}));
    chartKey.value += 1;
  } catch (error) {
    inithPowerData = { power: [] }; chartKey.value += 1;
    console.error('Error fetching panel data:', error);
  }
};
// Handle panel selection
const handlePanelSelected = (panel) => {
  selectedPanelId.value = panel.id;
  selectedPanelName.value = panel.name;
  apiURL.value = `${BASE_API_URL}/api/live-data/${selectedPanelId.value}`;
  cardKey.value += 1; fetchPaneltData();
  // componentKey.value += 1
};

///////////////////////////////
const fetchPanelsData = async () => {
  try{
    if(user.value.role === 'admin'){
      const res = await axios.get(`${BASE_API_URL}/api/summary/admin`);
      summary.value = res.data;
    }
    else{
      const res = await axios.get(`${BASE_API_URL}/api/summary/${user.value.id}`);
      summary.value = res.data;
    }
  }catch (error){ console.error('Error fetching panel data:', error); }
};

const PanelsPowerChart = async () => {
  try{
    if(user.value.role === 'admin'){
      const res = await axios.get(`${BASE_API_URL}/api/total-power-init/admin`);
      inithAllPowerData = res.data; totalKey.value++;
      apiURL2.value = `${BASE_API_URL}/api/total-power-live/admin`;
    }
    else{
      const res = await axios.get(`${BASE_API_URL}/api/total-power-init/${user.value.id}`);
      inithAllPowerData = res.data; totalKey.value++;
      apiURL2.value = `${BASE_API_URL}/api/total-power-live/${user.value.id}`;
    }
  }catch (error){ console.error('Error fetching panel data:', error); }
};

onMounted(() => { 
  PanelsPowerChart(); fetchPanelsData(); 
  timeout.value = setInterval(fetchPanelsData, 360*1000);
});
onUnmounted(() => { clearInterval(timeout.value);  });
</script>

<template>
  <v-container fluid style="background-color: #121212;">
    <!-- Top Bar -->
    <v-row class="d-flex justify-space-between align-center" style="margin: 0;">
      <v-col cols="8">
        <v-chip color="teal" class="mx-1">แผงโซล่าเซลล์ {{summary.totalAttachedPanels}} แผง</v-chip>
        <v-chip color="teal" class="mx-1">เซ็นเซอร์กระแสและแรงดัน {{summary.totalAttachedPanels}} ตัว</v-chip>
        <v-chip color="teal" class="mx-1">เซ็นเซอร์แสง {{summary.totalAttachedPanels}} ตัว</v-chip>
        <v-chip color="teal" class="mx-1">เซ็นเซอร์อุณหภูมิ {{summary.totalAttachedPanels}} ตัว</v-chip>
        <v-chip color="teal" class="mx-1">พัดลม {{summary.totalAttachedPanels*2}} ตัว</v-chip>
      </v-col>
      <v-col cols="4" class="d-flex justify-end">
        <!-- <v-btn v-if="user.role==='admin'" color="orange" dark @click="sentSpeed">เลือกผู้ใช้</v-btn> -->
        <CurrentDateTime class="text-white "/>
      </v-col>
    </v-row>
    <!-- Panel Monitoring -->
    <v-row>
      <v-col>
        <v-card class="pa-3" color="#1e1e1e" elevation="4">
          <v-card-title class="text-h6 text-white d-flex justify-between align-center">
            Panel Monitoring <v-spacer></v-spacer> ชื่อแผง : {{selectedPanelName}}
            <SelectPanel  @panel-selected="handlePanelSelected" />
          </v-card-title>
          <DynamicLineChart class="mb-2" style="height: 265px;"
            title="กำลังกำผลิตไฟฟ้าของแผงที่เลือกเวลาปัจจุบัน"
            dataType="power"
            unit="W"
            :initDataPoints="inithPowerData.power"
            :panelName="selectedPanelName"
            :apiEndpoint="apiURL"
            :key="chartKey"
          />
          <v-divider></v-divider>
          <HomePanel :apiEndpoint="apiURL" :panelId="selectedPanelId"  :key="cardKey"/>
        </v-card>
      </v-col>
    </v-row>
    <!-- Energy Production and Statistics -->
    <v-row class="mt-4">
      <v-col cols="8">
        <v-card class="pa-3" color="#1e1e1e" elevation="4">
          <v-card-title class="text-h6 text-white">ผลรวมการผลิตพลังานและกำลังไฟฟ้าของทั้งระบบ</v-card-title>
          <v-divider></v-divider>
          <v-row class="mt-2 mb-2">
            <v-col class="text-center">
              <div class="text-white">พลังงานที่ผลิตทั้งหมดของทุกแผง</div>
              <h3 class="text-white">
                {{summary.totalWh>=1000? `${summary.totalWh/1000} kWh`: `${summary.totalWh} Wh`}}
              </h3>
            </v-col>
            <v-col class="text-center">
              <div class="text-white">กำลังการผลิตของทุกแผง (ไม่รวมที่ไม่ระบุ)</div>
              <h3 class="text-white">{{summary.totalPmax}} W</h3>
            </v-col>
          </v-row>
          <HomePowerChart
            title="กำลังการผลิตไฟฟ้าของทัังระบบ"
            dataType="power" unit="W"
            :initDataPoints="inithAllPowerData"
            panelName="ทุกแผงที่ทำงานขณะนี้รวมกัน"
            :apiEndpoint="apiURL2"
            :key="totalKey"
          />
        </v-card>
      </v-col>
      <!-- Date Time Calender -->
      <v-col cols="4">
        <v-card class="pa-3" color="#1e1e1e" elevation="4" style="height: 29.5em;">
          <v-divider></v-divider>
          <v-row>
            <v-col>
              <v-date-picker 
                theme="dark"
                v-model="currentDate"
                show-adjacent-months
                style="width: 100%; height: 90%;">
              </v-date-picker>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-card-title { font-weight: bold; }
.text-white { color: white; }
</style>
