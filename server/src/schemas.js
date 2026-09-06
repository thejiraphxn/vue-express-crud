import { z } from 'zod';

export const CATEGORIES = ['electronics', 'apparel', 'grocery', 'toys', 'books'];
export const STATUSES = ['active', 'draft', 'archived'];
export const SORTABLE_FIELDS = ['name', 'price', 'stock', 'createdAt'];

/** payload ตอนสร้างสินค้าใหม่ */
export const productCreateSchema = z.object({
  name: z.string().trim().min(3, 'name must be at least 3 characters').max(80),
  sku: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{4,20}$/, 'sku must be 4-20 chars of A-Z, 0-9 or "-"'),
  category: z.enum(CATEGORIES),
  price: z.number().nonnegative('price must be >= 0').max(1_000_000),
  stock: z.number().int('stock must be an integer').min(0).max(100_000),
  status: z.enum(STATUSES).default('draft'),
  description: z.string().trim().max(500).default(''),
});

/** PATCH -> ทุก field เป็น optional แต่ยังผ่าน rule เดิม */
export const productUpdateSchema = productCreateSchema.partial();

/** query string ของ list endpoint (coerce เพราะค่าที่มาจาก URL เป็น string เสมอ) */
export const productQuerySchema = z.object({
  search: z.string().trim().default(''),
  category: z.union([z.enum(CATEGORIES), z.literal('')]).default(''),
  status: z.union([z.enum(STATUSES), z.literal('')]).default(''),
  sort: z.enum(SORTABLE_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});
