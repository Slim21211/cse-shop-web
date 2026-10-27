import styles from './page.module.scss';

export default function CatalogLoading() {
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.navigation}>
          <div className="skeleton" style={{ width: 160, height: 42 }} />
        </div>
        <div className={styles.header}>
          <div className="skeleton" style={{ width: 280, height: 38 }} />
        </div>
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: 400 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
