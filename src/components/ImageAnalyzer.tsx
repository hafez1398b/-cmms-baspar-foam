'use client';
import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Camera, X, Loader2, AlertCircle, Lightbulb, Wrench, ShieldAlert } from 'lucide-react';

export interface AIImageAnalysis {
  cause: string;
  solution: string;
  prevention: string;
  confidence: number;
  imagePreview?: string;
}

interface Props {
  onAnalyzed: (analysis: AIImageAnalysis) => void;
  existingAnalyses?: AIImageAnalysis[];
  onRemove?: (idx: number) => void;
  title?: string;
  compact?: boolean;
}

// Mock AI analysis (در نسخه نهایی به GPT-4o Vision متصل می‌شود)
function mockAnalyzeImage(file: File): Promise<{ cause: string; solution: string; prevention: string; confidence: number }> {
  return new Promise(resolve => {
    setTimeout(() => {
      const name = file.name.toLowerCase();
      let cause = 'سایش و فرسودگی طبیعی قطعه در اثر کارکرد طولانی مدت';
      let solution = '۱. تعویض قطعه فرسوده با قطعه اصلی\n۲. بررسی اتصالات و بلبرینگ‌های اطراف\n۳. تست عملکرد پس از تعمیر\n۴. کالیبراسیون مجدد در صورت نیاز';
      let prevention = '• روغن‌کاری منظم طبق برنامه PM\n• بازرسی بصری روزانه\n• ثبت دما و لرزش به صورت دوره‌ای\n• تعویض قطعه قبل از رسیدن به پایان عمر مفید';

      if (name.includes('belt') || name.includes('تسمه')) {
        cause = 'ترک‌خوردگی و شل شدن تسمه در اثر کشش نامناسب';
        solution = '۱. تعویض تسمه با مدل اصلی\n۲. تنظیم کشش تسمه طبق استاندارد سازنده\n۳. بررسی هم‌راستایی پولی‌ها';
      } else if (name.includes('bearing') || name.includes('بلبرینگ')) {
        cause = 'خرابی بلبرینگ در اثر عدم روغن‌کاری یا ورود گرد و غبار';
        solution = '۱. تعویض بلبرینگ\n۲. تمیز کردن محل نصب\n۳. استفاده از کاسه نمد مناسب\n۴. روغن‌کاری با گریس استاندارد';
      } else if (name.includes('leak') || name.includes('نشت')) {
        cause = 'نشتی روغن از کاسه نمد یا اتصالات هیدرولیکی';
        solution = '۱. تعویض کاسه نمد یا واشر\n۲. سفت کردن اتصالات\n۳. بررسی فشار سیستم هیدرولیک';
      }

      resolve({
        cause,
        solution,
        prevention,
        confidence: 78 + Math.floor(Math.random() * 17),
      });
    }, 2200);
  });
}

export default function ImageAnalyzer({ onAnalyzed, existingAnalyses = [], onRemove, title = 'تحلیل تصویر با هوش مصنوعی', compact = false }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setAnalyzing(true);
      try {
        const result = await mockAnalyzeImage(file);
        onAnalyzed({ ...result, imagePreview: dataUrl });
        setPreview(null);
      } catch {
        // ignore
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className={`space-y-3 ${compact ? '' : 'p-4 rounded-lg border border-[var(--gold)]/30 bg-[rgba(212,165,85,0.05)]'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--gold)]" />
          <span className="font-bold text-sm">{title}</span>
        </div>
        <input type="file" ref={fileRef} className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
        <button
          className="btn btn-primary !text-xs !py-1.5 !px-3"
          onClick={() => fileRef.current?.click()}
          disabled={analyzing}
        >
          {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          {analyzing ? 'در حال تحلیل...' : 'عکس تجهیز'}
        </button>
      </div>

      <p className="text-xs text-[var(--foreground-muted)]">
        عکس تجهیز یا قطعه معیوب را آپلود کنید. AI مشابه Google Lens تصویر را تحلیل کرده و علت خرابی، راه‌حل و اقدامات پیشگیرانه را پیشنهاد می‌دهد.
      </p>

      {preview && (
        <div className="relative rounded-lg overflow-hidden max-w-[200px]">
          <img src={preview} alt="preview" className="w-full" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 size={32} className="text-[var(--gold)] animate-spin" />
          </div>
        </div>
      )}

      {existingAnalyses.map((a, idx) => (
        <div key={idx} className="p-3 rounded-lg bg-[var(--background-card)] border border-[var(--border)]">
          <div className="flex items-start gap-3">
            {a.imagePreview && (
              <img src={a.imagePreview} alt="" className="w-16 h-16 rounded object-cover shrink-0 border border-[var(--border)]" />
            )}
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="badge badge-gold">اطمینان AI: {a.confidence}٪</span>
                {onRemove && (
                  <button className="btn btn-ghost !p-1 text-[var(--danger)]" onClick={() => onRemove(idx)}><X size={12} /></button>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1 text-[var(--danger)] font-bold text-xs mb-1">
                  <AlertCircle size={12} /> علت احتمالی خرابی:
                </div>
                <p className="text-xs leading-relaxed">{a.cause}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[var(--success)] font-bold text-xs mb-1">
                  <Wrench size={12} /> دستورالعمل تعمیر:
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{a.solution}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[var(--info)] font-bold text-xs mb-1">
                  <ShieldAlert size={12} /> اقدامات پیشگیرانه:
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{a.prevention}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {existingAnalyses.length === 0 && !analyzing && !preview && (
        <div className="text-center py-4 text-[var(--foreground-muted)] text-xs border border-dashed border-[var(--border)] rounded-lg">
          <Camera size={24} className="mx-auto mb-2 opacity-30" />
          هنوز تصویری برای تحلیل آپلود نشده است.
        </div>
      )}
    </div>
  );
}
