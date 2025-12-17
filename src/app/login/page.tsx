'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import styles from './page.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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

      // ✅ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Показываем состояние "Перенаправление..."
      setIsRedirecting(true);

      // Используем window.location для гарантированного редиректа
      // router.push может задерживаться из-за prefetching
      window.location.href = redirect;
    } catch (err) {
      setError('Произошла ошибка');
      setLoading(false);
      setIsRedirecting(false);
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
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles.button}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Отправка...
                  </>
                ) : (
                  <>
                    Продолжить
                    <ArrowRight size={20} />
                  </>
                )}
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
                  disabled={loading || isRedirecting}
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
                disabled={loading || isRedirecting}
              >
                Изменить email
              </button>

              <button
                type="submit"
                disabled={loading || isRedirecting || code.length !== 6}
                className={styles.button}
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Перенаправление...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Проверка...
                  </>
                ) : (
                  <>
                    Войти
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
