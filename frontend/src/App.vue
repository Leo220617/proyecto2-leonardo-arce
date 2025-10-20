<template>
  <div>
    <header style="display:flex; gap:1rem; align-items:center; padding:1rem; border-bottom:1px solid #eee;">
      <h1 style="margin:0;">Proyecto 2</h1>
      <router-link to="/authors">Autores</router-link>
      <router-link to="/admin">Admin</router-link>
      <div style="margin-left:auto;">
        <router-link to="/login">Login</router-link>
      </div>
    </header>
    <main style="padding:1rem;">
      <router-view />
    </main>
  </div>
</template>
