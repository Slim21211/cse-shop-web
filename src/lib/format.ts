function pluralize(count: number, titles: [string, string, string]): string {
  const cases = [2, 0, 1, 1, 1, 2];
  const n = Math.abs(count);
  return titles[
    n % 100 > 4 && n % 100 < 20 ? 2 : cases[n % 10 < 5 ? n % 10 : 5]
  ];
}

export const pluralizePoints = (count: number) =>
  pluralize(count, ['балл', 'балла', 'баллов']);

export const pluralizeOrders = (count: number) =>
  pluralize(count, ['заказ', 'заказа', 'заказов']);

export const pluralizeProducts = (count: number) =>
  pluralize(count, ['товар', 'товара', 'товаров']);
