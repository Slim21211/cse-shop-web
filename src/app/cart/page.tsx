'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import styles from './page.module.scss';

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  products: {
    id: number;
    name: string;
    price: number;
    image_url: string | null;
    image_urls?: string[] | null;
    remains: number;
  };
}

// Функция для получения первого изображения товара
function getProductImage(product: CartItem['products']): string {
  // Приоритет: первое из image_urls -> image_url -> placeholder
  if (product.image_urls && product.image_urls.length > 0) {
    return product.image_urls[0];
  }
  if (product.image_url) {
    return product.image_url;
  }
  return '/placeholder.png';
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [userPoints, setUserPoints] = useState<number | null>(null);

  useEffect(() => {
    fetchCart();
    fetchUserPoints();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');

      if (response.status === 401) {
        router.push('/login?redirect=/cart');
        return;
      }

      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const response = await fetch('/api/user/points');
      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.points);
      }
    } catch (error) {
      console.error('Failed to fetch user points:', error);
    }
  };

  const removeItem = async (productId: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });

      if (response.ok) {
        setItems(items.filter((item) => item.product_id !== productId));
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const updateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const item = items.find((i) => i.product_id === productId);
    if (!item) return;

    if (newQuantity > item.products.remains) {
      alert('Недостаточно товара на складе');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          quantity: newQuantity,
        }),
      });

      if (response.ok) {
        setItems(
          items.map((item) =>
            item.product_id === productId
              ? {
                  ...item,
                  quantity: newQuantity,
                  price: item.products.price * newQuantity,
                }
              : item
          )
        );
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleOrder = async () => {
    if (ordering) return;

    const total = calculateTotal();

    if (userPoints !== null && userPoints < total) {
      alert(`У вас недостаточно баллов. Нужно ${total}, у вас ${userPoints}`);
      return;
    }

    setOrdering(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          'Заказ успешно оформлен! Проверьте вашу почту для подтверждения.'
        );
        setItems([]);
        router.push('/orders');
        router.refresh();
      } else {
        alert(data.error || 'Не удалось оформить заказ');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Произошла ошибка при оформлении заказа');
    } finally {
      setOrdering(false);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <h1 className={styles.title}>Загрузка корзины...</h1>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.empty}>
            <ShoppingBag size={64} />
            <h1>Корзина пуста</h1>
            <p>Добавьте товары из каталога</p>
            <Link href="/" className={styles.continueButton}>
              Перейти к покупкам
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>
            <ArrowLeft size={20} />
            Продолжить покупки
          </Link>
          <h1 className={styles.title}>Корзина</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.items}>
            {items.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  <Image
                    src={getProductImage(item.products)}
                    alt={item.products.name}
                    fill
                    sizes="120px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                <div className={styles.itemInfo}>
                  <h3 className={styles.itemName}>{item.products.name}</h3>
                  <p className={styles.itemPrice}>
                    {item.products.price} баллов за шт.
                  </p>
                  {item.products.remains <= 5 && (
                    <p className={styles.lowStock}>
                      Осталось: {item.products.remains} шт.
                    </p>
                  )}
                </div>

                <div className={styles.itemActions}>
                  <div className={styles.quantity}>
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.products.remains}
                    >
                      +
                    </button>
                  </div>

                  <div className={styles.itemTotal}>
                    <span className={styles.totalLabel}>Итого:</span>
                    <span className={styles.totalPrice}>
                      {item.price} баллов
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.product_id)}
                    className={styles.removeButton}
                    title="Удалить"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Итого</h2>

            {userPoints !== null && (
              <div className={styles.summaryRow}>
                <span>Ваши баллы:</span>
                <span>{userPoints}</span>
              </div>
            )}

            <div className={styles.summaryRow}>
              <span>Товаров:</span>
              <span>
                {items.reduce((sum, item) => sum + item.quantity, 0)} шт.
              </span>
            </div>

            <div className={styles.summaryTotal}>
              <span>К оплате:</span>
              <span>{total} баллов</span>
            </div>

            {userPoints !== null && userPoints < total && (
              <p className={styles.insufficientFunds}>
                Недостаточно баллов для оформления заказа
              </p>
            )}

            <button
              onClick={handleOrder}
              disabled={ordering || (userPoints !== null && userPoints < total)}
              className={styles.orderButton}
            >
              {ordering ? 'Оформление...' : 'Оформить заказ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
