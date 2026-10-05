'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';

// Inisialisasi Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SubtitleMessage {
  id: string;
  senderRole: 'id' | 'zh';
  sourceLang: string;
  targetLang: string;
  originalText: string;
  translatedText: string;
  engineUsed: string;
  timestamp: number;
}

export default function TVDisplayPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [messages, setMessages] = useState<SubtitleMessage[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 1. Generate Session ID dan URL Join
  useEffect(() => {
    const randomId = Math.floor(1000 + Math.random() * 9000).toString();
    setSessionId(randomId);

    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setJoinUrl(`${origin}/mic?session=${randomId}`);
    }
  }, []);

  // 2. Fungsi Text-to-Speech (TTS)
  const speakText = (text: string, lang: string) => {
    if (!isAudioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    // Batalkan audio antrean sebelumnya agar tidak tumpang tindih
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Tentukan kode bahasa untuk browser TTS
    utterance.lang = lang.startsWith('zh') ? 'zh-CN' : 'id-ID';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  };

  // 3. Bergabung ke Supabase Realtime Channel
  useEffect(() => {
    if (!sessionId) return;

    const channelName = `room-${sessionId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'new-translation' }, (payload) => {
        const newMsg: SubtitleMessage = payload.payload;

        setMessages((prev) => [...prev, newMsg]);

        // Bacakan teks terjemahan ke speaker TV
        speakText(newMsg.translatedText, newMsg.targetLang);
      })
      .subscribe((status) => {
        console.log(`Supabase Realtime Channel [${channelName}] Status:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isAudioEnabled]);

  // Auto-scroll ke bawah tiap ada teks baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* SISI KIRI: Sidebar Info Rapat & QR Code */}
      <aside className="flex w-96 flex-col justify-between border-r border-slate-800 bg-slate-900/60 p-8 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3.5 w-3.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-wider text-slate-200 uppercase">
              Meeting Relay
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">ID / ZH Realtime Subtitle Display</p>

          {/* Session ID Card */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-center shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Session Code
            </p>
            <p className="mt-1 text-5xl font-mono font-black tracking-widest text-cyan-400">
              {sessionId || '----'}
            </p>
          </div>

          {/* QR Code */}
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-slate-800 bg-white p-5 shadow-2xl">
            {joinUrl ? (
              <QRCodeSVG value={joinUrl} size={200} level="M" />
            ) : (
              <div className="h-[200px] w-[200px] bg-slate-200 animate-pulse rounded-lg" />
            )}
            <p className="mt-3 text-center text-xs font-medium text-slate-700">
              Pindai QR ini dari kamera ponsel untuk berbicara
            </p>
          </div>
        </div>

        {/* Audio Toggle & Footer */}
        <div className="border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 font-semibold text-sm transition-all ${
              isAudioEnabled
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            <span>{isAudioEnabled ? '🔊 Suara TV Aktif (TTS)' : '🔇 Suara TV Mati'}</span>
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            Powered by DeepL & Google NMT
          </p>
        </div>
      </aside>

      {/* SISI KANAN: Layar Utama Subtitle & Transkrip */}
      <section className="flex flex-1 flex-col justify-between p-10">
        <div className="flex-1 overflow-y-auto pr-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <div className="rounded-full bg-slate-900 border border-slate-800 p-6 shadow-xl mb-4">
                <span className="text-4xl">🎙️</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-300">Menunggu Pembicara...</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-400">
                Pindai QR Code di samping menggunakan ponsel untuk mulai berbicara dalam Bahasa Indonesia atau Mandarin.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isIndonesian = msg.senderRole === 'id';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col rounded-3xl border p-6 transition-all duration-300 shadow-xl ${
                    isIndonesian
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-100 ml-12'
                      : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-100 mr-12'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                    <span className={isIndonesian ? 'text-emerald-400' : 'text-cyan-400'}>
                      {isIndonesian ? '🇮🇩 Pembicara Indonesia' : '🇨🇳 Pembicara Mandarin'}
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      Via {msg.engineUsed}
                    </span>
                  </div>

                  {/* Kalimat Hasil Terjemahan (Teks Besar) */}
                  <p className="text-3xl font-bold leading-relaxed tracking-wide text-white">
                    {msg.translatedText}
                  </p>

                  {/* Kalimat Asli (Teks Kecil di Bawah) */}
                  <p className="mt-3 text-base text-slate-400 italic">
                    "{msg.originalText}"
                  </p>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </section>
    </main>
  );
}