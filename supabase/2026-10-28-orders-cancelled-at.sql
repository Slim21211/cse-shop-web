-- Отменённые заказы больше не удаляются, а помечаются. Выполнить в Supabase → SQL Editor
-- ДО деплоя магазина и админки (магазин читает эту колонку в личном кабинете).
alter table public.orders add column if not exists cancelled_at timestamptz;
