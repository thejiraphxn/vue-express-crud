import { nanoid } from 'nanoid';
import { CATEGORIES, STATUSES } from './schemas.js';

/**
 * In-memory store — ตั้งใจให้ง่ายที่สุดเพื่อโฟกัสฝั่ง client
 * ถ้าจะต่อของจริงก็เปลี่ยนแค่ไฟล์นี้เป็น Prisma / Knex / Mongoose ได้เลย
 * เพราะ route ข้างนอกคุยกับ store ผ่านฟังก์ชันด้านล่างอย่างเดียว
 */

/** @type {Array<Record<string, any>>} */
let products = [];

const NAMES = [
  'Wireless Mouse', 'Mechanical Keyboard', 'USB-C Hub', '27" Monitor', 'Noise Cancelling Headphones',
  'Hoodie', 'Denim Jacket', 'Running Shoes', 'Wool Socks', 'Baseball Cap',
  'Arabica Coffee Beans', 'Olive Oil', 'Dark Chocolate', 'Green Tea', 'Almond Butter',
  'Wooden Puzzle', 'RC Car', 'Building Blocks', 'Board Game', 'Plush Bear',
  'Clean Code', 'The Pragmatic Programmer', 'Designing Data-Intensive Applications',
  'Refactoring', 'You Don\'t Know JS', 'Domain-Driven Design', 'Working Effectively with Legacy Code',
];

const seed = () => {
  const now = Date.now();
  products = NAMES.map((name, i) => {
    const category = CATEGORIES[Math.floor(i / 5) % CATEGORIES.length];
    return {
      id: nanoid(10),
      name,
      sku: `${category.slice(0, 3).toUpperCase()}-${String(1000 + i)}`,
      category,
      price: Number(((i * 37) % 950 + 9.99).toFixed(2)),
      stock: (i * 13) % 120,
      status: STATUSES[i % STATUSES.length],
      description: `Sample seed record for "${name}".`,
      createdAt: new Date(now - i * 36e5).toISOString(),
      updatedAt: new Date(now - i * 36e5).toISOString(),
    };
  });
};

seed();

export const resetDb = seed;

/** @param {string} sku @param {string} [exceptId] */
export const isSkuTaken = (sku, exceptId) =>
  products.some((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== exceptId);

/**
 * filter -> sort -> paginate (ลำดับเดียวกับที่ DB จริงทำ)
 * @param {{ search: string, category: string, status: string, sort: string, order: 'asc'|'desc', page: number, pageSize: number }} q
 */
export const listProducts = (q) => {
  const term = q.search.toLowerCase();

  const filtered = products.filter((p) => {
    if (term && !`${p.name} ${p.sku}`.toLowerCase().includes(term)) return false;
    if (q.category && p.category !== q.category) return false;
    if (q.status && p.status !== q.status) return false;
    return true;
  });

  const dir = q.order === 'asc' ? 1 : -1;
  const sorted = [...filtered].sort((a, b) => {
    const [x, y] = [a[q.sort], b[q.sort]];
    if (typeof x === 'string' && typeof y === 'string') return x.localeCompare(y) * dir;
    return (x - y) * dir;
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / q.pageSize));
  const page = Math.min(q.page, totalPages);
  const start = (page - 1) * q.pageSize;

  return {
    data: sorted.slice(start, start + q.pageSize),
    meta: { page, pageSize: q.pageSize, total, totalPages },
  };
};

/** @param {string} id */
export const findProduct = (id) => products.find((p) => p.id === id) ?? null;

/** @param {Record<string, any>} input */
export const createProduct = (input) => {
  const now = new Date().toISOString();
  const product = { id: nanoid(10), ...input, createdAt: now, updatedAt: now };
  products.unshift(product);
  return product;
};

/** @param {string} id @param {Record<string, any>} patch */
export const updateProduct = (id, patch) => {
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...patch, updatedAt: new Date().toISOString() };
  return products[index];
};

/** @param {string} id */
export const deleteProduct = (id) => {
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  return products.splice(index, 1)[0];
};

export const countProducts = () => products.length;
