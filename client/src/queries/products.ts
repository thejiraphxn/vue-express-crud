import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import type { ApiError } from '@/api/http';
import {
  createProduct,
  deleteProduct,
  fetchProduct,
  fetchProducts,
  updateProduct,
  type Paginated,
  type Product,
  type ProductListParams,
  type ProductPayload,
} from '@/api/products';
import { useToastStore } from '@/stores/toast';

/**
 * query key factory — แหล่งความจริงเดียวของ cache key
 * ทำให้ invalidate เป็นกลุ่มได้ เช่น lists() โดนทุกหน้า/ทุกฟิลเตอร์
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export const useProductsQuery = (params: MaybeRefOrGetter<ProductListParams>) =>
  useQuery({
    queryKey: computed(() => productKeys.list(toValue(params))),
    queryFn: () => fetchProducts(toValue(params)),
    // ค้างข้อมูลหน้าเดิมไว้ระหว่างเปลี่ยนหน้า/ฟิลเตอร์ ตารางจึงไม่กระพริบ
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useProductQuery = (id: MaybeRefOrGetter<string | undefined>) =>
  useQuery({
    queryKey: computed(() => productKeys.detail(toValue(id) ?? '')),
    queryFn: () => fetchProduct(toValue(id)!),
    enabled: computed(() => Boolean(toValue(id))),
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const toast = useToastStore();

  return useMutation<Product, ApiError, ProductPayload>({
    mutationFn: createProduct,
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success(`Created "${product.name}"`);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const toast = useToastStore();

  return useMutation<Product, ApiError, { id: string; payload: Partial<ProductPayload> }>({
    mutationFn: ({ id, payload }) => updateProduct(id, payload),
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product);
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success(`Saved "${product.name}"`);
    },
  });
};

type DeleteContext = { snapshots: Array<[readonly unknown[], Paginated<Product> | undefined]> };

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const toast = useToastStore();

  return useMutation<string, ApiError, Product, DeleteContext>({
    mutationFn: (product) => deleteProduct(product.id),

    // optimistic update: ตัดแถวออกจากทุก list ที่ cache ไว้ก่อน แล้วค่อยรอ server
    onMutate: async (product) => {
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });
      const snapshots = queryClient.getQueriesData<Paginated<Product>>({ queryKey: productKeys.lists() });

      queryClient.setQueriesData<Paginated<Product>>({ queryKey: productKeys.lists() }, (page) =>
        page
          ? {
              data: page.data.filter((item) => item.id !== product.id),
              meta: { ...page.meta, total: Math.max(0, page.meta.total - 1) },
            }
          : page,
      );

      return { snapshots };
    },

    onError: (error, product, context) => {
      context?.snapshots.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error(`Could not delete "${product.name}": ${error.message}`);
    },

    onSuccess: (_id, product) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(product.id) });
      toast.success(`Deleted "${product.name}"`);
    },

    // ไม่ว่าจะสำเร็จหรือ rollback ก็ sync กับ server อีกรอบเสมอ
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};
