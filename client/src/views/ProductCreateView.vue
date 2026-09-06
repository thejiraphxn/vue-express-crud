<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import type { ProductPayload } from '@/api/products';
import { useCreateProduct } from '@/queries/products';
import ProductForm from '@/components/ProductForm.vue';

const router = useRouter();
const createMutation = useCreateProduct();

const submit = async (payload: ProductPayload) => {
  await createMutation.mutateAsync(payload);
  await router.push({ name: 'products.list' });
};
</script>

<template>
  <div class="page-head">
    <div>
      <h1>New product</h1>
      <p class="page-head__subtitle">
        <RouterLink :to="{ name: 'products.list' }">← Back to products</RouterLink>
      </p>
    </div>
  </div>

  <ProductForm submit-label="Create product" :submit-handler="submit" />
</template>
