'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Check, Loader2 } from 'lucide-react';

interface Props {
  onRecorded?: (dataUrl: string, duration: number) => void;
  existingUrl?: string;
  existingDuration?: number;
  onClear?: () => void;
}

export default function VoiceRecorder({ onRecorded, existingUrl, existingDuration, onClear }: Props) {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(existingDuration || 0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingUrl || null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (existingUrl) setAudioUrl(existingUrl);
    if (existingDuration) setDuration(existingDuration);
  }, [existingUrl, existingDuration]);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (onRecorded) onRecorded(reader.result as string, duration);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };
      chunksRef.current = [];
      mr.start();
      mediaRecorderRef.current = mr;
      startTimeRef.current = Date.now();
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
      setRecording(true);
    } catch (e: any) {
      setError('دسترسی به میکروفون امکان‌پذیر نیست. لطفاً مجوز را در مرورگر فعال کنید.');
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const clear = () => {
    setAudioUrl(null);
    setDuration(0);
    if (onClear) onClear();
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setPlaying(true);
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
      <div className="flex items-center gap-3">
        {recording ? (
          <button onClick={stop} className="btn btn-danger !px-4">
            <Square size={16} className="fill-current" />
            <span>توقف ({formatTime(duration)})</span>
          </button>
        ) : audioUrl ? (
          <>
            <button onClick={togglePlay} className="btn btn-secondary !p-2">
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} className="flex-1 h-8" controls />
            <button onClick={clear} className="btn btn-ghost !p-2 text-[var(--danger)]" title="حذف"><Trash2 size={14} /></button>
          </>
        ) : (
          <button onClick={start} className="btn btn-primary !px-4">
            <Mic size={16} />
            <span>ضبط گزارش صوتی</span>
          </button>
        )}
        {recording && (
          <div className="flex items-center gap-2 text-[var(--danger)]">
            <div className="w-2 h-2 rounded-full bg-[var(--danger)] animate-pulse" />
            <span className="text-sm font-mono">{formatTime(duration)}</span>
          </div>
        )}
      </div>
      {error && <div className="mt-2 text-xs text-[var(--danger)]">{error}</div>}
      {audioUrl && !recording && (
        <div className="mt-2 text-xs text-[var(--success)] flex items-center gap-1">
          <Check size={12} /> گزارش صوتی ضبط شد ({formatTime(duration)})
        </div>
      )}
    </div>
  );
}
