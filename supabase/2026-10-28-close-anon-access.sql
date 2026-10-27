-- Выполнить ПОСЛЕ деплоя новой версии админки и проверки, что товары и картинки в ней работают.
-- Магазин и админка теперь читают и пишут products только с сервера (service-role).

-- 1. Таблица products: закрыть для anon (RLS без политик = доступа нет).
alter table public.products enable row level security;
-- Если на products есть разрешающие политики — посмотреть и удалить их:
--   select policyname, roles, cmd from pg_policies where schemaname = 'public' and tablename = 'products';
--   drop policy "<имя политики>" on public.products;

-- 2. Storage: бакет product-images остаётся публичным на чтение (картинки в каталоге),
-- но загрузка теперь идёт по подписанным ссылкам, поэтому политики INSERT/UPDATE/DELETE
-- для anon в storage.objects больше не нужны. Посмотреть их:
--   select policyname, roles, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects';
-- и удалить те, что разрешают anon/public запись в product-images:
--   drop policy "<имя политики>" on storage.objects;
