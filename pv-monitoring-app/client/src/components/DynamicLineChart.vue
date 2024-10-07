<script setup>
import axios from 'axios'
defineProps({
  title: { type: String, required: true },
  panelName: { type: String, required: true },
  unit: { type: String,required: true },
  dataType: { type: String,required: true },
  initDataPoints: { type: Array, required: true },
  apiEndpoint: { type: String, required: true },
})
</script>

<template>
  <CanvasJSChart :options="options" :style="styleOptions" @chart-ref="chartInstance" />
</template>

<script>
export default {
  data() {
    let dataPoints = JSON.parse(JSON.stringify(this.initDataPoints));
    // let yValue = len > 0 ? dataPoints[len - 1] : null;
    // let yValue = dataPoints[dataPoints.length-1]?.y
    let yValue = dataPoints[dataPoints.length-1]?.y ?? null;
    let xValue = dataPoints[dataPoints.length-1]?.x ?? null;

    return {
      chart: null,
      timeout: null,
      NumberOfDataPoints: 90,
      dataPoints: dataPoints, 
      yValue: yValue,
      xValue: xValue,
      updateInterval: 10000,
      options: {
        zoomEnabled: true,
        exportEnabled: true,
        theme: 'dark2',
        title: { text: this.title },
        subtitles: [{ text: 'ข้อมูลเปลี่ยนแปลงเร็วสุด 10 วินาที' }],
        axisX: { valueFormatString: 'H:mm:ss TT' },
        axisY: { suffix: ` ${this.unit}` },
        toolTip: { shared: true },
        data: [{
            type: 'spline',
            name: this.panelName, 
            color: '#FF5733',
            xValueType: 'dateTime',
            yValueFormatString: `##,##0.## ${this.unit}`, // Keep It Like This For Now
            xValueFormatString: 'DDD D MMM YYYY hh:mm:ss TT',
            showInLegend: true,
            legendText: `${this.dataType} - ${yValue} ${this.unit}`,
            dataPoints: dataPoints, 
          },
        ]
      },
      styleOptions: { width: '100%', height: '243px' } //360px Looking Good
    }
  },
  methods: {
    async fetchData() {
      try {
        const response = await axios.get(this.apiEndpoint)
        // console.log(response.data)
        console.log(`Fetched ${this.unit}:`, response.data[this.dataType])
        return response.data[this.dataType]
      } catch (error) {
        console.error(`Error fetching ${this.dataType}:`, error)
        return this.yValue
      }
    },
    async updateChart() {
      this.xValue += this.updateInterval;
      this.yValue = await this.fetchData();
      if(!this.yValue) {return;}
      if(this.dataType==='power'){this.yValue /= 1000;}
      // Pushing the New Values
      this.dataPoints.push({ x: this.xValue, y: this.yValue });
      // Deleting the Oldest Value
      if (this.chart.options.data[0].dataPoints.length > this.NumberOfDataPoints) {
        this.chart.options.data[0].dataPoints.shift()
      }
      this.chart.options.data[0].legendText = `${this.dataType} - ${this.yValue} ${this.unit}`
      this.chart.render()
      this.timeout = setTimeout(this.updateChart, this.updateInterval)
    },
    chartInstance(chart) {
      this.chart = chart
      this.timeout = setTimeout(this.updateChart, this.updateInterval)
    },
  },
  unmounted() { clearTimeout(this.timeout) }
}
</script>
