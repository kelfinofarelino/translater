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
  const [inputCode, setInputCode] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(Boolean(sessionFromUrl));

  const [role, setRole] = useState<'id' | 'zh'>('id');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to talk / 按住或点击说话');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const isHoldingRef = useRef<boolean>(false);
  const holdStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (sessionFromUrl) {
      setSessionId(sessionFromUrl);
      setIsJoined(true);
    }
  }, [sessionFromUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
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
            setStatusMessage('Mic permission denied / 麦克风权限被拒绝');
          } else {
            setStatusMessage(`Status: ${event.error}`);
          }
          setIsRecording(false);
          isHoldingRef.current = false;
        };

        recognition.onend = () => {
          setIsRecording(false);
          isHoldingRef.current = false;
          setStatusMessage('Recording finished / 录音完成');
        };

        recognitionRef.current = recognition;
      } else {
        setStatusMessage('Browser does not support Web Speech');
      }
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = role === 'id' ? 'id-ID' : 'zh-CN';
    }
  }, [role]);

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim();
    if (clean.length < 4) {
      alert('Please enter a 4-digit code / 请输入4位会议代码');
      return;
    }
    setSessionId(clean);
    setIsJoined(true);
  };

  const startRecording = () => {
    if (!recognitionRef.current || isRecording) return;
    setTranscript('');
    setInterimTranscript('');
    recognitionRef.current.lang = role === 'id' ? 'id-ID' : 'zh-CN';
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setStatusMessage('Listening... / 正在倾听...');
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current || !isRecording) return;
    recognitionRef.current.stop();
    setIsRecording(false);
    setStatusMessage('Recording finished / 录音完成');
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    holdStartTimeRef.current = Date.now();
    isHoldingRef.current = true;
    startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    const duration = Date.now() - holdStartTimeRef.current;
    if (duration > 400) {
      isHoldingRef.current = false;
      stopRecording();
    } else {
      isHoldingRef.current = false;
    }
  };

  const handleCancel = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    setTranscript('');
    setInterimTranscript('');
    setStatusMessage('Cancelled / 已取消');
  };

  const handleSendAndTranslate = async () => {
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (!fullText) {
      alert('No speech detected / 未检测到声音');
      return;
    }

    if (!sessionId) {
      setIsJoined(false);
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsTranslating(true);
    setStatusMessage('Translating... / 正在翻译...');

    const sourceLang = role === 'id' ? 'id' : 'zh';
    const targetLang = role === 'id' ? 'zh' : 'id';

    try {
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
      if (!res.ok) throw new Error(data.error || 'Translation failed');

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
              translatedText: data.translatedText,
              engineUsed: data.engine,
              timestamp: Date.now(),
            },
          });

          setStatusMessage('Sent to TV screen! / 已发送至屏幕');
          setTranscript('');
          setInterimTranscript('');
          setIsTranslating(false);
          supabase.removeChannel(channel);
        }
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Send failed: ${err.message}`);
      setIsTranslating(false);
    }
  };

  const hasContent = Boolean(transcript || interimTranscript);

  // VIEW 1: Input Session Code
  if (!isJoined) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100 select-none">
        <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            {/* Display Screen Icon */}
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Join Meeting</h1>
          <p className="mt-1 text-xs text-slate-400">Enter the 4-digit code shown on the TV</p>
          <p className="text-[11px] text-slate-500">输入电视屏幕上显示的4位代码</p>

          <form onSubmit={handleJoinSession} className="mt-6 space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              autoFocus
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-4 text-center font-mono text-4xl font-black tracking-widest text-cyan-400 placeholder:text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
            <button
              type="submit"
              disabled={inputCode.trim().length < 4}
              className="w-full rounded-2xl bg-cyan-500 py-4 font-bold text-slate-950 transition-all hover:bg-cyan-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
            >
              Connect to TV / 连接电视
            </button>
          </form>
        </div>
      </main>
    );
  }

  // VIEW 2: Controller Interface
  return (
    <main className="flex min-h-screen flex-col justify-between bg-slate-950 px-6 pt-10 pb-6 text-slate-100 select-none">
      {/* HEADER */}
      <header className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Mic Controller</h1>
            <p className="text-xs text-slate-400">Stream audio to TV Screen</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Session:</span>
            <button
              type="button"
              onClick={() => {
                setInputCode(sessionId);
                setIsJoined(false);
              }}
              title="Click to change session"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-sm font-bold text-cyan-400 hover:border-cyan-400 transition-colors"
            >
              <span>{sessionId}</span>
              {/* Edit Icon */}
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Language Selection */}
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
            <span className="text-base font-medium">Indonesian</span>
            <span className="text-[10px] opacity-80 mt-0.5">To Mandarin</span>
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
            <span className="text-base font-medium">中文 (Mandarin)</span>
            <span className="text-[10px] opacity-80 mt-0.5">To Indonesian</span>
          </button>
        </div>
      </header>

      {/* BODY */}
      <section className="my-6 flex flex-1 flex-col justify-center">
        <div className="min-h-[160px] rounded-3xl border border-slate-800 bg-slate-900/50 p-5 shadow-inner flex flex-col justify-between">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Speech Transcript / 实时文字
          </p>
          <div className="flex-1 overflow-y-auto max-h-48">
            {transcript || interimTranscript ? (
              <p className="text-xl leading-relaxed text-slate-100 font-medium">
                {transcript}{' '}
                <span className="text-cyan-400 italic opacity-80">{interimTranscript}</span>
              </p>
            ) : (
              <p className="text-sm italic text-slate-600">
                Tap or hold the mic button to speak...
                <br />
                <span className="text-xs opacity-75">点击或按住麦克风按钮开始说话...</span>
              </p>
            )}
          </div>
          <p className="text-right text-[11px] font-medium text-slate-400 mt-2">
            {statusMessage}
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex items-center justify-center gap-8 pb-20 pt-4">
        {/* Cancel Button */}
        <button
          type="button"
          disabled={!hasContent || isTranslating}
          onClick={handleCancel}
          title="Cancel / 取消"
          className={`flex h-16 w-16 items-center justify-center rounded-full border transition-all duration-300 active:scale-90 ${
            hasContent && !isTranslating
              ? 'border-rose-500/40 bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 shadow-lg shadow-rose-950/50'
              : 'border-slate-800 bg-slate-900/30 text-slate-700 opacity-20 cursor-not-allowed'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Center Mic Button */}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-2xl transition-all duration-200 touch-none active:scale-95 ${
            isRecording
              ? 'border-rose-500 bg-rose-600 text-white animate-pulse shadow-rose-500/50 scale-105'
              : role === 'id'
              ? 'border-emerald-500/40 bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/30'
              : 'border-cyan-500/40 bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-500/30'
          }`}
        >
          {isRecording ? (
            /* Stop Square Icon */
            <svg className="w-8 h-8 pointer-events-none fill-current" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            /* Microphone Icon */
            <svg className="w-9 h-9 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
            </svg>
          )}
        </button>

        {/* Send Confirm Button */}
        <button
          type="button"
          disabled={!hasContent || isTranslating}
          onClick={handleSendAndTranslate}
          title="Send / 发送"
          className={`flex h-16 w-16 items-center justify-center rounded-full border transition-all duration-300 active:scale-90 ${
            hasContent && !isTranslating
              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 shadow-lg shadow-emerald-950/50'
              : 'border-slate-800 bg-slate-900/30 text-slate-700 opacity-20 cursor-not-allowed'
          }`}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
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