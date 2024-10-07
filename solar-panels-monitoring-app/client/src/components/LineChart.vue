<script setup>
import { defineProps, watch, ref } from 'vue';

const props = defineProps({
  title: {    type: String, required: true },
  panelName: { type: String, required: true},
  days: { type: String, required: true },
  unit: { type: String, required: true },
  dataPoints: { type: Array, required: true },
});

// Create a reactive reference for the chart options
const options = ref({});

// Watch for changes in dataPoints and update options accordingly
watch(() => props.dataPoints, (newDataPoints) => {
  const formattedDataPoints = newDataPoints.map(point => ({
    ...point,
    x: new Date(point.x),
  }));

  options.value = {
    theme: 'dark2',
    animationEnabled: true,
    exportEnabled: true,
    title: { text: props.title },
    subtitles: [{ text: `ข้อมูล${props.title}วันที่ ${props.days}` }],
    axisX: {
      valueFormatString: 'DD MMM',
      interval: 1,
      intervalType: 'day'
    },
    axisY: { suffix: props.unit },
    toolTip: { shared: true },
    data: [
      {
        type: 'spline',
        xValueFormatString: 'DD MMM HH:mm',
        yValueFormatString: '#,###.##' + props.unit,
        name: props.panelName,
        color:'#34f400',
        dataPoints: formattedDataPoints
      },
    ]
  };
}, { immediate: true }); // Run immediately on component mount
</script>

<template>
  <CanvasJSChart :options="options" :style="styleOptions" />
</template>

<script>
export default {
  data() { return { styleOptions: { width: '100%', height: '230px' } } }
}
</script>
