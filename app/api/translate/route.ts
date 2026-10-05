import { NextResponse } from 'next/server';

interface TranslatePayload {
  text: string;
  sourceLang: string;
  targetLang: string;
}

// 1. Tier 1: DeepL Free API
async function translateDeepL(text: string, targetLang: string): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error('DeepL API Key belum diset di .env.local');

  const target = targetLang.startsWith('zh') ? 'ZH' : 'ID';

  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      target_lang: target,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepL Error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const result = data.translations?.[0]?.text;
  if (!result) throw new Error('DeepL mengembalikan respons kosong');
  return result;
}

// 2. Tier 2: Lingva Translate API (Publik, tanpa key)
async function translateLingva(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const sl = sourceLang.startsWith('zh') ? 'zh' : 'id';
  const tl = targetLang.startsWith('zh') ? 'zh' : 'id';

  const res = await fetch(
    `https://lingva.ml/api/v1/${sl}/${tl}/${encodeURIComponent(text)}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );

  if (!res.ok) {
    throw new Error(`Lingva Error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.translation) throw new Error('Lingva translation kosong');
  return data.translation;
}

// 3. Tier 3: MyMemory API (Dengan parameter email kuota 50k kata/hari)
async function translateMyMemory(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const sl = sourceLang.startsWith('zh') ? 'zh-CN' : 'id-ID';
  const tl = targetLang.startsWith('zh') ? 'zh-CN' : 'id-ID';
  const email = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : '';

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${tl}${email}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`MyMemory Error ${res.status}`);
  }

  const data = await res.json();
  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || 'MyMemory gagal merespons');
  }

  const result = data.responseData?.translatedText;
  if (!result) throw new Error('MyMemory hasil kosong');
  return result;
}

// 4. Tier 4: Google Public Endpoint ('gtx' - Tanpa Limit Kuota)
async function translateGooglePublic(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const sl = sourceLang.startsWith('zh') ? 'zh-CN' : 'id';
  const tl = targetLang.startsWith('zh') ? 'zh-CN' : 'id';

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  if (!res.ok) {
    throw new Error(`Google Public Error ${res.status}`);
  }

  const data = await res.json();
  const result = data[0]?.map((item: any) => item[0])?.filter(Boolean)?.join('');
  if (!result) throw new Error('Google Public hasil kosong');
  return result;
}

// Route Handler Utama
export async function POST(req: Request) {
  try {
    const { text, sourceLang, targetLang }: TranslatePayload = await req.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ translatedText: '', engine: 'none' });
    }

    // 1. Coba DeepL
    try {
      const translated = await translateDeepL(text, targetLang);
      return NextResponse.json({ translatedText: translated, engine: 'deepl-free' });
    } catch (e: any) {
      console.warn('Tier 1 (DeepL) dilewati/gagal:', e.message);
    }

    // 2. Coba Lingva
    try {
      const translated = await translateLingva(text, sourceLang, targetLang);
      return NextResponse.json({ translatedText: translated, engine: 'lingva' });
    } catch (e: any) {
      console.warn('Tier 2 (Lingva) dilewati/gagal:', e.message);
    }

    // 3. Coba MyMemory
    try {
      const translated = await translateMyMemory(text, sourceLang, targetLang);
      return NextResponse.json({ translatedText: translated, engine: 'mymemory' });
    } catch (e: any) {
      console.warn('Tier 3 (MyMemory) dilewati/gagal:', e.message);
    }

    // 4. Coba Google Public
    try {
      const translated = await translateGooglePublic(text, sourceLang, targetLang);
      return NextResponse.json({ translatedText: translated, engine: 'google-public' });
    } catch (e: any) {
      console.error('Tier 4 (Google Public) gagal:', e.message);
      // Fallback mutlak: kembalikan teks asli agar UI tidak crash
      return NextResponse.json({ translatedText: text, engine: 'raw-fallback' });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}