'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './modal.module.scss';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  variant?: 'success' | 'error';
  children?: ReactNode;
  // Кнопки; по умолчанию — одна кнопка «Понятно», закрывающая окно
  actions?: ReactNode;
}

// Нативный <dialog>: фокус внутри окна, закрытие по Esc и затемнение фона — из коробки
export function Modal({
  open,
  onClose,
  title,
  variant = 'success',
  children,
  actions,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const Icon = variant === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onClose={onClose}
      // Клик по затемнённому фону (сам <dialog>, а не его содержимое) закрывает окно
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.content}>
        <Icon className={`${styles.icon} ${styles[variant]}`} size={48} />
        <h2 className={styles.title}>{title}</h2>
        {children && <div className={styles.text}>{children}</div>}
        <div className={styles.actions}>
          {actions ?? (
            <button className={styles.primaryButton} onClick={onClose}>
              Понятно
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

export { styles as modalStyles };
