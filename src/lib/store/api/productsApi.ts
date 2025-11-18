import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Product } from '@/types';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Products', 'Product'],
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], string | undefined>({
      query: (category) => ({
        url: '/products',
        params: category ? { category } : {},
      }),
      transformResponse: (response: { products: Product[] }) =>
        response.products,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Products' as const, id: 'LIST' },
            ]
          : [{ type: 'Products' as const, id: 'LIST' }],
    }),

    getProduct: builder.query<Product, number>({
      query: (id) => `/products/${id}`,
      transformResponse: (response: { product: Product }) => response.product,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
  }),
});

export const { useGetProductsQuery, useGetProductQuery } = productsApi;
