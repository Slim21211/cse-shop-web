-- Служебные таблицы магазина. Выполнить в Supabase → SQL Editor ДО деплоя кода,
-- который их использует (без них не будет работать вход и оформление заказа).
-- Доступ к ним только с сервера (service-role), поэтому RLS включён и политик нет.

-- Коды входа: счётчик попыток и лимиты отправки.
-- На Vercel у каждого инстанса своя память, поэтому хранить это в памяти процесса нельзя.
create table if not exists public.login_codes (
  id uuid primary key,
  email text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists login_codes_email_created_at_idx
  on public.login_codes (email, created_at desc);

alter table public.login_codes enable row level security;

-- Блокировка «один заказ пользователя одновременно» (двойной клик, две вкладки).
create table if not exists public.order_locks (
  user_id text primary key,
  created_at timestamptz not null default now()
);

alter table public.order_locks enable row level security;

-- Таблица admins всё ещё читается публичным anon-ключом. Ни магазину, ни браузерной
-- части админки этот доступ не нужен (роли проверяются на сервере через service-role).
alter table public.admins enable row level security;
