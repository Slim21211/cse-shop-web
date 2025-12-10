import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/sessions';

export async function GET() {
  try {
    const supabase = await createClient();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', session.userId);

    if (error) {
      return NextResponse.json(
        { error: 'Ошибка получения корзины' },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data });
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product_id, quantity } = await request.json();

    // Проверяем товар
    const { data: product } = await supabase
      .from('products')
      .select('price, remains')
      .eq('id', product_id)
      .single();

    if (!product || product.remains < quantity) {
      return NextResponse.json({ error: 'Товар недоступен' }, { status: 400 });
    }

    // Добавляем в корзину
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
    const supabase = await createClient();
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product_id } = await request.json();

    const { error } = await supabase
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
