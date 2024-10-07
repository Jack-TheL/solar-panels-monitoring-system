<template>
  <p> วันที่ {{ currentDateTime }} </p>
</template>

<script>
export default {
  data() {
    return {
      timeout: null,
      currentDateTime: new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  },
  methods: {
    updateCurrentDateTime() {
      this.currentDateTime = new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  },
  mounted() { this.timeout = setInterval(this.updateCurrentDateTime, 1000) },
  unmounted() { clearTimeout(this.timeout) }
}
</script>

<style scoped>
p { font-size: 23px; }
</style>