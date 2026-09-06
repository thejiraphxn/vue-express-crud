<script setup lang="ts">
import type { Status } from '@/api/products';

defineProps<{ status: Status }>();
</script>

<template>
  <span class="badge" :class="`badge--${status}`">{{ status }}</span>
</template>
