export type Product = {
  id: number;
  name: string;
  size: string | null;
  price: number;
  old_price?: number | null;
  description?: string | null;
  remains: number;
  image_url?: string | null; // Оставляем для обратной совместимости
  image_urls?: string[] | null; // НОВОЕ: массив URL изображений
  is_gift: boolean;
};

export type OrderItem = {
  name: string;
  price: number;
  quantity: number;
  product_id: number;
};

export type Order = {
  id: number;
  user_id: string;
  user_name: string;
  email: string;
  telegram_login?: string;
  items: OrderItem[];
  total_cost: number;
  created_at: string;
};

export type User = {
  id: string;
  email: string;
  ispring_user_id: string;
  first_name?: string;
  last_name?: string;
  points?: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};
