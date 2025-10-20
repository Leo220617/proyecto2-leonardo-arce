<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'

const route = useRoute()
const router = useRouter()

const book = ref(null)
const loading = ref(false)
const msg = ref('')

const title = computed(() => book.value?.title ?? 'Libro')

async function load() {
  loading.value = true
  msg.value = 'Cargando…'
  try {
    // No hay endpoint /books/:id en el backend, así que cargamos todos y filtramos.
    const books = await api.listBooks() // ya viene con author populate (name)
    const found = books.find(b => b._id === route.params.id)
    if (!found) {
      msg.value = 'Libro no encontrado'
      return
    }
    book.value = found
    msg.value = ''
  } catch (e) {
    msg.value = e.message || 'Error cargando libro'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/books')
}

onMounted(load)
</script>

<template>
  <section style="max-width:800px;margin:1rem auto;padding:1rem;">
    <button @click="goBack" style="margin-bottom:1rem;">← Volver a libros</button>

    <h1 style="margin:.25rem 0">{{ title }}</h1>
    <p v-if="loading">Cargando…</p>
    <p v-if="msg && !loading" style="opacity:.8">{{ msg }}</p>

    <div v-if="book && !loading"
         style="border:1px solid #e5e7eb;border-radius:10px;padding:1rem;">
      <div style="display:grid;grid-template-columns:160px 1fr;gap:.75rem;align-items:start;">
        <div style="color:#6b7280;">Título</div>
        <div>{{ book.title }}</div>

        <div style="color:#6b7280;">Autor</div>
        <div>
          <!-- author puede venir como objeto (populate) o id -->
          <template v-if="book.author && typeof book.author === 'object'">
            {{ book.author.name }}
          </template>
          <template v-else>
            {{ book.author }}
          </template>
        </div>

        <div style="color:#6b7280;">Año</div>
        <div>{{ book.year ?? '—' }}</div>

        <div style="color:#6b7280;">ID</div>
        <div><code>{{ book._id }}</code></div>
      </div>
    </div>
  </section>
</template>
