<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';
import AuthorForm from '../components/AuthorForm.vue';

const authors = ref([]);
const error = ref('');

async function load() {
  try { authors.value = await api.listAuthors(); } catch (e) { error.value = e.message; }
}

onMounted(load);
</script>

<template>
  <div>
    <h2>Autores</h2>
    <AuthorForm @queued="load" />
    <ul>
      <li v-for="a in authors" :key="a._id">
        <router-link :to="`/authors/${a._id}`">{{ a.name }}</router-link>
      </li>
    </ul>
    <p v-if="error">{{ error }}</p>
  </div>
</template>
