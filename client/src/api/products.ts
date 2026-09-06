import { omitBy } from 'lodash-es';
import { z } from 'zod';
import { http } from './http';

export const CATEGORIES = ['electronics', 'apparel', 'grocery', 'toys', 'books'] as const;
export const STATUSES = ['active', 'draft', 'archived'] as const;
export const SORTABLE_FIELDS = ['name', 'price', 'stock', 'createdAt'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
export type SortField = (typeof SORTABLE_FIELDS)[number];

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  category: z.enum(CATEGORIES),
  price: z.number(),
  stock: z.number(),
  status: z.enum(STATUSES),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Product = z.infer<typeof productSchema>;

/**
 * ค่าจาก <input> เป็น string เสมอ — แปลงเป็น number ก่อนค่อย validate ตัวเลข
 * (ไม่ใช้ z.coerce.number() เพราะ "" จะกลายเป็น 0 แล้ว required check หลุด)
 */
const numberFromInput = z
  .union([z.number(), z.string()])
  .refine((value) => !(typeof value === 'string' && value.trim() === ''), { message: 'Required' })
  .transform((value) => (typeof value === 'number' ? value : Number(value)))
  .refine((value) => !Number.isNaN(value), { message: 'Must be a number' });

/** schema เดียวใช้ทั้ง validate ฟอร์มและ derive type ของ payload — กันฝั่ง client/server หลุดกัน */
export const productFormSchema = z.object({
  name: z.string().trim().min(3, 'At least 3 characters').max(80, 'At most 80 characters'),
  sku: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{4,20}$/, 'Use 4-20 chars: A-Z, 0-9 or "-"'),
  category: z.enum(CATEGORIES),
  price: numberFromInput.pipe(z.number().nonnegative('Cannot be negative').max(1_000_000, 'Too large')),
  stock: numberFromInput.pipe(z.number().int('Whole numbers only').min(0, 'Cannot be negative').max(100_000, 'Too large')),
  status: z.enum(STATUSES),
  description: z.string().trim().max(500, 'At most 500 characters'),
});

/** ค่าที่ผ่าน validate แล้ว (price/stock เป็น number) = payload ที่ส่งขึ้น API */
export type ProductPayload = z.output<typeof productFormSchema>;
/** ค่าที่อยู่ในฟอร์มระหว่างพิมพ์ (price/stock อาจยังเป็น string) */
export type ProductFormValues = z.input<typeof productFormSchema>;

export interface ProductListParams {
  search: string;
  category: Category | '';
  status: Status | '';
  sort: SortField;
  order: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

const isEmpty = (value: unknown) => value === '' || value === null || value === undefined;

export const fetchProducts = async (params: ProductListParams) => {
  const { data } = await http.get<Paginated<Product>>('/products', {
    params: omitBy(params, isEmpty),
  });
  return data;
};

export const fetchProduct = async (id: string) => {
  const { data } = await http.get<{ data: Product }>(`/products/${id}`);
  return data.data;
};

export const createProduct = async (payload: ProductPayload) => {
  const { data } = await http.post<{ data: Product }>('/products', payload);
  return data.data;
};

export const updateProduct = async (id: string, payload: Partial<ProductPayload>) => {
  const { data } = await http.patch<{ data: Product }>(`/products/${id}`, payload);
  return data.data;
};

export const deleteProduct = async (id: string) => {
  await http.delete(`/products/${id}`);
  return id;
};
