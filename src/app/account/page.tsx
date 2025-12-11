'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Award, Package, ArrowLeft, LogOut } from 'lucide-react';
import styles from './page.module.scss';

interface Order {
  id: number;
  created_at: string;
  total_cost: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  points: number;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchOrders();
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
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');

      if (response.status === 401) {
        router.push('/login?redirect=/account');
        return;
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
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
          <h1 className={styles.title}>Загрузка...</h1>
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
                  <div className={styles.statLabel}>баллов</div>
                </div>
              </div>

              <div className={styles.stat}>
                <Package size={24} />
                <div>
                  <div className={styles.statValue}>{orders.length}</div>
                  <div className={styles.statLabel}>
                    {orders.length === 1
                      ? 'заказ'
                      : orders.length < 5
                      ? 'заказа'
                      : 'заказов'}
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogOut size={20} />
              Выйти
            </button>
          </div>

          {/* История заказов */}
          <div className={styles.ordersSection}>
            <h2 className={styles.sectionTitle}>История заказов</h2>

            {orders.length === 0 ? (
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
                        {order.total_cost} баллов
                      </div>
                    </div>

                    <div className={styles.orderItems}>
                      {order.items.map((item, index) => (
                        <div key={index} className={styles.orderItem}>
                          <span className={styles.itemName}>
                            {item.name} × {item.quantity}
                          </span>
                          <span className={styles.itemPrice}>
                            {item.price} баллов
                          </span>
                        </div>
                      ))}
                    </div>
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
