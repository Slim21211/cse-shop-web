// lib/supabase/server.ts
// Серверный клиент с service-role ключом. Публичный anon-ключ на сервере больше не используется:
// раз он работал для users/orders/cart_items, эти таблицы были открыты любому, у кого есть
// anon-ключ. После перехода на service-role для anon нужно закрыть таблицы через RLS.
// Импортировать этот модуль можно только в серверном коде.

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return client;
}
