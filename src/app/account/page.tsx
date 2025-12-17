'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Award,
  Package,
  ArrowLeft,
  LogOut,
  Shield,
  Loader2,
} from 'lucide-react';
import styles from './page.module.scss';

interface OrderItem {
  product_id?: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  created_at: string;
  total_cost: number;
  items: OrderItem[];
  user_name?: string;
  email?: string;
}

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  points: number;
}

// Тип для "сырых" данных заказа из API
interface RawOrder {
  id: number;
  created_at: string;
  total_cost: number;
  items: unknown; // может быть чем угодно из БД
  user_name?: string;
  email?: string;
}

// Функция для склонения слова "заказ"
function pluralizeOrders(count: number): string {
  const cases = [2, 0, 1, 1, 1, 2];
  const titles = ['заказ', 'заказа', 'заказов'];
  return titles[
    count % 100 > 4 && count % 100 < 20
      ? 2
      : cases[count % 10 < 5 ? count % 10 : 5]
  ];
}

// Функция для склонения слова "балл"
function pluralizePoints(count: number): string {
  const cases = [2, 0, 1, 1, 1, 2];
  const titles = ['балл', 'балла', 'баллов'];
  return titles[
    count % 100 > 4 && count % 100 < 20
      ? 2
      : cases[count % 10 < 5 ? count % 10 : 5]
  ];
}

// Функция для проверки и нормализации items
function normalizeOrderItems(items: unknown): OrderItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(
    (item): item is OrderItem =>
      typeof item === 'object' &&
      item !== null &&
      'name' in item &&
      typeof item.name === 'string' &&
      'quantity' in item &&
      typeof item.quantity === 'number' &&
      'price' in item &&
      typeof item.price === 'number'
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchOrders();
    checkAdmin();
  }, []);

  const fetchUserData = async () => {
    try {
      const [userRes, pointsRes] = await Promise.all([
        fetch('/api/user/info'),
        fetch('/api/user/points'),
      ]);

      if (userRes.status === 401 || pointsRes.status === 401) {
        router.push('/login?redirect=/account');
        return;
      }

      const userData = await userRes.json();
      const pointsData = await pointsRes.json();

      setUser({
        ...userData,
        points: pointsData.points,
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');

      if (response.status === 401) {
        router.push('/login?redirect=/account');
        return;
      }

      if (!response.ok) {
        console.error('Orders fetch failed:', response.status);
        return;
      }

      const data = await response.json();
      console.log('📦 Orders data:', data); // Для отладки

      // Проверяем структуру данных
      if (data.orders && Array.isArray(data.orders)) {
        // Нормализуем данные заказов
        const normalizedOrders = data.orders.map(
          (order: RawOrder): Order => ({
            id: order.id,
            created_at: order.created_at,
            total_cost: order.total_cost,
            items: normalizeOrderItems(order.items),
            user_name: order.user_name,
            email: order.email,
          })
        );

        console.log('✅ Normalized orders:', normalizedOrders);
        setOrders(normalizedOrders);
      } else {
        console.error('Invalid orders structure:', data);
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const checkAdmin = async () => {
    try {
      const response = await fetch('/api/user/is-admin');
      const data = await response.json();
      setIsAdmin(data.isAdmin || false);
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/'; // Используем window.location для полной очистки
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAdminPanel = () => {
    if (user?.email) {
      const adminUrl = `https://cse-shop-admin.vercel.app/?email=${encodeURIComponent(
        user.email
      )}`;
      window.open(adminUrl, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.loadingContainer}>
            <Loader2 className="animate-spin" size={48} />
            <h1 className={styles.title}>Загрузка...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>
            <ArrowLeft size={20} />
            На главную
          </Link>
          <h1 className={styles.title}>Личный кабинет</h1>
        </div>

        <div className={styles.content}>
          {/* Информация о пользователе */}
          <div className={styles.userCard}>
            <div className={styles.userHeader}>
              <div className={styles.userAvatar}>
                <User size={40} />
              </div>
              <div>
                <h2 className={styles.userName}>
                  {user.first_name} {user.last_name}
                </h2>
                <div className={styles.userEmail}>
                  <Mail size={16} />
                  {user.email}
                </div>
              </div>
            </div>

            <div className={styles.userStats}>
              <div className={styles.stat}>
                <Award size={24} />
                <div>
                  <div className={styles.statValue}>{user.points}</div>
                  <div className={styles.statLabel}>
                    {pluralizePoints(user.points)}
                  </div>
                </div>
              </div>

              <div className={styles.stat}>
                <Package size={24} />
                <div>
                  <div className={styles.statValue}>{orders.length}</div>
                  <div className={styles.statLabel}>
                    {pluralizeOrders(orders.length)}
                  </div>
                </div>
              </div>
            </div>

            {/* Кнопка админ-панели (только для админов) */}
            {isAdmin && (
              <button onClick={handleAdminPanel} className={styles.adminButton}>
                <Shield size={20} />
                Панель администратора
              </button>
            )}

            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogOut size={20} />
              Выйти
            </button>
          </div>

          {/* История заказов */}
          <div className={styles.ordersSection}>
            <h2 className={styles.sectionTitle}>История заказов</h2>

            {ordersLoading ? (
              <div className={styles.loadingOrders}>
                <Loader2 className="animate-spin" size={32} />
                <p>Загрузка заказов...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className={styles.emptyOrders}>
                <Package size={48} />
                <p>У вас пока нет заказов</p>
                <Link href="/" className={styles.shopButton}>
                  Перейти к покупкам
                </Link>
              </div>
            ) : (
              <div className={styles.orders}>
                {orders.map((order) => (
                  <div key={order.id} className={styles.order}>
                    <div className={styles.orderHeader}>
                      <div>
                        <div className={styles.orderId}>Заказ №{order.id}</div>
                        <div className={styles.orderDate}>
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                      <div className={styles.orderTotal}>
                        {order.total_cost} {pluralizePoints(order.total_cost)}
                      </div>
                    </div>

                    {order.items && order.items.length > 0 ? (
                      <div className={styles.orderItems}>
                        {order.items.map((item, index) => (
                          <div key={index} className={styles.orderItem}>
                            <span className={styles.itemName}>
                              {item.name} × {item.quantity}
                            </span>
                            <span className={styles.itemPrice}>
                              {item.price} {pluralizePoints(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.noItems}>
                        <p>Товары не указаны</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
