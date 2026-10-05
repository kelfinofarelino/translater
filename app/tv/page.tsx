'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';

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

  // Typewriter Loop Effect
  const [typedText, setTypedText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const fullSentence = 'Waiting for Speakers...';

  useEffect(() => {
    if (messages.length > 0) return;

    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (typedText.length < fullSentence.length) {
        timer = setTimeout(() => {
          setTypedText(fullSentence.substring(0, typedText.length + 1));
        }, 120);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (typedText.length > 0) {
        timer = setTimeout(() => {
          setTypedText(fullSentence.substring(0, typedText.length - 1));
        }, 60);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
        }, 600);
      }
    }

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, messages.length]);

  useEffect(() => {
    const randomId = Math.floor(1000 + Math.random() * 9000).toString();
    setSessionId(randomId);

    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setJoinUrl(`${origin}/mic?session=${randomId}`);
    }
  }, []);

  const speakText = (text: string, lang: string) => {
    if (!isAudioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang.startsWith('zh') ? 'zh-CN' : 'id-ID';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!sessionId) return;

    const channelName = `room-${sessionId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'new-translation' }, (payload) => {
        const newMsg: SubtitleMessage = payload.payload;

        setMessages((prev) => [...prev, newMsg]);
        speakText(newMsg.translatedText, newMsg.targetLang);
      })
      .subscribe((status) => {
        console.log(`Supabase Realtime Channel [${channelName}] Status:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isAudioEnabled]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* LEFT SIDEBAR */}
      <aside className="flex w-96 flex-col justify-between border-r border-slate-800 bg-slate-900/60 p-8 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
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
              Scan with mobile camera to speak
            </p>
          </div>
        </div>

        {/* Audio Toggle */}
        <div className="border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 font-semibold text-sm transition-all ${
              isAudioEnabled
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            {isAudioEnabled ? (
              <>
                {/* Volume High Icon */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span>TV Audio Enabled (TTS)</span>
              </>
            ) : (
              <>
                {/* Volume Off / Muted Icon */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                <span>TV Audio Muted</span>
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-500">
            Powered by DeepL & Google NMT
          </p>
        </div>
      </aside>

      {/* RIGHT DISPLAY */}
      <section className="flex flex-1 flex-col justify-between p-10">
        <div className="flex-1 overflow-y-auto pr-4 space-y-6 pb-28">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              {/* Mic Icon with Breathing Pulse */}
              <div className="relative mb-6 flex items-center justify-center">
                <div className="absolute h-28 w-28 rounded-full bg-cyan-500/10 animate-ping opacity-30" />
                <div className="relative z-10 flex items-center justify-center rounded-full border border-slate-800 bg-slate-900 p-6 text-cyan-400 shadow-2xl transition-transform duration-500 hover:scale-105">
                  <svg
                    className="h-10 w-10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
              </div>

              {/* Typewriter Text */}
              <div className="h-10 flex items-center justify-center">
                <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-200 to-slate-300">
                  {typedText}
                  <span className="inline-block w-0.5 h-7 ml-1 bg-cyan-400 animate-pulse align-middle" />
                </h2>
              </div>

              <p className="mt-4 max-w-sm text-sm text-slate-500 leading-relaxed">
                Scan the QR code on the left sidebar to begin speaking in Indonesian or Mandarin.
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
                      {isIndonesian ? 'Indonesian Speaker' : 'Mandarin Speaker'}
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      Via {msg.engineUsed}
                    </span>
                  </div>

                  {/* Translated Text */}
                  <p className="text-3xl font-bold leading-relaxed tracking-wide text-white">
                    {msg.translatedText}
                  </p>

                  {/* Original Transcript */}
                  <p className="mt-3 text-base text-slate-400 italic">
                    "{msg.originalText}"
                  </p>
                </div>
              );
            })
          )}
          <div ref={bottomRef} className="h-10" />
        </div>
      </section>
    </main>
  );
}