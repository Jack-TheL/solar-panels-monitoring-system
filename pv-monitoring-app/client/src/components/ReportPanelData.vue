<script setup>
defineProps({
  title: { type: String, required: true },
  power: { type: Array, required: true },
  voltage: {type: Array,required: true},
  current: {type: Array,required: true},
  temperature: {type: Array,required: true},
  light: {type: Array,required: true}
})
</script>

<template>
  <v-container class="stats-container" fluid>
    <v-row>
      <v-col>
        <!-- ไตเติล -->
        <v-card elevation="3" class="pa-5 text-center" color="primary" dark>
          <h1 class="stats-title">สรุปข้อมูลวันที่ {{ title }}</h1>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="stats-grid" dense>
      <v-col cols="12" sm="6" md="4" >
        <v-card elevation="2" class="pa-4" theme="dark">
          <v-icon color="orange">mdi-flash</v-icon> 
          <br /> พลังงานผลิตทั้งหมด <br /> 
          <span class="stat-value">
            {{ getEnergyProduced() }}</span>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <v-card elevation="2" class="pa-4" theme="dark">
          <v-icon color="orange">mdi-wind-turbine</v-icon> 
          <br /> กำลังการผลิตต่ำสุด: <span class="stat-value">
            {{ (getMin(power)/1000).toFixed(2) }} W</span> 
          <br /> กำลังการผลิตเฉลี่ย: <span class="stat-value">
            {{ (getAvg(power)/1000).toFixed(2) }} W</span>
          <br /> กำลังการผลิตสูงสุด: <span class="stat-value">
            {{ (getMax(power)/1000).toFixed(2) }} W</span>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <v-card elevation="2" class="pa-4" theme="dark">
          <v-icon color="orange">mdi-battery</v-icon>
          <br /> แรงดันต่ำสุด: <span class="stat-value">
            {{ getMin(voltage) }} V</span>
          <br /> แรงดันเฉลี่ย: <span class="stat-value">
            {{ getAvg(voltage) }} V</span>
          <br /> แรงดันสูงสุด: <span class="stat-value">
            {{ getMax(voltage) }} V</span>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <v-card elevation="2" class="pa-4" theme="dark">
          <v-icon color="orange">mdi-current-ac</v-icon>
          <br /> กระแสต่ำสุด: <span class="stat-value">
            {{ getMin(current) }} mA</span>
          <br /> กระแสเฉลี่ย: <span class="stat-value">
            {{ getAvg(current) }} mA</span>
          <br /> กระแสสูงสุด: <span class="stat-value">
            {{ getMax(current) }} mA</span>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card elevation="2" class="pa-4" theme="dark">
          <v-icon color="orange">mdi-thermometer</v-icon>
          <br />อุณหภูมิต่ำสุด: <span class="stat-value">
            {{ getMin(temperature) }} °C</span>
          <br /> อุณหภูมิเฉลี่ย: <span class="stat-value">
            {{ getAvg(temperature) }} °C</span>
          <br /> อุณหภูมิสูงสุด: <span class="stat-value">
            {{ getMax(temperature) }} °C</span>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card elevation="2" class="pa-4" theme="dark">
          <v-icon color="orange">mdi-weather-sunny</v-icon>
          <br /> ความเข้มแสงต่ำสุด: <span class="stat-value">
            {{ getMin(light) }} lx</span>
          <br /> ความเข้มแสงเฉลี่ย: <span class="stat-value">
            {{ getAvg(light) }} lx</span>
          <br /> ความเข้มแสงสูงสุด: <span class="stat-value">
            {{ getMax(light) }} lx</span>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  methods: {
    getMin(arr) {
      if (arr.length === 0) { return "N/A"; }
      const filteredArr = arr.map(obj => obj.y).filter(y => y !== null);
      return filteredArr.length > 0 ? Math.min(...filteredArr).toFixed(2) : "N/A";
    },
    getMax(arr) {
      if (arr.length === 0) { return "N/A"; }
      const validValues = arr.map(obj => obj.y).filter(y => y !== null);
      return validValues.length > 0 ? Math.max(...validValues).toFixed(2) : "N/A";
    },
    getAvg(arr) {
      if (arr.length === 0) { return "N/A"; }
      const validValues = arr.map(obj => obj.y).filter(y => y !== null);
      if (validValues.length === 0) { return "N/A"; }
      const sum = validValues.reduce((acc, y) => acc + y, 0);
      return (sum / validValues.length).toFixed(2);
    },
    getEnergyProduced() {
      let en = this.getAvg(this.power) * this.getTimeDifference(this.power);
      if(!en) {return "N/A"}
      return en>=1000 ? `${(en/1000).toFixed(2)} Wh` : `${en.toFixed(2)} mWh`
    },
    getTimeDifference(arr) {
      const filteredArr = arr.filter(obj => obj.y !== null);
      if (filteredArr.length > 0) {
        const firstDate = new Date(filteredArr[0].x);
        const lastDate = new Date(filteredArr[filteredArr.length - 1].x);
        const timeDiff = lastDate - firstDate;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        return hoursDiff.toFixed(2);
      } else { return "N/A"; }
    },
  },
}
</script>

<style scoped>
.stats-container {
  background-color: #2c2c2c;
  padding: 40px;
  border-radius: 15px;
  margin: 0 auto;
  text-align: center;
}
.stats-title {
  color: #ffffff;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 20px;
  text-transform: uppercase;
}
.stat-value {
  color: #f5a623;
  font-weight: bold;
}
</style>
