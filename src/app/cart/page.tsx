import { redirect } from 'next/navigation';
import { getCartItems, getCurrentUser, getPoints } from '@/lib/data';
import CartView from './cartView';

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/cart');

  const items = await getCartItems(user.id);

  // Баллы не ждём: iSpring медленный, промис дорисуется на клиенте
  return (
    <CartView
      initialItems={items}
      pointsPromise={getPoints(user.ispring_user_id)}
    />
  );
}
