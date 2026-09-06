import { defineStore } from 'pinia';
import { ref } from 'vue';
import { uniqueId } from 'lodash-es';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

/**
 * client state ล้วน ๆ (ไม่ใช่ข้อมูลจาก server) จึงอยู่ใน Pinia
 * ส่วน server state ทั้งหมดปล่อยให้ TanStack Query ดูแล
 */
export const useToastStore = defineStore('toast', () => {
  const items = ref<Toast[]>([]);

  const dismiss = (id: string) => {
    items.value = items.value.filter((toast) => toast.id !== id);
  };

  const push = (type: Toast['type'], message: string, ttl = 4000) => {
    const toast: Toast = { id: uniqueId('toast_'), type, message };
    items.value = [...items.value, toast];
    window.setTimeout(() => dismiss(toast.id), ttl);
    return toast.id;
  };

  return {
    items,
    dismiss,
    push,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message, 6000),
    info: (message: string) => push('info', message),
  };
});
