
<script setup>
import BASE_API_URL from '@/base-api-url';
import { ref, watch, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const props = defineProps({
  apiEndpoint: {type: String, required: true },
  panelId: { type: Number, required: false },
});

const timeout = ref();
const panelData = ref({
  totalEnergy: '0',
  Pmax: '',
  power: 'N/A',
  temperature: 'N/A',
  fanSpeed: 'N/A'
});

// ฟังก์ชันดึงข้อมูลจาก API
const fetchData = async () => {
  if (!props.apiEndpoint) {
    console.error('API endpoint is not provided'); return;
  }
  try {
    const response1 = await axios.get(props.apiEndpoint);
    panelData.value.temperature = parseFloat(response1.data.temperature).toFixed(2);
    panelData.value.power = parseFloat(response1.data.power).toFixed(2);
    !isNaN(panelData.value.power) ? '' : panelData.value.power = 'N/A';
    const response2 = await axios.get(`${BASE_API_URL}/api/panel-home`,{
    params: { temp: panelData.value.temperature , panelId: props.panelId } });
    panelData.value.totalEnergy = response2.data.totalEnergy;
    panelData.value.Pmax = response2.data.Pmax;
    panelData.value.fanSpeed = response2.data.fanSpeed;
  } catch (error) {
    panelData.value.Pmax = !error.response.data.Pmax? "ไม่ได้ระบุ" : error.response.data.Pmax;
    console.error('Error fetching data:', error);
  }
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
    <v-row class="mt-2">
        <v-col class="text-center">
            <div class="text-white">พลังงานรวมที่ผลิตทั้งหมด</div>
            <h3 class="text-white">
              {{ panelData.totalEnergy>=1000? `${(panelData.totalEnergy/1000).toFixed(2)} kWh` : `${panelData.totalEnergy} Wh` }}
            </h3>
        </v-col>
        <v-col class="text-center">
            <div class="text-white">กำลังการผลิตสูงสุด</div>
            <h3 class="text-white">{{ panelData.Pmax }} W</h3>
        </v-col>
        <v-col class="text-center">
            <div class="text-white">กำลังการผลิตไฟฟ้าขณะนี้</div>
            <h3 class="text-white">
              {{ panelData.power>=1000? `${panelData.power/1000} W` : `${panelData.power} mW`}}
            </h3>
        </v-col>
        <v-col class="text-center">
            <div class="text-white">อุณหภูมิขณะนี้</div>
            <h3 class="text-white">{{ !isNaN(panelData.temperature) ? panelData.temperature : 'N/A' }} °C</h3>
        </v-col>
        <v-col class="text-center">
            <div class="text-white">ความเร็วพัดลมขณะนี้</div>
            <h3 class="text-white">{{ panelData.fanSpeed }} %</h3>
        </v-col>
    </v-row>
</template>