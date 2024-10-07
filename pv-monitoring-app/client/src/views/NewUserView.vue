<script setup>
import BASE_API_URL from '@/base-api-url';
import axios from 'axios';
</script>
<template>
  <div class="form-container">
    <v-card class="mx-auto pa-12 pb-8 mt-10" elevation="8" max-width="448" rounded="lg">
      <div>
        <h2 class="text-h4 text-center">เพิ่มผู้ใช้ใหม่</h2>
        <br />
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="text-subtitle-1 text-medium-emphasis">Username</div>
        <v-text-field
          v-model="form.username"
          density="compact"
          placeholder="Enter your username"
          variant="outlined"
          required
        ></v-text-field>

        <div class="text-subtitle-1 text-medium-emphasis">Email</div>
        <v-text-field
          v-model="form.email"
          density="compact"
          placeholder="Enter your email"
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

        <div class="text-subtitle-1 text-medium-emphasis">Role</div>
        <v-select
          v-model="form.role"
          :items="['admin', 'user']"
          placeholder="Select role"
          variant="outlined"
          density="compact"
          required
        ></v-select>

        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-btn class="mb-8" color="blue" size="large" variant="tonal" block type="submit">
          Add User
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
      email: '',
      password: '',
      role: ''
    },
    errorMessage: ''
  }),
  methods: {
  async handleSubmit() {
    try {
      const response = await axios.post(`${BASE_API_URL}/api/add-user`, {
        username: this.form.username,
        email: this.form.email,
        password: this.form.password,
        role: this.form.role
      });
      const result = response.data; 
      if (response.status === 201 && result.message === "User added successfully!") {
        alert("User added successfully!");
        this.form.username = '';
        this.form.email = '';
        this.form.password = '';
        this.form.role = '';
      } else {
        this.errorMessage = result.message || 'Failed to add user';
      }
    } catch (error) {
      console.error('Error during user creation:', error);
      this.errorMessage = 'Unable to connect to the server. Please try again later.';
    }
  }
}
};
</script>

<style scoped>
.form-container {
  padding: 2%;
  background-color: #181818;
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
