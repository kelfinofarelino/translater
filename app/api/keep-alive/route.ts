import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Tandai route ini sebagai dynamic agar tidak di-evaluate secara statis saat build
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  // Inisialisasi client di dalam request handler
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('pings')
    .upsert({ id: 1, last_ping: new Date().toISOString() })
    .select();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Supabase ping recorded successfully',
    timestamp: new Date().toISOString(),
    data,
  });
}