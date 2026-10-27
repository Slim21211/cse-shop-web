'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';

export function LogoutButton({ className }: { className: string }) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/'; // Используем window.location для полной очистки
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);
    }
  };

  return (
    <button onClick={handleLogout} className={className} disabled={loading}>
      <LogOut size={20} />
      Выйти
    </button>
  );
}
