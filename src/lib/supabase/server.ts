// lib/supabase/server.ts

import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  // Мы используем заглушки для cookies, так как наша сессия хранится в lib/session.ts
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Заглушка: не делает ничего, но удовлетворяет требованиям типа
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
    }
  );
}
