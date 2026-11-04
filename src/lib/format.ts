function pluralize(count: number, titles: [string, string, string]): string {
  const cases = [2, 0, 1, 1, 1, 2];
  const n = Math.abs(count);
  return titles[
    n % 100 > 4 && n % 100 < 20 ? 2 : cases[n % 10 < 5 ? n % 10 : 5]
  ];
}

export const pluralizePoints = (count: number) =>
  pluralize(count, ['балл', 'балла', 'баллов']);

// Разделение разрядов: 14829 → «14 829» (неразрывный пробел — число не переносится).
// Не через Intl: ICU сервера и браузера могут поставить разные пробелы, и карточки
// товаров, которые рендерятся на обеих сторонах, разойдутся при гидратации
export const formatPoints = (count: number) =>
  String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// «14 829 баллов», «1 балл», «2 балла»
export const formatPointsWithUnit = (count: number) =>
  `${formatPoints(count)} ${pluralizePoints(count)}`;

export const pluralizeOrders = (count: number) =>
  pluralize(count, ['заказ', 'заказа', 'заказов']);

export const pluralizeProducts = (count: number) =>
  pluralize(count, ['товар', 'товара', 'товаров']);
