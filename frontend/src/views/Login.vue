<script setup>
import { ref } from 'vue'
import { api } from '../api'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('admin')
const password = ref('admin')
const msg = ref('')

async function doLogin () {
  msg.value = 'Autenticando...'
  try {
    await api.login(username.value, password.value)
    msg.value = 'Autenticado ✅'
    router.push('/authors')
  } catch (e) {
    msg.value = e.message || 'Error de login'
  }
}

async function doRegister () {
  msg.value = 'Registrando...'
  try {
    await api.register(username.value, password.value)
    // opcional: loguea automáticamente tras registrar
    await api.login(username.value, password.value)
    msg.value = 'Registrado y autenticado ✅'
    router.push('/authors')
  } catch (e) {
    msg.value = e.message || 'Error de registro'
  }
}
</script>

<template>
  <div style="max-width:360px;">
    <h2>Autenticación</h2>
    <label>Usuario <input v-model="username" /></label>
    <label>Clave <input type="password" v-model="password" /></label>

    <div style="display:flex; gap:.5rem; margin:.5rem 0;">
      <button @click="doLogin">Login</button>
      <button @click="doRegister">Registrar</button>
    </div>

    <p>{{ msg }}</p>
  </div>
</template>
