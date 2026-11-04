import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/sessions';
import { ONBOARDING_STEP_KEYS } from '@/lib/onboarding';

// POST { steps: string[] } — отметить шаги просмотренными.
// «Дальше» отправляет один шаг, «Пропустить» — все оставшиеся.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { steps } = await request.json();
    if (
      !Array.isArray(steps) ||
      steps.length === 0 ||
      !steps.every((step) => ONBOARDING_STEP_KEYS.includes(step))
    ) {
      return NextResponse.json(
        { error: 'Некорректные параметры' },
        { status: 400 }
      );
    }

    const { error } = await createClient()
      .from('onboarding_views')
      .upsert(
        [...new Set<string>(steps)].map((step) => ({
          user_id: session.userId,
          step,
        })),
        { onConflict: 'user_id,step', ignoreDuplicates: true }
      );

    if (error) {
      console.error('❌ Onboarding save error:', error);
      return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding POST error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
