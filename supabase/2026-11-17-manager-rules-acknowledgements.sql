-- Подтверждение ознакомления руководителей с правилами начисления баллов.
-- Выполнить в Supabase → SQL Editor до деплоя.
create table if not exists public.manager_rules_acknowledgements (
  user_id text primary key,
  acknowledged_at timestamptz not null default now()
);

alter table public.manager_rules_acknowledgements enable row level security;
