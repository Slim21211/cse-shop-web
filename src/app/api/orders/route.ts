// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/sessions';
import { getUserPoints, withdrawPoints } from '@/lib/ispring/api';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.cse.ru',
  port: 587,
  secure: false,
  requireTLS: true,
  connectionTimeout: 10000,
  tls: {
    rejectUnauthorized: false,
    secureProtocol: 'TLSv1_2_method',
  },
  auth: {
    user: 'giftshop@cse.ru',
    pass: process.env.MAIL_PASSWORD,
  },
});

function pluralizePoints(count: number): string {
  const cases = [2, 0, 1, 1, 1, 2];
  const titles = ['балл', 'балла', 'баллов'];
  return titles[
    count % 100 > 4 && count % 100 < 20
      ? 2
      : cases[count % 10 < 5 ? count % 10 : 5]
  ];
}

// GET - получение заказов пользователя
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // ✅ ИЗМЕНЕНИЕ: Сначала получаем email пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', session.userId)
      .single();

    if (userError || !userData) {
      console.error('❌ User not found:', userError);
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    console.log('✅ Fetching orders for email:', userData.email);

    // ✅ ИЗМЕНЕНИЕ: Ищем заказы по email вместо user_id
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, created_at, total_cost, items, user_name, email')
      .eq('email', userData.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Orders fetch error:', error);
      return NextResponse.json(
        { error: 'Ошибка получения заказов' },
        { status: 500 }
      );
    }

    console.log('✅ Orders fetched:', {
      count: orders?.length || 0,
      email: userData.email,
    });

    // Нормализуем данные перед отправкой
    const normalizedOrders = (orders || []).map((order) => ({
      id: order.id,
      created_at: order.created_at,
      total_cost: order.total_cost,
      items: Array.isArray(order.items) ? order.items : [],
      user_name: order.user_name,
      email: order.email,
    }));

    return NextResponse.json({ orders: normalizedOrders });
  } catch (error) {
    console.error('❌ Orders GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST - создание нового заказа
export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Получаем данные пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('first_name, last_name, email, ispring_user_id')
      .eq('id', session.userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Получаем корзину
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('quantity, product_id, price, products(name, price, remains)')
      .eq('user_id', session.userId);

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Корзина пуста' }, { status: 400 });
    }

    // Проверяем остатки
    for (const item of cartItems) {
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;

      if (!product || item.quantity > product.remains) {
        return NextResponse.json(
          {
            error: `Недостаточно товара "${product?.name}" на складе. Доступно: ${product?.remains}`,
          },
          { status: 400 }
        );
      }
    }

    const totalCost = cartItems.reduce((sum, item) => sum + item.price, 0);

    // Проверяем баллы
    const userPoints = await getUserPoints(userData.ispring_user_id);
    if (userPoints < totalCost) {
      return NextResponse.json(
        {
          error: `Недостаточно баллов. Нужно ${totalCost}, у вас ${userPoints}`,
        },
        { status: 400 }
      );
    }

    // Формируем данные заказа
    const orderItems = cartItems.map((item) => {
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;

      return {
        product_id: item.product_id,
        name: product.name,
        quantity: item.quantity,
        price: item.price,
      };
    });

    console.log('📦 Creating order with items:', orderItems);

    // Сохраняем заказ (user_id все еще сохраняется для новых заказов)
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session.userId,
        user_name: `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        items: orderItems,
        total_cost: totalCost,
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Ошибка создания заказа' },
        { status: 500 }
      );
    }

    console.log('✅ Order created:', newOrder);

    // Списываем баллы
    const withdrawSuccess = await withdrawPoints(
      userData.ispring_user_id,
      totalCost,
      'Заказ в веб-магазине подарков КСЭ'
    );

    if (!withdrawSuccess) {
      return NextResponse.json(
        { error: 'Не удалось списать баллы' },
        { status: 500 }
      );
    }

    // Обновляем остатки товаров
    for (const item of cartItems) {
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;

      const newRemains = product.remains - item.quantity;

      await supabase
        .from('products')
        .update({ remains: newRemains })
        .eq('id', item.product_id);
    }

    // Формируем текст письма
    const orderText =
      `🛍 Новый заказ из веб-магазина!\n\n` +
      `👤 ${userData.first_name} ${userData.last_name}\n` +
      `📧 ${userData.email}\n\n` +
      `📋 Заказ:\n` +
      orderItems
        .map(
          (item, i) =>
            `${i + 1}. ${item.name} - ${item.quantity} шт.\n` +
            `Стоимость: ${item.price} ${pluralizePoints(item.price)}`
        )
        .join('\n\n') +
      `\n\n💰 Общая стоимость: ${totalCost} ${pluralizePoints(totalCost)}`;

    const userText =
      `Вы оформили заказ в Магазине Подарков КСЭ:\n\n` +
      `📋 Ваш заказ:\n` +
      orderItems
        .map(
          (item, i) =>
            `${i + 1}. ${item.name} - ${item.quantity} шт.\n` +
            `Стоимость: ${item.price} ${pluralizePoints(item.price)}`
        )
        .join('\n\n') +
      `\n\n💰 Общая стоимость: ${totalCost} ${pluralizePoints(totalCost)}\n\n` +
      `Просьба подтвердить ответным письмом.`;

    // Отправляем письма
    await Promise.all([
      transporter.sendMail({
        from: '"Магазин подарков КСЭ" <giftshop@cse.ru>',
        to: 'giftshop@cse.ru',
        subject: 'Новый заказ из веб-магазина',
        text: orderText,
      }),
      transporter.sendMail({
        from: '"Магазин подарков КСЭ" <giftshop@cse.ru>',
        to: userData.email,
        subject: 'Ваш заказ в Магазине подарков КСЭ',
        text: userText,
      }),
    ]);

    // Очищаем корзину
    await supabase.from('cart_items').delete().eq('user_id', session.userId);

    return NextResponse.json({
      success: true,
      totalCost,
      remainingPoints: userPoints - totalCost,
    });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
