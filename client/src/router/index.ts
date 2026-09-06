import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: { name: 'products.list' } },
    {
      path: '/products',
      name: 'products.list',
      component: () => import('@/views/ProductListView.vue'),
    },
    {
      path: '/products/new',
      name: 'products.create',
      component: () => import('@/views/ProductCreateView.vue'),
    },
    {
      path: '/products/:id/edit',
      name: 'products.edit',
      component: () => import('@/views/ProductEditView.vue'),
      props: true,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
