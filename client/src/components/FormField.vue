<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}>();

// ส่ง id ให้ slot เอาไปผูก label กับ control เอง (accessibility)
const id = useId();
</script>

<template>
  <div>
    <label class="field-label" :for="id">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </label>
    <slot :id="id" :invalid="Boolean(error)" />
    <p v-if="error" class="error-text">{{ error }}</p>
    <p v-else-if="hint" class="hint-text">{{ hint }}</p>
  </div>
</template>
