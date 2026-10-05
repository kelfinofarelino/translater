'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function MicContent() {
  const searchParams = useSearchParams();
  const sessionFromUrl = searchParams.get('session') || '';

  const [sessionId, setSessionId] = useState<string>(sessionFromUrl);
  const [role, setRole] = useState<'id' | 'zh'>('id'); // 'id' = Bahasa Indonesia, 'zh' = Mandarin
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Siap bicara');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  // Setup Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        // Safari iOS lebih stabil tanpa continuous
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
          setTranscript(text);
          setInterimTranscript('');
        };

        recognition.onerror = (event: any) => {
          console.error('Speech Recognition Error:', event.error);
          if (event.error === 'not-allowed') {
            setStatusMessage('Izin mic ditolak. Cek Pengaturan Safari.');
          } else {
            setStatusMessage(`Status: ${event.error}`);
          }
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
          setStatusMessage('Selesai merekam. Siap dikirim.');
        };

        recognitionRef.current = recognition;
      } else {
        setStatusMessage('Browser tidak mendukung Web Speech.');
      }
    }
  }, []);

  // Update bahasa recognition saat user berganti peran
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = role === 'id' ? 'id-ID' : 'zh-CN';
    }
  }, [role]);

  // Handle Mulai / Berhenti Rekam
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition tidak didukung di browser ini.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setStatusMessage('Merekam berhenti');
    } else {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.lang = role === 'id' ? 'id-ID' : 'zh-CN';
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setStatusMessage('Mendengarkan...');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Kirim dan Terjemahkan Teks ke TV
  const handleSendAndTranslate = async () => {
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (!fullText) {
      alert('Belum ada suara atau teks yang terdeteksi.');
      return;
    }

    if (!sessionId) {
      alert('Session ID belum diisi.');
      return;
    }

    // Hentikan mic jika masih aktif
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsTranslating(true);
    setStatusMessage('Menerjemahkan...');

    const sourceLang = role === 'id' ? 'id' : 'zh';
    const targetLang = role === 'id' ? 'zh' : 'id';

    try {
      // 1. Panggil API terjemahan 4 tier
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText,
          sourceLang,
          targetLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menerjemahkan');

      const translatedText = data.translatedText;
      const engineUsed = data.engine;

      // 2. Broadcast ke TV via Supabase Channel
      const channel = supabase.channel(`room-${sessionId}`);
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'new-translation',
            payload: {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              senderRole: role,
              sourceLang,
              targetLang,
              originalText: fullText,
              translatedText,
              engineUsed,
              timestamp: Date.now(),
            },
          });

          setStatusMessage('Terkirim ke layar TV!');
          setTranscript('');
          setInterimTranscript('');
          setIsTranslating(false);
          // Lepas channel sementara setelah broadcast
          supabase.removeChannel(channel);
        }
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Gagal kirim: ${err.message}`);
      setIsTranslating(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col justify-between bg-slate-950 p-6 text-slate-100 select-none">
      {/* HEADER: Info Sesi & Peran */}
      <header className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Mic Controller</h1>
            <p className="text-xs text-slate-400">Hubungkan suara ke Layar TV</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Session:</span>
            <input
              type="text"
              maxLength={4}
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="0000"
              className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-center font-mono text-sm font-bold text-cyan-400 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Toggle Bahasa Pembicara */}
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-900/80 p-1.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setRole('id')}
            className={`flex flex-col items-center justify-center rounded-xl py-2.5 transition-all ${
              role === 'id'
                ? 'bg-emerald-600 text-white font-semibold shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base">🇮🇩 Indonesia</span>
            <span className="text-[10px] opacity-80 mt-0.5">Ke Mandarin</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('zh')}
            className={`flex flex-col items-center justify-center rounded-xl py-2.5 transition-all ${
              role === 'zh'
                ? 'bg-cyan-600 text-white font-semibold shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base">🇨🇳 中文 (Mandarin)</span>
            <span className="text-[10px] opacity-80 mt-0.5">Ke Indonesia</span>
          </button>
        </div>
      </header>

      {/* BODY: Kotak Preview Transkrip */}
      <section className="my-6 flex flex-1 flex-col justify-center">
        <div className="min-h-[140px] rounded-3xl border border-slate-800 bg-slate-900/50 p-5 shadow-inner flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Transkrip Suara
          </p>
          <div className="flex-1 overflow-y-auto">
            {transcript || interimTranscript ? (
              <p className="text-lg leading-relaxed text-slate-200">
                {transcript}{' '}
                <span className="text-cyan-400 italic opacity-80">{interimTranscript}</span>
              </p>
            ) : (
              <p className="text-sm italic text-slate-600">
                Tekan tombol mic di bawah, lalu bicaralah...
              </p>
            )}
          </div>
          <p className="text-right text-[11px] font-medium text-slate-400 mt-2">
            {statusMessage}
          </p>
        </div>
      </section>

      {/* FOOTER: Tombol Mic & Aksi */}
      <footer className="space-y-4 pb-2">
        <div className="flex items-center justify-center gap-6">
          {/* Tombol Mic Utama */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-2xl transition-all duration-300 active:scale-95 ${
              isRecording
                ? 'border-rose-500 bg-rose-600 text-white animate-pulse shadow-rose-500/50'
                : role === 'id'
                ? 'border-emerald-500/40 bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/30'
                : 'border-cyan-500/40 bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-500/30'
            }`}
          >
            <span className="text-3xl">{isRecording ? '⏹️' : '🎙️'}</span>
          </button>
        </div>

        {/* Tombol Terjemahkan & Kirim */}
        <button
          type="button"
          disabled={isTranslating || (!transcript && !interimTranscript)}
          onClick={handleSendAndTranslate}
          className={`w-full rounded-2xl py-4 font-bold text-base tracking-wide transition-all shadow-lg ${
            isTranslating || (!transcript && !interimTranscript)
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-white text-slate-950 hover:bg-slate-200 active:scale-[0.98]'
          }`}
        >
          {isTranslating ? 'Mengirim & Menerjemahkan...' : '🚀 Terjemahkan & Tayangkan ke TV'}
        </button>
      </footer>
    </main>
  );
}

export default function MicPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-6">Loading Mic...</div>}>
      <MicContent />
    </Suspense>
  );
}