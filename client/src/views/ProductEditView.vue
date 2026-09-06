<script setup lang="ts">
import { computed, toRef } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import type { ProductFormValues, ProductPayload } from '@/api/products';
import { useProductQuery, useUpdateProduct } from '@/queries/products';
import ProductForm from '@/components/ProductForm.vue';

const props = defineProps<{ id: string }>();

const router = useRouter();
const { data: product, isPending, isError, error } = useProductQuery(toRef(props, 'id'));
const updateMutation = useUpdateProduct();

const initialValues = computed<Partial<ProductFormValues> | undefined>(() =>
  product.value
    ? {
        name: product.value.name,
        sku: product.value.sku,
        category: product.value.category,
        status: product.value.status,
        price: product.value.price,
        stock: product.value.stock,
        description: product.value.description,
      }
    : undefined,
);

const submit = async (payload: ProductPayload) => {
  await updateMutation.mutateAsync({ id: props.id, payload });
  await router.push({ name: 'products.list' });
};
</script>

<template>
  <div class="page-head">
    <div>
      <h1>Edit product</h1>
      <p class="page-head__subtitle">
        <RouterLink :to="{ name: 'products.list' }">← Back to products</RouterLink>
      </p>
    </div>
  </div>

  <div v-if="isPending" class="card">
    <div class="card__body">
      <div v-for="row in 4" :key="row" class="skeleton" :style="{ width: `${90 - row * 8}%`, marginBottom: '16px' }" />
    </div>
  </div>

  <div v-else-if="isError" class="card">
    <div class="card__body state">
      <p class="state__title">Could not load this product</p>
      <p>{{ error?.message }}</p>
      <RouterLink class="btn" style="margin-top: 12px" :to="{ name: 'products.list' }">Back to list</RouterLink>
    </div>
  </div>

  <!-- รอข้อมูลมาก่อนค่อย mount ฟอร์ม เพื่อให้ initialValues ถูกตั้งครั้งเดียวจบ -->
  <ProductForm
    v-else-if="initialValues"
    :key="props.id"
    :initial-values="initialValues"
    submit-label="Save changes"
    :submit-handler="submit"
  />
</template>
