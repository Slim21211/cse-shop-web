// МАГАЗИН: src/app/api/user/role/route.ts — роль для показа кнопки в ЛК (admin/manager/none).
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/sessions';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ role: 'none' }, { status: 401 });

  // service-role клиент (серверный роут) — читает org_* без оглядки на RLS
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // admin?
  const { data: adm } = await sb
    .from('admins')
    .select('user_id')
    .eq('user_id', session.userId)
    .maybeSingle();
  if (adm) return NextResponse.json({ role: 'admin' });

  // manager?
  const { data: u } = await sb
    .from('users')
    .select('ispring_user_id')
    .eq('id', session.userId)
    .maybeSingle();
  const ispringId = u?.ispring_user_id;
  if (ispringId) {
    const { data: deps } = await sb
      .from('org_departments')
      .select('department_id')
      .eq('supervisor_ispring_id', ispringId);
    const ids = (deps || []).map(
      (d: { department_id: string }) => d.department_id
    );
    if (ids.length) {
      const { data: allowed } = await sb
        .from('available_departments')
        .select('department_id')
        .in('department_id', ids);
      if (allowed && allowed.length)
        return NextResponse.json({ role: 'manager' });
    }
  }
  return NextResponse.json({ role: 'none' });
}
