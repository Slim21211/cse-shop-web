'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import styles from './page.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Проверяем email
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        setError(checkData.error || 'Ошибка проверки email');
        return;
      }

      setUserData(checkData.user);

      // Отправляем код
      const sendRes = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!sendRes.ok) {
        setError('Не удалось отправить код');
        return;
      }

      setStep('code');
    } catch (err) {
      setError('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, userData }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Неверный код');
        return;
      }

      // Успешная авторизация
      router.push('/');
      router.refresh();
    } catch (err) {
      setError('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Вход в аккаунт</h1>
          <p className={styles.subtitle}>
            {step === 'email'
              ? 'Введите вашу рабочую почту'
              : 'Введите код из письма'}
          </p>

          {error && <div className={styles.error}>{error}</div>}

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <Mail className={styles.inputIcon} size={20} />
                <input
                  type="email"
                  placeholder="example@cse.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.input}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles.button}
              >
                {loading ? 'Отправка...' : 'Продолжить'}
                <ArrowRight size={20} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <Lock className={styles.inputIcon} size={20} />
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  className={styles.input}
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
                className={styles.backButton}
              >
                Изменить email
              </button>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className={styles.button}
              >
                {loading ? 'Проверка...' : 'Войти'}
                <ArrowRight size={20} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
