// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/sessions';
import { getUserPoints, withdrawPoints } from '@/lib/ispring/api';
import { MAIL_FROM, SHOP_EMAIL, escapeHtml, transporter } from '@/lib/mail';
import { pluralizePoints } from '@/lib/format';

// Запас по времени для iSpring и SMTP. Блокировка заказа живёт дольше (LOCK_TTL_MS),
// поэтому даже убитая по таймауту функция не оставит пользователя заблокированным навсегда
export const maxDuration = 60;
const LOCK_TTL_MS = 2 * 60 * 1000;

type CartProduct = { name: string; price: number; remains: number };

/**
 * Атомарно меняет остаток через compare-and-swap: обновление проходит, только если
 * остаток не изменился с момента чтения. Возвращает false, если товара не хватает.
 */
async function adjustRemains(
  supabase: SupabaseClient,
  productId: number,
  delta: number
): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: product } = await supabase
      .from('products')
      .select('remains')
      .eq('id', productId)
      .single();

    if (!product) return false;
    const next = product.remains + delta;
    if (next < 0) return false;

    const { data: updated } = await supabase
      .from('products')
      .update({ remains: next })
      .eq('id', productId)
      .eq('remains', product.remains)
      .select('id');

    if (updated?.length) return true;
  }
  return false;
}

/**
 * Блокировка «один заказ пользователя одновременно» через таблицу order_locks
 * (user_id — первичный ключ). На Vercel память у инстансов не общая, поэтому
 * in-memory блокировка не защищала от двойного клика и двух вкладок.
 */
async function acquireOrderLock(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  await supabase
    .from('order_locks')
    .delete()
    .eq('user_id', userId)
    .lt('created_at', new Date(Date.now() - LOCK_TTL_MS).toISOString());

  const { error } = await supabase.from('order_locks').insert({ user_id: userId });
  if (!error) return true;
  if (error.code === '23505') return false;
  throw error;
}

async function releaseStock(
  supabase: SupabaseClient,
  reserved: { product_id: number; quantity: number }[]
) {
  for (const item of reserved) {
    if (!(await adjustRemains(supabase, item.product_id, item.quantity))) {
      console.error('❌ Failed to release stock:', item);
    }
  }
}

