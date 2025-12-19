import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    console.log('Products API called with category:', category);

    const supabase = await createClient();

    // ИСПРАВЛЕНИЕ: Строгая фильтрация БЕЗ переменной query
    let data, error;

    if (category === 'merch') {
      console.log('Fetching ONLY merch (is_gift = false)');
      const result = await supabase
        .from('products')
        .select('*')
        .eq('is_gift', false)
        .order('id');
      data = result.data;
      error = result.error;
    } else if (category === 'gifts') {
      console.log('Fetching ONLY gifts (is_gift = true)');
      const result = await supabase
        .from('products')
        .select('*')
        .eq('is_gift', true)
        .order('id');
      data = result.data;
      error = result.error;
    } else {
      console.log('Fetching ALL products');
      const result = await supabase.from('products').select('*').order('id');
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Ошибка получения товаров' },
        { status: 500 }
      );
    }

    // ✅ Сортировка товаров перед возвратом
    const sortedData = data
      ? [...data].sort((a, b) => {
          // 1️⃣ Сначала товары в наличии (remains > 0)
          const aInStock = a.remains > 0 ? 1 : 0;
          const bInStock = b.remains > 0 ? 1 : 0;

          if (aInStock !== bInStock) {
            return bInStock - aInStock; // В наличии выше
          }

          // 2️⃣ Потом по цене (от меньшей к большей)
          return a.price - b.price;
        })
      : [];

    return NextResponse.json({ products: sortedData });
  } catch (error) {
    console.error('Products error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
