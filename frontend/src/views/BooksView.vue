<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '../api'

// estado
const books = ref([])
const authors = ref([])
const loading = ref(false)
const msg = ref('')
const form = ref({ _id: null, title: '', author: '', year: '' })

const isEditing = computed(() => !!form.value._id)

// helpers
function resetForm () {
  form.value = { _id: null, title: '', author: '', year: '' }
}

async function loadData () {
  loading.value = true
  msg.value = 'Cargando...'
  try {
    const [b, me] = await Promise.all([
      api.listBooks(),
      api.me() // fuerza cookie/estado
    ])
    books.value = b
    // authors vienen populados en books? Si no, cargamos por authors endpoint
    // mejor jalamos la lista desde /authors para el select:
    const allAuthors = await api.listAuthors()
    authors.value = allAuthors
    msg.value = ''
  } catch (e) {
    msg.value = e.message || 'Error cargando datos'
  } finally {
    loading.value = false
  }
}

// CRUD via cola
async function queueCreate () {
  if (!form.value.title || !form.value.author) {
    msg.value = 'Título y Autor son obligatorios'
    return
  }
  loading.value = true
  msg.value = 'Enviando a cola...'
  try {
    await api.queue({
      entity: 'book',
      action: 'create',
      data: {
        title: form.value.title,
        author: form.value.author,
        year: form.value.year ? Number(form.value.year) : undefined
      }
    })
    msg.value = 'Solicitud encolada ✅ (haz clic en "Aplicar solicitudes")'
    resetForm()
  } catch (e) {
    msg.value = e.message || 'Error al encolar'
  } finally {
    loading.value = false
  }
}

function startEdit (b) {
  form.value = {
    _id: b._id,
    title: b.title,
    author: b.author?._id || b.author, // depende del populate
    year: b.year ?? ''
  }
}

async function queueUpdate () {
  if (!form.value._id) return
  if (!form.value.title || !form.value.author) {
    msg.value = 'Título y Autor son obligatorios'
    return
  }
  loading.value = true
  msg.value = 'Enviando actualización a cola...'
  try {
    await api.queue({
      entity: 'book',
      action: 'update',
      data: {
        _id: form.value._id,
        title: form.value.title,
        author: form.value.author,
        year: form.value.year ? Number(form.value.year) : undefined
      }
    })
    msg.value = 'Actualización encolada ✅ (haz clic en "Aplicar solicitudes")'
    resetForm()
  } catch (e) {
    msg.value = e.message || 'Error al encolar'
  } finally {
    loading.value = false
  }
}

async function queueDelete (b) {
  if (!confirm(`¿Eliminar "${b.title}"?`)) return
  loading.value = true
  msg.value = 'Enviando eliminación a cola...'
  try {
    await api.queue({ entity: 'book', action: 'delete', data: { _id: b._id } })
    msg.value = 'Eliminación encolada ✅ (haz clic en "Aplicar solicitudes")'
  } catch (e) {
    msg.value = e.message || 'Error al encolar'
  } finally {
    loading.value = false
  }
}

async function applyQueue () {
  loading.value = true
  msg.value = 'Aplicando solicitudes...'
  try {
    const res = await api.apply()
    await loadData()
    msg.value = `Solicitudes aplicadas: ${res.applied ?? 0} ✅`
  } catch (e) {
    msg.value = e.message || 'Error aplicando solicitudes'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <section style="max-width:900px;margin:1rem auto;padding:1rem;">
    <h1>Libros</h1>

    <div style="display:flex;gap:.5rem;align-items:center;margin:.5rem 0;">
      <button @click="applyQueue">Aplicar solicitudes</button>
      <span v-if="loading" style="opacity:.7">Procesando…</span>
    </div>

    <p v-if="msg" style="margin:.25rem 0;white-space:pre-wrap">{{ msg }}</p>

    <div style="border:1px solid #ddd;border-radius:8px;padding:1rem;margin:1rem 0;">
      <h2 style="margin-top:0">{{ isEditing ? 'Editar libro' : 'Nuevo libro' }}</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
        <label>
          Título
          <input v-model="form.title" placeholder="Título del libro" />
        </label>

        <label>
          Autor
          <select v-model="form.author">
            <option value="">Seleccione…</option>
            <option v-for="a in authors" :key="a._id" :value="a._id">{{ a.name }}</option>
          </select>
        </label>

        <label>
          Año (opcional)
          <input v-model="form.year" type="number" min="0" placeholder="2025" />
        </label>
      </div>

      <div style="display:flex;gap:.5rem;margin-top:1rem;">
        <button v-if="!isEditing" @click="queueCreate">Encolar creación</button>
        <button v-else @click="queueUpdate">Encolar actualización</button>
        <button v-if="isEditing" @click="resetForm" type="button">Cancelar</button>
      </div>
      <small style="display:block;margin-top:.5rem;opacity:.8">
        * Recuerda presionar <b>“Aplicar solicitudes”</b> para guardar en la base de datos.
      </small>
    </div>

    <div style="overflow:auto;border:1px solid #eee;border-radius:8px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#fafafa">
            <th style="text-align:left;padding:.5rem;border-bottom:1px solid #eee;">Título</th>
            <th style="text-align:left;padding:.5rem;border-bottom:1px solid #eee;">Autor</th>
            <th style="text-align:left;padding:.5rem;border-bottom:1px solid #eee;">Año</th>
            <th style="text-align:left;padding:.5rem;border-bottom:1px solid #eee;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in books" :key="b._id">
            <td style="padding:.5rem;border-bottom:1px solid #f2f2f2">
  <router-link :to="`/books/${b._id}`">{{ b.title }}</router-link>
</td>
            <td style="padding:.5rem;border-bottom:1px solid #f2f2f2">
              {{ b.author?.name || b.author }}
            </td>
            <td style="padding:.5rem;border-bottom:1px solid #f2f2f2">{{ b.year ?? '—' }}</td>
            <td style="padding:.5rem;border-bottom:1px solid #f2f2f2;display:flex;gap:.5rem;">
              <button @click="startEdit(b)">Editar</button>
              <button @click="queueDelete(b)">Eliminar</button>
            </td>
          </tr>
          <tr v-if="!books.length">
            <td colspan="4" style="padding:1rem;opacity:.7">No hay libros registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
input, select, button {
  padding: .45rem .6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}
button { cursor: pointer; }
label { display: flex; flex-direction: column; gap: .25rem; }
</style>