// POST - создание нового заказа
export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Необходима авторизация' },
      { status: 401 }
    );
  }

  const supabase = createClient();

  if (!(await acquireOrderLock(supabase, session.userId))) {
    return NextResponse.json(
      { error: 'Заказ уже оформляется' },
      { status: 409 }
    );
  }

  try {

    const [{ data: userData }, { data: cartItems, error: cartError }] =
      await Promise.all([
        supabase
          .from('users')
          .select('first_name, last_name, email, ispring_user_id')
          .eq('id', session.userId)
          .single(),
        supabase
          .from('cart_items')
          .select('quantity, product_id, products(name, price, remains)')
          .eq('user_id', session.userId),
      ]);

    if (!userData) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Корзина пуста' }, { status: 400 });
    }

    // Стоимость считаем по текущей цене товара, а не по сохранённой в корзине
    const orderItems = [];
    for (const item of cartItems) {
      const product = (
        Array.isArray(item.products) ? item.products[0] : item.products
      ) as CartProduct | null;

      if (!product || item.quantity <= 0 || item.quantity > product.remains) {
        return NextResponse.json(
          {
            error: product
              ? `Недостаточно товара "${product.name}" на складе. Доступно: ${product.remains}`
              : 'Один из товаров больше недоступен',
          },
          { status: 400 }
        );
      }

      orderItems.push({
        product_id: item.product_id,
        name: product.name,
        quantity: item.quantity,
        price: product.price * item.quantity,
      });
    }

    const totalCost = orderItems.reduce((sum, item) => sum + item.price, 0);

    const userPoints = await getUserPoints(userData.ispring_user_id);
    if (userPoints === null) {
      return NextResponse.json(
        { error: 'Не удалось получить баланс баллов. Попробуйте позже.' },
        { status: 503 }
      );
    }
    if (userPoints < totalCost) {
      return NextResponse.json(
        {
          error: `Недостаточно баллов. Нужно ${totalCost}, у вас ${userPoints}`,
        },
        { status: 400 }
      );
    }

    // 1. Резервируем остатки
    const reserved: typeof orderItems = [];
    for (const item of orderItems) {
      if (!(await adjustRemains(supabase, item.product_id, -item.quantity))) {
        await releaseStock(supabase, reserved);
        return NextResponse.json(
          {
            error: `Товар "${item.name}" закончился. Обновите корзину.`,
          },
          { status: 409 }
        );
      }
      reserved.push(item);
    }

    // 2. Списываем баллы
    const withdrawSuccess = await withdrawPoints(
      userData.ispring_user_id,
      totalCost,
      'Заказ в веб-магазине подарков КСЭ'
    );

    if (!withdrawSuccess) {
      await releaseStock(supabase, reserved);
      return NextResponse.json(
        { error: 'Не удалось списать баллы' },
        { status: 502 }
      );
    }

    // Баллы списаны — дальше ошибки не должны превращаться в ответ «заказ не оформлен»,
    // иначе пользователь повторит заказ и заплатит дважды.
    const userName = `${userData.first_name} ${userData.last_name}`;

    const { error: orderError } = await supabase.from('orders').insert({
      user_id: session.userId,
      user_name: userName,
      email: userData.email,
      items: orderItems,
      total_cost: totalCost,
    });

    if (orderError) {
      console.error('❌ CRITICAL: points withdrawn but order not saved', {
        userId: session.userId,
        orderItems,
        totalCost,
        orderError,
      });
    }

    const { error: clearError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', session.userId);
    if (clearError) console.error('❌ Cart clear error:', clearError);

    const itemsText = orderItems
      .map(
        (item, i) =>
          `${i + 1}. ${item.name} - ${item.quantity} шт.\n` +
          `Стоимость: ${item.price} ${pluralizePoints(item.price)}`
      )
      .join('\n\n');
    const totalText = `💰 Общая стоимость: ${totalCost} ${pluralizePoints(totalCost)}`;

    const orderText =
      `🛍 Новый заказ из веб-магазина!\n\n` +
      (orderError ? `⚠️ Заказ не сохранился в БД, баллы списаны!\n\n` : '') +
      `👤 ${userName}\n` +
      `📧 ${userData.email}\n\n` +
      `📋 Заказ:\n` +
      itemsText +
      `\n\n${totalText}`;

    const userText =
      `Вы оформили заказ в Магазине Подарков КСЭ:\n\n` +
      `📋 Ваш заказ:\n` +
      itemsText +
      `\n\n${totalText}\n\n` +
      `Просьба подтвердить ответным письмом.`;

    const userHtml =
      `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">` +
      `<p>Вы оформили заказ в Магазине Подарков КСЭ:</p>` +
      `<h3 style="margin-top: 20px;">📋 Ваш заказ:</h3>` +
      `<div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px;">` +
      orderItems
        .map(
          (item, i) =>
            `<p style="margin: 10px 0;"><strong>${i + 1}. ${escapeHtml(
              item.name
            )}</strong> - ${item.quantity} шт.<br>` +
            `Стоимость: ${item.price} ${pluralizePoints(item.price)}</p>`
        )
        .join('') +
      `</div>` +
      `<p style="font-size: 16px; margin-top: 20px;"><strong>${totalText}</strong></p>` +
      `<p style="font-size: 16px; font-weight: bold; color: #d32f2f; margin-top: 30px;">` +
      `Просьба подтвердить ответным письмом.` +
      `</p>` +
      `</div>`;

    const mailResults = await Promise.allSettled([
      transporter.sendMail({
        from: MAIL_FROM,
        to: SHOP_EMAIL,
        subject: 'Новый заказ из веб-магазина',
        text: orderText,
      }),
      transporter.sendMail({
        from: MAIL_FROM,
        to: userData.email,
        subject: 'Ваш заказ в Магазине подарков КСЭ',
        text: userText,
        html: userHtml,
      }),
    ]);
    for (const result of mailResults) {
      if (result.status === 'rejected') {
        console.error('❌ Order mail error:', result.reason, { orderText });
      }
    }

    return NextResponse.json({
      success: true,
      totalCost,
      remainingPoints: userPoints - totalCost,
    });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  } finally {
    const { error } = await supabase
      .from('order_locks')
      .delete()
      .eq('user_id', session.userId);
    if (error) console.error('❌ Order lock release error:', error);
  }
}
