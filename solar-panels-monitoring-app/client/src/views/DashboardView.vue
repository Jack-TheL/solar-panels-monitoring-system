<script setup>
import DynamicLineChart from '@/components/DynamicLineChart.vue';
import CurrentDateTimeVue from '@/components/CurrentDateTime.vue';
import DashboardLiveData from '@/components/DashboardLiveData.vue';
import SelectPanel from '@/components/SelectPanel.vue';
import BASE_API_URL from '@/base-api-url';
import { ref, reactive } from 'vue';
import axios from 'axios'

// Define reactive variables
const selectedPanelId = ref();
const selectedPanelName = ref('N/A');
const apiURL = ref(`${BASE_API_URL}`);
const componentKey = ref(0);
let initChartData = reactive({ power: [], voltage: [], current: [], temperature: [], light: [] });

const fetchInitData = async () => {
  try {
    const response = await axios.get(`${BASE_API_URL}/api/dashboard-chart/${selectedPanelId.value}`);
    const data = response.data;
    initChartData.power = data.power.map(data => ({x:data.x, y:data.y/1000}));
    initChartData.current = data.current;
    initChartData.voltage  = data.voltage;
    initChartData.temperature = data.temperature;
    initChartData.light = data.light;
    componentKey.value += 1
  } catch (error) {
    initChartData = { power: [], voltage: [], current: [], temperature: [], light: [] };
    componentKey.value += 1
    console.error('Error fetching panel data:', error);
  }
};

// Handle panel selection
const handlePanelSelected = (panel) => {
  selectedPanelId.value = panel.id;
  selectedPanelName.value = panel.name;
  apiURL.value = `${BASE_API_URL}/api/live-data/${selectedPanelId.value}`;
  fetchInitData();
  // componentKey.value += 1
};

</script>

<template>
  <div id="live-dashboard">
    <div class="main-content">
      <!-- Chart Widgets -->
      <div class="charts">
        <div class="chart-container full-width">
          <div>{{}}</div>
          <DynamicLineChart
            title="กำลังกำผลิตไฟฟ้าเวลาปัจจุบัน"
            dataType="power"
            unit="W"
            :initDataPoints="initChartData.power"
            :panelName="selectedPanelName"
            :apiEndpoint="apiURL"
            :key="componentKey"
          />
        </div>
        <div class="chart-container half-width">
          <DynamicLineChart
            title="แรงดันไฟฟ้าเวลาปัจจุบัน"
            dataType="voltage"
            unit="V"
            :initDataPoints="initChartData.voltage"
            :panelName="selectedPanelName"
            :apiEndpoint="apiURL"
            :key="componentKey"
          />
        </div>
        <div class="chart-container half-width">
          <DynamicLineChart
            title="กระแสไฟฟ้าเวลาปัจจุบัน"
            dataType="current"
            unit="mA"
            :initDataPoints="initChartData.current"
            :panelName="selectedPanelName"
            :apiEndpoint="apiURL"
            :key="componentKey"
          />
        </div>
        <div class="chart-container half-width">
          <DynamicLineChart
            title="ความเข้มแสงเวลาปัจจุบัน"
            dataType="light"
            unit="Lux"
            :initDataPoints="initChartData.light"
            :panelName="selectedPanelName"
            :apiEndpoint="apiURL"
            :key="componentKey"
          />
        </div>
        <div class="chart-container half-width">
          <DynamicLineChart
            title="อุณหภูมิเวลาปัจจุบัน"
            dataType="temperature"
            unit="°C"
            :initDataPoints="initChartData.temperature"
            :panelName="selectedPanelName"
            :apiEndpoint="apiURL"
            :key="componentKey"
          />
        </div>
      </div>
      <!-- Right Side Widgets -->
      <div class="right-side-widgets">
        <div class="widget">
          <SelectPanel @panel-selected="handlePanelSelected" />
        </div>
        <!-- Date Time Widget -->
        <div class="widget">
          <CurrentDateTimeVue />
        </div>
        <!-- Number Widgets -->
        <div class="number-widgets-container">
          <div class="widget number-widget">
            <DashboardLiveData :panelName="selectedPanelName" :apiEndpoint="apiURL"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#live-dashboard {
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: white;
  padding: 9px 20px;
  font-family: Arial, sans-serif;
}
.main-content {
  display: flex;
  width: 100%;
}
.charts {
  display: flex;
  flex-wrap: wrap;
  flex: 3;
  padding: 10px;
}
.right-side-widgets {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 10px;
}
.chart-container {
  background-color: #2e2e2e;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 10px;
  padding: 10px;
}
.chart-container.full-width {
  flex: 1 1 100%;
  height: 263px;
}
.chart-container.half-width {
  flex: 1 1 45%;
  max-width: 50%;
  height: 263px;
}
.number-widgets-container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
}
.number-widget {
  flex: 1 1 calc(50% - 20px);
  background-color: #2e2e2e;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  text-align: center;
}
.widget {
  background-color: #2e2e2e;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 10px;
  padding: 20px;
  text-align: center;
}
</style>
