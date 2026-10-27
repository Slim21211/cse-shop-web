// lib/data.ts
// Серверные запросы данных для страниц. cache() убирает повторные запросы в рамках
// одного рендера (шапка и страница спрашивают одного и того же пользователя).

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/sessions';
import { getUserPoints } from '@/lib/ispring/api';
import type { OrderItem, Product } from '@/types';

export type CartRow = {
  product_id: number;
  quantity: number;
  price: number;
  products: Product;
};

export type OrderRow = {
  id: number;
  created_at: string;
  total_cost: number;
  items: OrderItem[];
};

export type UserRole = 'admin' | 'manager' | 'none';

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await createClient()
    .from('users')
    .select('id, email, first_name, last_name, ispring_user_id')
    .eq('id', session.userId)
    .maybeSingle();

  if (error) console.error('❌ Error fetching user from DB:', error);
  return data;
});

export const getPoints = cache(getUserPoints);

export async function getCartCount(userId: string): Promise<number> {
  const { data } = await createClient()
    .from('cart_items')
    .select('quantity')
    .eq('user_id', userId);

  return data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

export async function getCartItems(userId: string): Promise<CartRow[]> {
  const { data, error } = await createClient()
    .from('cart_items')
    .select('product_id, quantity, price, products(*)')
    .eq('user_id', userId)
    .order('product_id');

  if (error) console.error('❌ Cart fetch error:', error);
  return ((data || []) as unknown as CartRow[]).filter((row) => row.products);
}

export async function getProducts(isGift: boolean): Promise<Product[]> {
  const { data, error } = await createClient()
    .from('products')
    .select('*')
    .eq('is_gift', isGift);

  if (error) throw error;

  // Сначала товары в наличии, затем по цене
  return ((data || []) as Product[]).sort(
    (a, b) =>
      Number(b.remains > 0) - Number(a.remains > 0) || a.price - b.price
  );
}

function normalizeOrderItems(items: unknown): OrderItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter(
    (item): item is OrderItem =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.name === 'string' &&
      typeof item.quantity === 'number' &&
      typeof item.price === 'number'
  );
}

export async function getOrders(userId: string): Promise<OrderRow[]> {
  const { data, error } = await createClient()
    .from('orders')
    .select('id, created_at, total_cost, items')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) console.error('❌ Orders fetch error:', error);
  return (data || []).map((order) => ({
    ...order,
    items: normalizeOrderItems(order.items),
  }));
}

export async function getUserRole(
  userId: string,
  ispringUserId: string | null
): Promise<UserRole> {
  const supabase = createClient();

  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (admin) return 'admin';

  if (!ispringUserId) return 'none';

  const { data: deps } = await supabase
    .from('org_departments')
    .select('department_id')
    .eq('supervisor_ispring_id', ispringUserId);
  const ids = (deps || []).map((d) => d.department_id as string);
  if (!ids.length) return 'none';

  const { data: allowed } = await supabase
    .from('available_departments')
    .select('department_id')
    .in('department_id', ids)
    .limit(1);

  return allowed?.length ? 'manager' : 'none';
}
