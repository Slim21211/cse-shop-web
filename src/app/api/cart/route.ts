import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/sessions';

const MAX_QUANTITY = 99;

function isPositiveInt(value: unknown, max = Number.MAX_SAFE_INTEGER) {
  return Number.isInteger(value) && (value as number) > 0 && (value as number) <= max;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product_id, quantity } = await request.json();

    // Без проверки можно было передать отрицательное количество и получить
    // отрицательную стоимость, уменьшив сумму заказа
    if (!isPositiveInt(product_id) || !isPositiveInt(quantity, MAX_QUANTITY)) {
      return NextResponse.json(
        { error: 'Некорректные параметры' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: product } = await supabase
      .from('products')
      .select('price, remains')
      .eq('id', product_id)
      .maybeSingle();

    if (!product || product.remains < quantity) {
      return NextResponse.json({ error: 'Товар недоступен' }, { status: 400 });
    }

    const { error } = await supabase.from('cart_items').upsert({
      user_id: session.userId,
      product_id,
      quantity,
      price: product.price * quantity,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Ошибка добавления в корзину' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product_id } = await request.json();
    if (!isPositiveInt(product_id)) {
      return NextResponse.json(
        { error: 'Некорректные параметры' },
        { status: 400 }
      );
    }

    const { error } = await createClient()
      .from('cart_items')
      .delete()
      .eq('user_id', session.userId)
      .eq('product_id', product_id);

    if (error) {
      return NextResponse.json(
        { error: 'Ошибка удаления из корзины' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
