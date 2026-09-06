<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{ 'update:page': [page: number] }>();

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1));
const to = computed(() => Math.min(props.page * props.pageSize, props.total));

const go = (page: number) => {
  if (page < 1 || page > props.totalPages || page === props.page) return;
  emit('update:page', page);
};
</script>

<template>
  <div class="toolbar">
    <span>
      Showing <strong>{{ from }}–{{ to }}</strong> of <strong>{{ total }}</strong>
    </span>
    <div class="pagination">
      <button class="btn btn--sm" type="button" :disabled="disabled || page <= 1" @click="go(page - 1)">
        ‹ Prev
      </button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button class="btn btn--sm" type="button" :disabled="disabled || page >= totalPages" @click="go(page + 1)">
        Next ›
      </button>
    </div>
  </div>
</template>
