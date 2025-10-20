<script setup>
import { ref } from 'vue';
import { api } from '../api';

const name = ref('');
const bio = ref('');
const msg = ref('');

async function add() {
  msg.value = '';
  try {
    await api.queue({ entity: 'author', action: 'create', data: { name: name.value, bio: bio.value } });
    msg.value = 'Solicitud encolada. Recuerde ejecutar "Aplicar" en Admin.';
    name.value=''; bio.value='';
    emit('queued');
  } catch (e) { msg.value = e.message; }
}

const emit = defineEmits(['queued']);
</script>

<template>
  <div style="margin:.5rem 0;">
    <input v-model="name" placeholder="Nombre" />
    <input v-model="bio" placeholder="Bio" />
    <button @click="add">Agregar (diferido)</button>
    <span>{{ msg }}</span>
  </div>
</template>
