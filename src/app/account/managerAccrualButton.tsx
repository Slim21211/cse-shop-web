'use client';

import { useState } from 'react';
import { Shield, Download } from 'lucide-react';
import { Modal, modalStyles } from '@/components/modal/modal';
import styles from './managerAccrualButton.module.scss';

export function ManagerAccrualButton({
  acknowledged,
  className,
}: {
  acknowledged: boolean;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const continueToAccrual = () => {
    if (acknowledged) {
      window.location.assign('/api/handoff');
      return;
    }
    setChecked(false);
    setError('');
    setOpen(true);
  };

  const acknowledge = async () => {
    if (!checked || saving) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/manager-rules', { method: 'POST' });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Не удалось сохранить подтверждение. Попробуйте ещё раз.');
      }
      window.location.assign('/api/handoff');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сервера');
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" onClick={continueToAccrual} className={className}>
        <Shield size={20} /> Начислить баллы
      </button>
      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Правила начисления баллов"
        variant="success"
        actions={
          <>
            <button
              className={modalStyles.primaryButton}
              onClick={acknowledge}
              disabled={!checked || saving}
            >
              {saving ? 'Сохраняем…' : 'Ознакомился, продолжить'}
            </button>
            <button className={modalStyles.secondaryButton} onClick={() => setOpen(false)} disabled={saving}>
              Отмена
            </button>
          </>
        }
      >
        <p>Перед переходом к начислению, пожалуйста, ознакомьтесь с правилами.</p>
        <a className={styles.download} href="/rules/rules_for_managers.pdf" download>
          <Download size={18} /> Скачать правила (PDF)
        </a>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
          <span>Я ознакомился с правилами начисления баллов</span>
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </Modal>
    </>
  );
}
