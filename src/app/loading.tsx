import { Loader2 } from 'lucide-react';

// Показывается сразу при переходе между страницами, пока сервер готовит данные
export default function Loading() {
  return (
    <div
      className="container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        color: 'var(--text-secondary)',
      }}
    >
      <Loader2 className="animate-spin" size={40} aria-label="Загрузка" />
    </div>
  );
}
