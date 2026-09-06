<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { ApiError } from '@/api/http';
import {
  CATEGORIES,
  STATUSES,
  productFormSchema,
  type ProductFormValues,
  type ProductPayload,
} from '@/api/products';
import FormField from '@/components/FormField.vue';

const props = withDefaults(
  defineProps<{
    /** ค่าตั้งต้น (โหมดแก้ไข) */
    initialValues?: Partial<ProductFormValues>;
    submitLabel?: string;
    /** ให้ parent เป็นคนยิง mutation — ฟอร์มรู้แค่ว่า "ส่งแล้วรอ promise" */
    submitHandler: (payload: ProductPayload) => Promise<unknown>;
  }>(),
  { submitLabel: 'Save' },
);

const router = useRouter();
const formError = ref('');
const saved = ref(false);

const { defineField, handleSubmit, errors, isSubmitting, meta, setErrors } = useForm({
  // zod schema เดียวกับที่ derive type ของ payload -> validate กับ type ตรงกันเสมอ
  validationSchema: toTypedSchema(productFormSchema),
  initialValues: {
    name: '',
    sku: '',
    category: 'electronics',
    price: '',
    stock: '',
    status: 'draft',
    description: '',
    ...props.initialValues,
  },
});

const [name, nameAttrs] = defineField('name');
const [sku, skuAttrs] = defineField('sku');
const [category, categoryAttrs] = defineField('category');
const [status, statusAttrs] = defineField('status');
const [price, priceAttrs] = defineField('price');
const [stock, stockAttrs] = defineField('stock');
const [description, descriptionAttrs] = defineField('description');

const onSubmit = handleSubmit(async (values) => {
  formError.value = '';
  // ปลดล็อก guard ก่อนยิง เพราะ parent มักจะ navigate ทันทีที่ mutation สำเร็จ
  saved.value = true;
  try {
    await props.submitHandler(values);
  } catch (error) {
    saved.value = false;
    const apiError = ApiError.from(error);
    // error ระดับฟิลด์จาก server (เช่น sku ซ้ำ) เด้งกลับไปที่ช่องนั้นตรง ๆ
    if (Object.keys(apiError.fieldErrors).length) {
      setErrors(apiError.fieldErrors);
    } else {
      formError.value = apiError.message;
    }
  }
});

// กันเผลอออกจากหน้าแล้วงานหาย
onBeforeRouteLeave(() => {
  if (!meta.value.dirty || saved.value) return true;
  return window.confirm('You have unsaved changes. Leave anyway?');
});
</script>

<template>
  <form class="card" novalidate @submit="onSubmit">
    <div class="card__body">
      <p v-if="formError" class="alert" style="margin-bottom: 16px">{{ formError }}</p>

      <div class="form-grid">
        <FormField v-slot="{ id, invalid }" label="Name" :error="errors.name" required>
          <input
            :id="id"
            v-model="name"
            v-bind="nameAttrs"
            class="input"
            :class="{ 'input--error': invalid }"
            placeholder="Wireless Mouse"
          />
        </FormField>

        <FormField
          v-slot="{ id, invalid }"
          label="SKU"
          :error="errors.sku"
          hint="Uppercase letters, digits and dashes"
          required
        >
          <input
            :id="id"
            v-model="sku"
            v-bind="skuAttrs"
            class="input"
            :class="{ 'input--error': invalid }"
            placeholder="ELE-1042"
            @input="sku = String(sku).toUpperCase()"
          />
        </FormField>

        <FormField v-slot="{ id, invalid }" label="Category" :error="errors.category" required>
          <select :id="id" v-model="category" v-bind="categoryAttrs" class="select" :class="{ 'select--error': invalid }">
            <option v-for="option in CATEGORIES" :key="option" :value="option">{{ option }}</option>
          </select>
        </FormField>

        <FormField v-slot="{ id, invalid }" label="Status" :error="errors.status" required>
          <select :id="id" v-model="status" v-bind="statusAttrs" class="select" :class="{ 'select--error': invalid }">
            <option v-for="option in STATUSES" :key="option" :value="option">{{ option }}</option>
          </select>
        </FormField>

        <FormField v-slot="{ id, invalid }" label="Price" :error="errors.price" required>
          <input
            :id="id"
            v-model="price"
            v-bind="priceAttrs"
            class="input"
            :class="{ 'input--error': invalid }"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </FormField>

        <FormField v-slot="{ id, invalid }" label="Stock" :error="errors.stock" required>
          <input
            :id="id"
            v-model="stock"
            v-bind="stockAttrs"
            class="input"
            :class="{ 'input--error': invalid }"
            type="number"
            step="1"
            min="0"
            placeholder="0"
          />
        </FormField>

        <FormField
          v-slot="{ id, invalid }"
          label="Description"
          :error="errors.description"
          hint="Optional, up to 500 characters"
          class="form-grid__full"
        >
          <textarea
            :id="id"
            v-model="description"
            v-bind="descriptionAttrs"
            class="textarea"
            :class="{ 'textarea--error': invalid }"
            placeholder="Short internal note about this product…"
          />
        </FormField>
      </div>

      <div class="form-actions" style="margin-top: 20px">
        <button class="btn" type="button" :disabled="isSubmitting" @click="router.back()">Cancel</button>
        <button class="btn btn--primary" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving…' : submitLabel }}
        </button>
      </div>
    </div>
  </form>
</template>
