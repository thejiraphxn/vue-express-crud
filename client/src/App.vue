<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import AppToasts from '@/components/AppToasts.vue';

// devtools โหลดเฉพาะตอน dev — prod build จะ tree-shake ทิ้งทั้งก้อน
const QueryDevtools = import.meta.env.DEV
  ? defineAsyncComponent(() =>
      import('@tanstack/vue-query-devtools').then((m) => m.VueQueryDevtools),
    )
  : null;
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <RouterLink class="brand" :to="{ name: 'products.list' }">
        <span class="brand__mark">◆</span>
        Product Manager
      </RouterLink>
      <a class="mono" href="https://github.com" target="_blank" rel="noreferrer">vue + express crud</a>
    </div>
  </header>

  <main class="container">
    <RouterView />
  </main>

  <AppToasts />
  <component :is="QueryDevtools" v-if="QueryDevtools" />
</template>
