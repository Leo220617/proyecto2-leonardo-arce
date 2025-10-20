<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';
import { useRoute } from 'vue-router';

const route = useRoute();
const author = ref(null);
const books = ref([]);
const error = ref('');

onMounted(async () => {
  try {
    const { author: a, books: b } = await api.getAuthor(route.params.id);
    author.value = a; books.value = b;
  } catch (e) { error.value = e.message; }
});
</script>

<template>
  <div>
    <h2>{{ author?.name }}</h2>
    <p>{{ author?.bio }}</p>
    <h3>Libros</h3>
    <ul>
      <li v-for="b in books" :key="b._id">{{ b.title }} ({{ b.year }})</li>
    </ul>
    <p v-if="error">{{ error }}</p>
  </div>
</template>
