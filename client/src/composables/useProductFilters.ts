import { computed, onScopeDispose, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { debounce, isEqual, omitBy } from 'lodash-es';
import {
  CATEGORIES,
  SORTABLE_FIELDS,
  STATUSES,
  type ProductListParams,
  type SortField,
} from '@/api/products';

const DEFAULTS: ProductListParams = {
  search: '',
  category: '',
  status: '',
  sort: 'createdAt',
  order: 'desc',
  page: 1,
  pageSize: 10,
};

const oneOf = <T extends string>(allowed: readonly T[], value: unknown, fallback: T | ''): T | '' =>
  allowed.includes(value as T) ? (value as T) : fallback;

const toInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * URL คือ source of truth ของฟิลเตอร์ -> refresh / แชร์ลิงก์ / ปุ่ม back ทำงานถูกต้อง
 * ช่องค้นหา debounce ด้วย lodash เพื่อไม่ยิง query ทุกตัวอักษร
 */
export const useProductFilters = () => {
  const route = useRoute();
  const router = useRouter();

  const filters = computed<ProductListParams>(() => {
    const q = route.query;
    return {
      search: typeof q.search === 'string' ? q.search : DEFAULTS.search,
      category: oneOf(CATEGORIES, q.category, DEFAULTS.category),
      status: oneOf(STATUSES, q.status, DEFAULTS.status),
      sort: (oneOf(SORTABLE_FIELDS, q.sort, '') || DEFAULTS.sort) as SortField,
      order: q.order === 'asc' ? 'asc' : 'desc',
      page: toInt(q.page, DEFAULTS.page),
      pageSize: toInt(q.pageSize, DEFAULTS.pageSize),
    };
  });

  /** เขียนกลับลง URL โดยตัดค่า default ทิ้ง เพื่อให้ URL สั้นและอ่านง่าย */
  const applyFilters = (patch: Partial<ProductListParams>) => {
    const next = { ...filters.value, ...patch };
    // แก้ฟิลเตอร์ใด ๆ (ที่ไม่ใช่การเปลี่ยนหน้า) ให้เด้งกลับหน้า 1 เสมอ
    if (patch.page === undefined) next.page = 1;

    const query = omitBy(next, (value, key) => isEqual(value, DEFAULTS[key as keyof ProductListParams]));
    if (isEqual(query, route.query)) return;
    router.replace({ query: query as Record<string, string | number> });
  };

  const searchInput = ref(filters.value.search);

  const commitSearch = debounce((value: string) => applyFilters({ search: value.trim() }), 350);
  watch(searchInput, (value) => commitSearch(value));
  onScopeDispose(() => commitSearch.cancel());

  // ถ้า URL เปลี่ยนจากทางอื่น (ปุ่ม back, ปุ่ม reset) ให้ช่องค้นหาตามไปด้วย
  watch(
    () => filters.value.search,
    (value) => {
      if (value === searchInput.value.trim()) return;
      commitSearch.cancel();
      searchInput.value = value;
    },
  );

  const toggleSort = (field: SortField) => {
    const isSame = filters.value.sort === field;
    applyFilters({ sort: field, order: isSame && filters.value.order === 'asc' ? 'desc' : 'asc' });
  };

  const hasActiveFilters = computed(
    () => Boolean(filters.value.search || filters.value.category || filters.value.status),
  );

  const reset = () => {
    commitSearch.cancel();
    searchInput.value = '';
    router.replace({ query: {} });
  };

  return { filters, searchInput, applyFilters, toggleSort, reset, hasActiveFilters };
};
