import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  // Proteksi sederhana dari akses sembarangan
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Melakukan query update/insert ke tabel pings agar Supabase mencatat aktivitas
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