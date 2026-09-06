<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { CATEGORIES, STATUSES, type Product } from '@/api/products';
import { useProductFilters } from '@/composables/useProductFilters';
import { useDeleteProduct, useProductsQuery } from '@/queries/products';
import ProductTable from '@/components/ProductTable.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const { filters, searchInput, applyFilters, toggleSort, reset, hasActiveFilters } = useProductFilters();

const { data, isPending, isFetching, isError, error, refetch } = useProductsQuery(filters);
const deleteMutation = useDeleteProduct();

const products = computed(() => data.value?.data ?? []);
const meta = computed(() => data.value?.meta ?? { page: 1, pageSize: filters.value.pageSize, total: 0, totalPages: 1 });

const pendingDelete = ref<Product | null>(null);

const confirmDelete = async () => {
  const product = pendingDelete.value;
  if (!product) return;
  pendingDelete.value = null;
  // error ถูกจัดการใน onError ของ mutation (rollback + toast) แล้ว
  await deleteMutation.mutateAsync(product).catch(() => {});
};
</script>

<template>
  <div class="page-head">
    <div>
      <h1>Products</h1>
      <p class="page-head__subtitle">
        {{ meta.total }} record{{ meta.total === 1 ? '' : 's' }}
        <span v-if="isFetching && !isPending"> · syncing…</span>
      </p>
    </div>
    <RouterLink class="btn btn--primary" :to="{ name: 'products.create' }">+ New product</RouterLink>
  </div>

  <section class="card">
    <div class="filters">
      <div>
        <label class="field-label" for="filter-search">Search</label>
        <input
          id="filter-search"
          v-model="searchInput"
          class="input"
          type="search"
          placeholder="Name or SKU…"
        />
      </div>

      <div>
        <label class="field-label" for="filter-category">Category</label>
        <select
          id="filter-category"
          class="select"
          :value="filters.category"
          @change="applyFilters({ category: ($event.target as HTMLSelectElement).value as any })"
        >
          <option value="">All</option>
          <option v-for="option in CATEGORIES" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>

      <div>
        <label class="field-label" for="filter-status">Status</label>
        <select
          id="filter-status"
          class="select"
          :value="filters.status"
          @change="applyFilters({ status: ($event.target as HTMLSelectElement).value as any })"
        >
          <option value="">All</option>
          <option v-for="option in STATUSES" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>

      <div>
        <label class="field-label" for="filter-page-size">Per page</label>
        <select
          id="filter-page-size"
          class="select"
          :value="filters.pageSize"
          @change="applyFilters({ pageSize: Number(($event.target as HTMLSelectElement).value) })"
        >
          <option v-for="size in [5, 10, 25, 50]" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>

      <button class="btn" type="button" :disabled="!hasActiveFilters" @click="reset">Clear</button>
    </div>

    <!-- loading ครั้งแรกเท่านั้นที่โชว์ skeleton; เปลี่ยนหน้า/ฟิลเตอร์จะคงตารางเดิมไว้ -->
    <div v-if="isPending" class="table-wrap" style="padding: 20px">
      <div v-for="row in 6" :key="row" class="skeleton" :style="{ width: `${100 - row * 6}%`, marginBottom: '14px' }" />
    </div>

    <div v-else-if="isError" class="state">
      <p class="state__title">Could not load products</p>
      <p>{{ error?.message }}</p>
      <button class="btn" type="button" style="margin-top: 12px" @click="refetch()">Try again</button>
    </div>

    <div v-else-if="!products.length" class="state">
      <p class="state__title">No products found</p>
      <p v-if="hasActiveFilters">Try clearing the filters.</p>
      <p v-else>Create your first product to get started.</p>
    </div>

    <template v-else>
      <div :class="{ 'is-refetching': isFetching }">
        <ProductTable
          :products="products"
          :sort="filters.sort"
          :order="filters.order"
          :deleting-id="deleteMutation.isPending.value ? deleteMutation.variables.value?.id : null"
          @sort="toggleSort"
          @delete="pendingDelete = $event"
        />
      </div>
      <PaginationBar
        v-bind="meta"
        :disabled="isFetching"
        @update:page="applyFilters({ page: $event })"
      />
    </template>
  </section>

  <ConfirmDialog
    :open="Boolean(pendingDelete)"
    title="Delete product"
    :message="`“${pendingDelete?.name}” will be removed permanently.`"
    confirm-label="Delete"
    :busy="deleteMutation.isPending.value"
    @cancel="pendingDelete = null"
    @confirm="confirmDelete"
  />
</template>
