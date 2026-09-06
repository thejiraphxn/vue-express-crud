<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="card">
    <div class="card__body state">
      <p class="state__title">404 — page not found</p>
      <RouterLink class="btn" style="margin-top: 12px" :to="{ name: 'products.list' }">Back to products</RouterLink>
    </div>
  </div>
</template>
