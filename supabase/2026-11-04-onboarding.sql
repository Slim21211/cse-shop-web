-- Просмотренные шаги онбординга. Выполнить в Supabase → SQL Editor ДО деплоя.
-- Одна строка = пользователь посмотрел шаг (или пропустил онбординг целиком).
-- Доступ только с сервера (service-role), поэтому RLS включён и политик нет.
create table if not exists public.onboarding_views (
  user_id text not null,
  step text not null,
  viewed_at timestamptz not null default now(),
  primary key (user_id, step)
);

alter table public.onboarding_views enable row level security;
