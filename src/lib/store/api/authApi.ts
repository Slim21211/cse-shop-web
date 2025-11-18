import { User } from '@/types';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface CheckEmailResponse {
  success: boolean;
  user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface VerifyCodeResponse {
  success: boolean;
  user: {
    email: string;
    name: string;
    points: number;
  };
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/auth' }),
  endpoints: (builder) => ({
    checkEmail: builder.mutation<CheckEmailResponse, string>({
      query: (email) => ({
        url: '/check-email',
        method: 'POST',
        body: { email },
      }),
    }),

    sendCode: builder.mutation<{ success: boolean }, string>({
      query: (email) => ({
        url: '/send-code',
        method: 'POST',
        body: { email },
      }),
    }),

    verifyCode: builder.mutation<
      VerifyCodeResponse,
      { email: string; code: string; userData: User }
    >({
      query: (body) => ({
        url: '/verify-code',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useCheckEmailMutation,
  useSendCodeMutation,
  useVerifyCodeMutation,
} = authApi;
