<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useToastStore } from '@/stores/toast';

const toastStore = useToastStore();
const { items } = storeToRefs(toastStore);
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="fade">
      <div v-for="toast in items" :key="toast.id" class="toast" :class="`toast--${toast.type}`">
        <span>{{ toast.message }}</span>
        <button class="toast__close" type="button" aria-label="Dismiss" @click="toastStore.dismiss(toast.id)">
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
