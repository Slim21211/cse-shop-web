import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    const supabase = await createClient();

    let query = supabase.from('products').select('*').order('id');

    // Фильтр по категории
    if (category === 'merch') {
      query = query.eq('is_gift', false);
    } else if (category === 'gifts') {
      query = query.eq('is_gift', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Ошибка получения товаров' },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: data });
  } catch (error) {
    console.error('Products error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
