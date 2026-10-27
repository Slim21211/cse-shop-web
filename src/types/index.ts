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
