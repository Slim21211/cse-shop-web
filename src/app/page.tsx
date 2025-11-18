import Link from 'next/link';
import { ArrowRight, Gift, ShoppingBag } from 'lucide-react';
import styles from './page.module.scss';

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroContainer}`}>
          <h1 className={styles.heroTitle}>
            Магазин подарков <span className={styles.accent}>КСЭ</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Обменивайте заработанные баллы на фирменный мерч и подарки
          </p>
          <div className={styles.heroActions}>
            <Link href="/catalog/merch" className={styles.primaryButton}>
              Посмотреть каталог
              <ArrowRight size={20} />
            </Link>
            <Link href="/login" className={styles.secondaryButton}>
              Войти в аккаунт
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className={styles.categories}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Категории товаров</h2>
          <div className={styles.categoriesGrid}>
            <Link href="/catalog/merch" className={styles.categoryCard}>
              <div className={styles.categoryIcon}>
                <ShoppingBag size={48} />
              </div>
              <h3 className={styles.categoryTitle}>Мерч компании</h3>
              <p className={styles.categoryDescription}>
                Фирменная одежда, аксессуары и сувениры с логотипом КСЭ
              </p>
              <span className={styles.categoryLink}>
                Смотреть каталог
                <ArrowRight size={18} />
              </span>
            </Link>

            <Link href="/catalog/gifts" className={styles.categoryCard}>
              <div className={styles.categoryIcon}>
                <Gift size={48} />
              </div>
              <h3 className={styles.categoryTitle}>Подарки отдела</h3>
              <p className={styles.categoryDescription}>
                Эксклюзивные подарки для сотрудников и партнеров
              </p>
              <span className={styles.categoryLink}>
                Смотреть каталог
                <ArrowRight size={18} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureNumber}>01</div>
              <h3 className={styles.featureTitle}>Накапливайте баллы</h3>
              <p className={styles.featureText}>
                Выполняйте задачи и получайте баллы за достижения
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureNumber}>02</div>
              <h3 className={styles.featureTitle}>Выбирайте подарки</h3>
              <p className={styles.featureText}>
                Обменивайте баллы на товары из каталога
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureNumber}>03</div>
              <h3 className={styles.featureTitle}>Получайте заказы</h3>
              <p className={styles.featureText}>
                Подтверждайте заказ и получайте подарки
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
