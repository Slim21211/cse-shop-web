'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { BookOpen, Loader2, X } from 'lucide-react';
import styles from './rules.module.scss';

// Текст и картинки правил грузятся отдельным чанком только при первом открытии
const RulesContent = dynamic(() => import('./rulesContent'), {
  loading: () => (
    <div className={styles.loading}>
      <Loader2 className="animate-spin" size={32} aria-label="Загрузка" />
    </div>
  ),
});

interface RulesButtonProps {
  className: string;
  // link — текстом в меню (десктоп), icon — иконкой в шапке (мобильные)
  variant: 'link' | 'icon';
}

export function RulesButton({ className, variant }: RulesButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const show = () => {
    setMounted(true);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className={className}
        data-onboarding="rules"
        aria-haspopup="dialog"
        title="Правила"
        aria-label={variant === 'icon' ? 'Правила' : undefined}
      >
        {variant === 'icon' ? <BookOpen size={20} /> : 'Правила'}
      </button>

      <dialog
        ref={ref}
        className={styles.dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        aria-labelledby="rules-title"
      >
        <div className={styles.header}>
          <h2 id="rules-title" className={styles.title}>
            Правила Магазина подарков
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={() => setOpen(false)}
            aria-label="Закрыть"
          >
            <X size={22} />
          </button>
        </div>
        {/* После первого открытия содержимое остаётся смонтированным — повторно не грузится */}
        {mounted && <RulesContent />}
      </dialog>
    </>
  );
}
