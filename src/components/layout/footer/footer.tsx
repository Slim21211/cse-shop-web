import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import styles from './footer.module.scss';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.title}>КСЭ</h3>
            <p className={styles.description}>
              Магазин подарков компании КСЭ. Обменивайте баллы на фирменный мерч
              и подарки.
            </p>
          </div>

          <div className={styles.section}>
            <h4 className={styles.subtitle}>Навигация</h4>
            <nav className={styles.nav}>
              <Link href="/catalog/merch">Мерч компании</Link>
              <Link href="/catalog/gifts">Подарки отдела</Link>
              <Link href="/cart">Корзина</Link>
              <Link href="/orders">Мои заказы</Link>
            </nav>
          </div>

          <div className={styles.section}>
            <h4 className={styles.subtitle}>Контакты</h4>
            <div className={styles.contacts}>
              <a href="mailto:giftshop@cse.ru" className={styles.contact}>
                <Mail size={18} />
                giftshop@cse.ru
              </a>
              <div className={styles.contact}>
                <MapPin size={18} />
                Москва, Россия
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} КСЭ. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
