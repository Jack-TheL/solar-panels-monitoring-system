<script setup>
import { useRoute, useRouter  } from 'vue-router';
import BASE_API_URL from '@/base-api-url';
import { ref, onMounted } from 'vue';
import axios from 'axios';

const originalUserData = ref({});
const editableData = ref({ ...originalUserData.value });
const errorMessage = ref('');
const isEditing = ref(false);
const visible = ref(false);
const userId = ref('');

const route = useRoute();
const router = useRouter();

const fetchUserData = async () => {
  userId.value = route.params.userId;
  try {
    const response = await axios.get(`${BASE_API_URL}/api/user/${userId.value}`);
    if (response.status === 200) {
      originalUserData.value = response.data;
      editableData.value = { ...originalUserData.value };
    } else { errorMessage.value = 'Failed to fetch user data.'; }
  } catch (error) {
    console.error('Error fetching user data:', error);
    errorMessage.value = 'Unable to connect to the server. Please try again later.';
  }
};

const handleEdit = () => {
  isEditing.value = true;
  editableData.value = { ...originalUserData.value };
};

const handleCancel = () => {
  isEditing.value = false;
  editableData.value = { ...originalUserData.value }; 
};
const handleDelete = async () => {
  const confirmDelete = confirm('คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?');
  if (!confirmDelete) return;
  try {
    const response = await axios.delete(`${BASE_API_URL}/api/delete-user/${userId.value}`);
    if (response.status === 200) {
      alert(response.data.message);
      router.replace({ name: 'login-history' }); ;
    } else { alert(response.data.message); }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert(error.response.data.message);
    // alert('Unable to connect to the server. Please try again later.');
  }
};

const handleSubmit = async () => {
  try {
    const updatedUserData = {
      username: editableData.value.username,
      email: editableData.value.email,
      password: editableData.value.password,
      role: editableData.value.role
    };
    const response = await axios.put(`${BASE_API_URL}/api/update-user/${userId.value}`, updatedUserData);
    if (response.status === 200 && response.data.message === "User updated successfully!") {
      alert("User updated successfully!");
      originalUserData.value = { ...editableData.value };
      isEditing.value = false;
    } else { errorMessage.value = response.data.message || 'Failed to update user'; }
  } catch (error) {
    console.error('Error during user update:', error);
    errorMessage.value = 'Unable to connect to the server. Please try again later.';
  }
};
onMounted(fetchUserData);
</script>

<template>
  <div class="form-container">
    <v-card class="mx-auto pa-12 pb-8 mt-10" elevation="8" max-width="448" rounded="lg">
      <div class="text-center">
        <h2 class="text-h4">แก้ไขข้อมูลผู้ใช้</h2>
        <br />
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="text-subtitle-1 text-medium-emphasis">Username</div>
        <v-text-field
          v-model="editableData.username"
          :disabled="!isEditing"
          density="compact"
          placeholder="Enter your username"
          variant="outlined"
          required
        ></v-text-field>
        <div class="text-subtitle-1 text-medium-emphasis">Email</div>
        <v-text-field
          v-model="editableData.email"
          :disabled="!isEditing"
          density="compact"
          placeholder="Enter your email"
          variant="outlined"
          required
        ></v-text-field>
        <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between">
          Password
        </div>
        <v-text-field
          v-model="editableData.password"
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          density="compact"
          placeholder="Enter your password"
          variant="outlined"
          @click:append-inner="visible = !visible"
          :disabled="!isEditing"
          required
        ></v-text-field>
        <div class="text-subtitle-1 text-medium-emphasis">Role</div>
        <v-select
          v-model="editableData.role"
          :items="['admin', 'user']"
          placeholder="Select role"
          variant="outlined"
          density="compact"
          :disabled="!isEditing"
          required
        ></v-select>
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-btn v-if="!isEditing" class="mb-8" color="blue" size="large" variant="tonal" @click="handleEdit">
          Edit
        </v-btn>
        <v-btn v-if="isEditing" class="mb-8" color="green" size="large" variant="tonal" type="submit">
          Save
        </v-btn>
        <v-btn v-if="isEditing" class="mb-8" color="orange" size="large" variant="tonal" @click="handleCancel">
          Cancel
        </v-btn>
        <v-btn v-if="isEditing" class="mb-8 ml-14" color="red" size="large" variant="tonal" @click="handleDelete">
          Delete
        </v-btn>
      </form>
    </v-card>
  </div>
</template>

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
