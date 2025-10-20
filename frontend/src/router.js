import { createRouter, createWebHistory } from 'vue-router';
import Login from './views/Login.vue';
import Authors from './views/Authors.vue';
import AuthorDetail from './views/AuthorDetail.vue';
import Admin from './views/Admin.vue';

const routes = [
  { path: '/', redirect: '/authors' },
  { path: '/login', component: Login },
  { path: '/authors', component: Authors },
  { path: '/authors/:id', component: AuthorDetail, props: true },
  { path: '/admin', component: Admin }
];

const router = createRouter({ history: createWebHistory(), routes });
export default router;
