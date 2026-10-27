'use client';

import { Suspense, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import type { CartRow } from '@/lib/data';
import { pluralizePoints } from '@/lib/format';
import styles from './page.module.scss';

// Функция для получения первого изображения товара
function getProductImage(product: CartRow['products']): string {
  // Приоритет: первое из image_urls -> image_url -> placeholder
  if (product.image_urls && product.image_urls.length > 0) {
    return product.image_urls[0];
  }
  if (product.image_url) {
    return product.image_url;
  }
  return '/placeholder.png';
}

interface CartViewProps {
  initialItems: CartRow[];
  pointsPromise: Promise<number | null>;
}

export default function CartView({ initialItems, pointsPromise }: CartViewProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const removeItem = async (productId: number) => {
    setPendingId(productId);
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });

      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.product_id !== productId));
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setPendingId(null);
    }
  };

  const updateQuantity = async (item: CartRow, newQuantity: number) => {
    if (newQuantity < 1) return;

    if (newQuantity > item.products.remains) {
      alert('Недостаточно товара на складе');
      return;
    }

    setPendingId(item.product_id);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: newQuantity,
        }),
      });

      if (response.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.product_id === item.product_id
              ? {
                  ...i,
                  quantity: newQuantity,
                  price: i.products.price * newQuantity,
                }
              : i
          )
        );
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setPendingId(null);
    }
  };

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

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

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
            {items.map((item) => {
              const isPending = pendingId === item.product_id;
              return (
                <div key={item.product_id} className={styles.cartItem}>
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
                      {item.products.price}{' '}
                      {pluralizePoints(item.products.price)} за шт.
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
                        onClick={() => updateQuantity(item, item.quantity - 1)}
                        disabled={isPending || item.quantity <= 1}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item, item.quantity + 1)}
                        disabled={
                          isPending || item.quantity >= item.products.remains
                        }
                      >
                        +
                      </button>
                    </div>

                    <div className={styles.itemTotal}>
                      <span className={styles.totalLabel}>Итого:</span>
                      <span className={styles.totalPrice}>
                        {item.price} {pluralizePoints(item.price)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeItem(item.product_id)}
                      className={styles.removeButton}
                      title="Удалить"
                      disabled={isPending}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Итого</h2>

            <div className={styles.summaryRow}>
              <span>Товаров:</span>
              <span>{totalQuantity} шт.</span>
            </div>

            <div className={styles.summaryTotal}>
              <span>К оплате:</span>
              <span>
                {total} {pluralizePoints(total)}
              </span>
            </div>

            <Suspense
              fallback={
                <button disabled className={styles.orderButton}>
                  Проверяем баланс...
                </button>
              }
            >
              <OrderSection
                pointsPromise={pointsPromise}
                total={total}
                disabled={pendingId !== null}
                onOrdered={() => {
                  setItems([]);
                  router.push('/account');
                  router.refresh();
                }}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSection({
  pointsPromise,
  total,
  disabled,
  onOrdered,
}: {
  pointsPromise: Promise<number | null>;
  total: number;
  disabled: boolean;
  onOrdered: () => void;
}) {
  const userPoints = use(pointsPromise);
  const [ordering, setOrdering] = useState(false);
  const insufficient = userPoints !== null && userPoints < total;

  const handleOrder = async () => {
    if (ordering) return;
    setOrdering(true);

    try {
      const response = await fetch('/api/orders', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        alert(
          'Заказ успешно оформлен! Проверьте вашу почту для подтверждения.'
        );
        onOrdered();
      } else {
        alert(data.error || 'Не удалось оформить заказ');
        setOrdering(false);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Произошла ошибка при оформлении заказа');
      setOrdering(false);
    }
  };

  return (
    <>
      <div className={styles.summaryRow}>
        <span>Ваши баллы:</span>
        <span>{userPoints ?? '—'}</span>
      </div>

      {insufficient && (
        <p className={styles.insufficientFunds}>
          Недостаточно баллов для оформления заказа
        </p>
      )}

      <button
        onClick={handleOrder}
        disabled={ordering || disabled || insufficient}
        className={styles.orderButton}
      >
        {ordering ? 'Оформление...' : 'Оформить заказ'}
      </button>
    </>
  );
}
