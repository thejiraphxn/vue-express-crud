<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    busy?: boolean;
  }>(),
  { confirmLabel: 'Confirm', busy: false },
);

const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="backdrop" @click.self="emit('cancel')">
        <div class="dialog" role="dialog" aria-modal="true" @keydown.esc="emit('cancel')">
          <h3>{{ title }}</h3>
          <p style="color: var(--muted); margin-bottom: 0">{{ message }}</p>
          <div class="dialog__actions">
            <button class="btn" type="button" :disabled="busy" @click="emit('cancel')">Cancel</button>
            <button class="btn btn--danger" type="button" :disabled="busy" @click="emit('confirm')">
              {{ busy ? 'Working…' : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
