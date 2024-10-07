<script setup>
import { ref, watch, onMounted, onUnmounted  } from 'vue';
import axios from 'axios';

const props = defineProps({
  panelName: {
    type: String,
    required: true
  },
  apiEndpoint: {
    type: String,
    required: true
  },
});

const timeout = ref();
const livePanelData = ref({
  current: 'N/A',
  voltage: 'N/A',
  power: 'N/A',
  temperature: 'N/A',
  light: 'N/A'
});
// ฟังก์ชันดึงข้อมูลจาก API
const fetchData = async () => {
  if (!props.apiEndpoint) {
    console.error('API endpoint is not provided');
    return;
  }
  try {
    const response = await axios.get(props.apiEndpoint);
    livePanelData.value = response.data;
    Object.keys(livePanelData.value).forEach(key => { 
      livePanelData.value[key] = parseFloat(livePanelData.value[key]).toFixed(2);
    });
  } catch (error) { console.error('Error fetching data:', error); }
};
watch(
  () => props.apiEndpoint,
  (newEndpoint) => { if (newEndpoint) { fetchData(); }}, // ดึงข้อมูลใหม่เมื่อ endpoint เปลี่ยน
  { immediate: true } // เรียก fetchData ทันทีเมื่อคอมโพเนนต์ mount
);
onMounted(() => {
  fetchData(); timeout.value = setInterval(fetchData, 10000);
});

onUnmounted(() => { clearInterval(timeout.value);  });
</script>

<template>
  <div class="dashboard">
    <!-- Title -->
    <h2 class="title">ชื่อ : {{ panelName }}</h2>
    <!-- Power (Full Width) -->
    <div class="data-card full-width">
      <h3>กำลังการผลิตไฟฟ้า</h3>
        <p v-if="isNaN(livePanelData.power)">N/A</p>
        <p v-else-if="livePanelData.power >= 1000"> {{ livePanelData.power/1000 }} W</p>
        <p v-else>{{ livePanelData.power }} mW</p>
    </div>
    <!-- Voltage and Current (Half Width Each) -->
    <div class="half-width-container">
      <div class="data-card half-width">
        <h3>แรงดันไฟฟ้า</h3>
        <p>{{ isNaN(livePanelData.voltage) ? 'N/A' : `${livePanelData.voltage} V` }}</p>
      </div>
      <div class="data-card half-width">
        <h3>กระแสไฟฟ้า</h3>
        <p v-if="isNaN(livePanelData.current)">N/A</p>
        <p v-else-if="livePanelData.current >= 1000"> {{ livePanelData.current/1000 }} A</p>
        <p v-else>{{ livePanelData.current }} mA</p>
      </div>
    </div>
    <!-- Temperature and Light (Half Width Each) -->
    <div class="half-width-container">
      <div class="data-card half-width">
        <h3>อุณหภูมิ</h3>
        <p>{{ isNaN(livePanelData.temperature)? 'N/A' : `${livePanelData.temperature} °C` }} </p>
      </div>
      <div class="data-card half-width">
        <h3>ความเข้มแสง</h3>
        <p v-if="isNaN(livePanelData.light)">N/A</p>
        <p v-else-if="livePanelData.light >= 1000"> {{ (livePanelData.light/1000).toFixed(2) }} klx</p>
        <p v-else>{{ livePanelData.light }} lx</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { padding: 10px; }
.title {
  font-size: 1.7em;
  margin-bottom: 20px;
  text-align: center;
}
.data-card {
  background-color: #1e8e08;
  border-radius: 8px;
  margin: 10px 0;
  padding: 15px;
  text-align: center;
}
.data-card h3 {
  margin: 0;
  font-size: 1.3em;
}
.data-card p {
  font-size: 1.3em;
  margin: 10px 0 0 0;
}
.full-width { width: 100%; }
.half-width-container {
  display: flex;
  justify-content: space-between;
}
.half-width { width: 48%; }
</style>
