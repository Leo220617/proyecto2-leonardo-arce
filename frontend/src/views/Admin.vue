<script setup>
import { ref } from 'vue';
import { api } from '../api';

const msg = ref('');
async function apply() {
  msg.value = 'Procesando...';
  try {
    const r = await api.apply();
    msg.value = `Aplicadas: ${r.applied}`;
  } catch (e) { msg.value = e.message; }
}
</script>

<template>
  <div>
    <h2>Administración</h2>
    <p>Esta vista ejecuta el <strong>enlace especial</strong> que procesa las solicitudes pendientes desde RabbitMQ.</p>
    <button @click="apply">Aplicar solicitudes</button>
    <p>{{ msg }}</p>
  </div>
</template>
