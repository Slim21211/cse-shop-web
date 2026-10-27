import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Award, Package, ArrowLeft, Shield } from 'lucide-react';
import {
  getCurrentUser,
  getOrders,
  getPoints,
  getUserRole,
} from '@/lib/data';
import { pluralizeOrders, pluralizePoints } from '@/lib/format';
import { LogoutButton } from './logoutButton';
import styles from './page.module.scss';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Moscow',
});

async function PointsStat({ ispringUserId }: { ispringUserId: string }) {
  const points = await getPoints(ispringUserId);
  return (
    <>
      <div className={styles.statValue}>{points ?? '—'}</div>
      <div className={styles.statLabel}>{pluralizePoints(points ?? 0)}</div>
    </>
  );
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/account');

  const [orders, role] = await Promise.all([
    getOrders(user.id),
    getUserRole(user.id, user.ispring_user_id),
  ]);

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
                  <Suspense
                    fallback={
                      <>
                        <div className={styles.statValue}>…</div>
                        <div className={styles.statLabel}>баллов</div>
                      </>
                    }
                  >
                    <PointsStat ispringUserId={user.ispring_user_id} />
                  </Suspense>
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

            {/* Серверная ручка магазина выдаст пропуск и перекинет в админку */}
            {role !== 'none' && (
              <a
                href="/api/handoff"
                target="_blank"
                rel="noopener"
                className={styles.adminButton}
              >
                <Shield size={20} />{' '}
                {role === 'admin' ? 'Панель администратора' : 'Начислить баллы'}
              </a>
            )}

            <LogoutButton className={styles.logoutButton} />
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
                          {dateFormatter.format(new Date(order.created_at))}
                        </div>
                      </div>
                      <div className={styles.orderTotal}>
                        {order.total_cost} {pluralizePoints(order.total_cost)}
                      </div>
                    </div>

                    {order.items.length > 0 ? (
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
