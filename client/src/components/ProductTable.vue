<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { SORTABLE_FIELDS, type Product, type SortField } from '@/api/products';
import { formatDate, formatPrice } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge.vue';

defineProps<{
  products: Product[];
  sort: SortField;
  order: 'asc' | 'desc';
  deletingId?: string | null;
}>();

const emit = defineEmits<{ sort: [field: SortField]; delete: [product: Product] }>();

const COLUMNS: Array<{ key: SortField | 'sku' | 'status' | 'actions'; label: string; numeric?: boolean }> = [
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'status', label: 'Status' },
  { key: 'price', label: 'Price', numeric: true },
  { key: 'stock', label: 'Stock', numeric: true },
  { key: 'createdAt', label: 'Created' },
  { key: 'actions', label: '' },
];

const isSortable = (key: string): key is SortField => SORTABLE_FIELDS.includes(key as SortField);
</script>

<template>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th
            v-for="column in COLUMNS"
            :key="column.key"
            :class="{ numeric: column.numeric, 'row-actions-head': column.key === 'actions' }"
          >
            <button
              v-if="isSortable(column.key)"
              class="th-sort"
              :class="{ 'th-sort--active': sort === column.key }"
              type="button"
              @click="emit('sort', column.key)"
            >
              {{ column.label }}
              <span class="th-sort__arrow">{{ sort === column.key && order === 'asc' ? '▲' : '▼' }}</span>
            </button>
            <template v-else>{{ column.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>
            <strong>{{ product.name }}</strong>
            <div class="mono">{{ product.category }}</div>
          </td>
          <td class="mono">{{ product.sku }}</td>
          <td><StatusBadge :status="product.status" /></td>
          <td class="numeric">{{ formatPrice(product.price) }}</td>
          <td class="numeric" :class="{ 'stock-low': product.stock < 10 }">{{ product.stock }}</td>
          <td class="mono">{{ formatDate(product.createdAt) }}</td>
          <td>
            <div class="row-actions">
              <RouterLink
                class="btn btn--sm"
                :to="{ name: 'products.edit', params: { id: product.id } }"
              >
                Edit
              </RouterLink>
              <button
                class="btn btn--sm btn--ghost"
                type="button"
                :disabled="deletingId === product.id"
                style="color: var(--danger)"
                @click="emit('delete', product)"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
