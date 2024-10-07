<script setup>
import ReportPanelData from '@/components/ReportPanelData.vue';
import SelectPanel from '@/components/SelectPanel.vue';
import LineChart from '@/components/LineChart.vue';
import BASE_API_URL from '@/base-api-url';
import axios from 'axios';
</script>

<template>
  <div class="chart-container">
    <div class="selection-container">
      <label for="panel"> ชื่อ: {{panel.name || "N/A"}}</label>
      <SelectPanel @panel-selected="handlePanelSelected" />
      <v-date-input
      v-model="days"
      label="Select range"
      max-width="368"
      multiple="range"
      ></v-date-input>
    </div>
    <div class="full-row">
      <LineChart 
        title="กำลังการผลิตไฟฟ้า"
        unit=" mW"
        :panelName="panel.name" 
        :days="getDaysRange()" 
        :dataPoints="panel.power" />
    </div>
    <div class="half-row">
      <div class="chart-wrapper">
        <LineChart 
          title="แรงดันไฟฟ้า"
          unit=" V" 
          :panelName="panel.name" 
          :days="getDaysRange()"            
          :dataPoints="panel.voltage" />
      </div>
      <div class="chart-wrapper">
        <LineChart
         title="กระแสไฟฟ้า" 
          unit=" mA"
        :panelName="panel.name" 
        :days="getDaysRange()"
        :dataPoints="panel.current" />
      </div>
    </div>
    <div class="half-row">
      <div class="chart-wrapper">
        <LineChart 
          title="ความเข้มแสง"
          unit=" lx"
         :panelName="panel.name" 
         :days="getDaysRange()" 
         :dataPoints="panel.light" />
      </div>
      <div class="chart-wrapper">
        <LineChart 
          title="อุณหภูมิ" 
          unit="°C"
          :panelName="panel.name" 
          :days="getDaysRange()"
          :dataPoints="panel.temperature" />
      </div>
    </div>
    <div>
      <ReportPanelData
        :title="getDaysRange()"
        :power="panel.power"
        :voltage="panel.voltage"
        :current="panel.current"
        :temperature="panel.temperature"
        :light="panel.light"
      />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      days: [],
      panel: {
        id: null, name: '',
        current: [], voltage: [],
        power: [], temperature: [],
        light: []
      },
    };
  },
  watch: { days(newDays) {if (newDays.length > 0) { this.fetchData(); }}},
  methods: {
    async fetchData() {
      try {
        const start = new Date(this.days[0]);
        let end = new Date(this.days[this.days.length - 1]);
        const response = await axios.post(`${BASE_API_URL}/api/report-data`, {
          panelId: this.panel.id,  // ส่ง id แผง
          startDate: start.toISOString(),
          endDate : end.toISOString()
        });
        const data = response.data;
        this.panel.power = data.power;
        this.panel.voltage = data.voltage;
        this.panel.current = data.current;
        this.panel.temperature = data.temperature;
        this.panel.light = data.light;
      } catch (error) { console.error('Error fetching data:', error); }
    },
    handlePanelSelected(panel) {
      this.panel.id = panel.id;
      this.panel.name = panel.name;
      this.fetchData();
    },
    getDaysRange(){
      if(this.days.length < 1){ return "N/A"}
      const startDate = new Date(this.days[0]);
      const startDay = startDate.getDate();
      const startMonth = startDate.getMonth() + 1;
      const startYear = startDate.getFullYear()
      if(this.days.length > 1) {
        const endDate = new Date(this.days[this.days.length-1]);
        const endDay = endDate.getDate();
        const endMonth = endDate.getMonth() + 1;
        const endYear = endDate.getFullYear()
        return `${startDay}/${startMonth}/${startYear} ถึง ${endDay}/${endMonth}/${endYear} `
      }
      return `${startDay}/${startMonth}/${startYear}`
    }
  },
};
</script>

<style scoped>
.chart-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: #1e1e1e; 
  padding: 20px;
  margin: 0 auto;
}
.selection-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}
.days-select {
  padding: 8px;
  border: 1px solid #333;
  border-radius: 4px;
  background-color: #333;
  color: #fff;
  font-size: 14px;
}
.full-row {
  width: 100%;
  padding: 10px;
  background-color: #2c2c2c; 
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); 
  border-radius: 10px; 
}
.half-row {
  display: flex;
  gap: 16px; 
}
.chart-wrapper {
  flex: 1; 
  padding: 10px;
  background-color: #2c2c2c; 
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  border-radius: 10px;
}
.chart-container * {
  color: #ffffff; 
}
.chart-container .MultiSeriesLineChart {
  background-color: transparent; 
  border: none; 
  padding: 0; 
  border-radius: 0; 
}
.chart-wrapper .MultiSeriesLineChart {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
