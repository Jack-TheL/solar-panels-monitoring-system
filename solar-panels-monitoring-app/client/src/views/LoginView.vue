<script setup>  
import BASE_API_URL from '@/base-api-url'; 
import axios from 'axios';
</script>

<template>
  <div class="form-container">
    <v-img class="mx-auto my-6" max-width="228" src="/app_Logo.png"></v-img>  
    <v-card class="mx-auto pa-12 pb-4" elevation="8" max-width="448" rounded="lg">
      <div class="text-center">
        <h2 class="text-h4">ยินดีตอนรับ</h2>
        <br />
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="text-subtitle-1 text-medium-emphasis">Username or Email</div>
        <v-text-field
          v-model="form.username"
          density="compact"
          placeholder="Enter your username"
          variant="outlined"
          required
        ></v-text-field>
        <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between">
          Password
        </div>
        <v-text-field
          v-model="form.password"
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          density="compact"
          placeholder="Enter your password"
          variant="outlined"
          @click:append-inner="visible = !visible"
          required
        ></v-text-field>
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-btn class="mb-8" color="blue" size="large" variant="tonal" block type="submit">
          Sign in
        </v-btn>
      </form>
    </v-card>
  </div>
</template>

<script>
export default {
  data: () => ({
    visible: false,
    form: {
      username: '',
      password: ''
    },
    errorMessage: ''
  }),
  methods: {
    async handleSubmit() {
      try {
        const userData = localStorage.getItem('user');
        if (userData) { alert(JSON.parse(userData));localStorage.clear()} 
        const response = await axios.post(`${BASE_API_URL}/api/login`, {
          usernameOrEmail: this.form.username,
          password: this.form.password
        });
        const result = response.data;
        console.log(result.user.id)
        if (response.status === 200 && result.success) {
          await axios.post(`${BASE_API_URL}/api/save-history`, {
            login: true,
            userId: result.user.id
          });
          // เก็บข้อมูลผู้ใช้ใน localStorage หรือ sessionStorage
          localStorage.setItem('user', JSON.stringify(result.user));
          this.$router.push({ name: 'home' });
        } else {
          this.errorMessage = result.message || 'Invalid username or password';
        }
      } catch (error) {
        console.error('Error during login:', error);
        this.errorMessage = error.response.data.message;
        // this.errorMessage = 'Unable to connect to the server. Please try again later.';
      }
    }
  }
};
</script>

<style scoped>
.form-container {
  padding: 2%;
}
.v-card {
  width: 450px;
  padding: 24px 32px;
}
.text-h2,
.text-h4 { 
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 16px;
}
</style>
