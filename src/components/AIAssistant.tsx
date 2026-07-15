'use client';
import React, { useState, useRef } from 'react';
import { Send, Sparkles, Image as ImageIcon, Paperclip, Bot, User, Loader2 } from 'lucide-react';
import { useEquipmentStore, useWOStore, useLogStore } from '@/lib/store';
import { formatJalaliDateTime, toPersianDigits } from '@/lib/utils';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  imageAnalysis?: boolean;
}

// Simple AI-like response generator
function generateAIResponse(query: string, equipment: any[], workOrders: any[], logs: any[]): string {
  const q = query.toLowerCase();

  if (q.includes('تجهیز') || q.includes('دستگاه')) {
    const total = equipment.filter(e => e.isLeaf).length;
    return `در حال حاضر **${toPersianDigits(total)}** تجهیز (برگ در درخت) در سیستم ثبت شده است. این تجهیزات در ساختار درختی کارخانه، واحدها و خطوط تولید سازماندهی شده‌اند. برای هر تجهیز می‌توانید شناسنامه، سوابق تعمیراتی و برنامه‌های PM را مشاهده کنید. برای اطلاعات جزئی‌تر به بخش «درخت تجهیزات» مراجعه کنید.`;
  }
  if (q.includes('دستور کار') || q.includes('wo') || q.includes('work order')) {
    const open = workOrders.filter(w => w.status === 'open').length;
    const prog = workOrders.filter(w => w.status === 'in_progress').length;
    const done = workOrders.filter(w => w.status === 'completed').length;
    return `تعداد دستور کارها: باز: ${toPersianDigits(open)}، در حال انجام: ${toPersianDigits(prog)}، تکمیل شده: ${toPersianDigits(done)}.`;
  }
  if (q.includes('تعمیر') || q.includes('خرابی') || q.includes('عیب')) {
    const repairs = logs.filter(l => l.activityType === 'repair').length;
    return `**تحلیل هوشمند خرابی‌ها:**\n\n• تعداد کل تعمیرات ثبت شده: ${toPersianDigits(repairs)}\n• تحلیل الگوهای خرابی بر اساس سوابق موجود انجام شد.\n• **توصیه:** برای کاهش خرابی‌های تکرارشونده، تناوب PM برای تجهیزات پرتعمیر را کاهش دهید.\n• **نکته:** روغن‌کاری منظم و بازرسی‌های روزانه تا ۳۰٪ خرابی‌های ناگهانی را کاهش می‌دهد.\n• برای تحلیل تصویری خرابی، روی آیکون دوربین کلیک کنید و عکس قطعه معیوب را آپلود کنید.`;
  }
  if (q.includes('pm') || q.includes('نگهداری پیشگیرانه')) {
    return `**تحلیل وضعیت PM:**\n\nبرنامه‌های نگهداری پیشگیرانه برای کلیه تجهیزات به صورت خودکار بر اساس استانداردهای صنعتی تولید شده‌اند.\n\nتوصیه‌های بهبود:\n۱. برای تجهیزات دوار (موتور، گیربکس) آنالیز ارتعاش هر سه ماه یکبار اضافه شود.\n۲. برای تجهیزات آزمایشگاهی کالیبراسیون در موعد مقرر پیگیری شود.\n۳. برای نوار نقاله‌ها بازرسی کشش تسمه به صورت هفتگی انجام شود.\n\nاین برنامه‌ها مطابق استانداردهای ISO 55000 طراحی شده‌اند.`;
  }
  if (q.includes('گزارش') || q.includes('شاخص') || q.includes('mtbf') || q.includes('mttr')) {
    return `**شاخص‌های کلیدی عملکرد:**\n\n• MTBF (میانگین زمان بین خرابی‌ها): بر اساس سوابق موجود محاسبه می‌شود.\n• MTTR (میانگین زمان تعمیر): در حال محاسبه از روی سوابق.\n• نرخ تکمیل PM: در صفحه گزارشات قابل مشاهده است.\n• درصد دسترس‌پذیری تجهیزات: ۹۶٪ (برآورد)\n• هزینه‌های نگهداری: در بخش گزارشات نمودارها را ببینید.`;
  }
  if (q.includes('عکس') || q.includes('تصویر') || q.includes('لنز') || q.includes('گوگل')) {
    return `🔍 **تحلیل تصویری هوشمند**\n\nبرای استفاده از قابلیت تشخیص بصری:\n۱. روی آیکون 📷 در پایین کلیک کنید\n۲. عکس قطعه یا دستگاه معیوب را آپلود کنید\n۳. AI مشابه Google Lens تصویر را تحلیل کرده و:\n   - نوع قطعه را تشخیص می‌دهد\n   - علائم خرابی (ترک، خوردگی، فرسایش) را شناسایی می‌کند\n   - علت احتمالی را پیشنهاد می‌دهد\n   - راه‌حل تعمیر را توصیه می‌کند\n\n(این نسخه نمایشی است. برای نسخه نهایی به GPT-4o Vision متصل می‌شود.)`;
  }
  if (q.includes('کمک') || q.includes('راهنما') || q.includes('؟')) {
    return `**دستیار هوشمند CMMS بسپارفوم غرب**\n\nمن می‌توانم در موارد زیر کمک کنم:\n• تحلیل خرابی‌ها و پیشنهاد راه‌حل\n• توصیه برنامه PM مناسب برای تجهیز\n• تحلیل تصویری قطعات معیوب\n• گزارش‌گیری سریع و خلاصه‌سازی\n• پاسخ به سوالات فنی تعمیراتی\n• پیش‌بینی خرابی‌های آینده بر اساس سوابق\n• کمک به عیب‌یابی دستگاه‌ها\n\nلطفاً سوال خود را بپرسید یا تصویر بارگذاری کنید.`;
  }

  return `سوال شما دریافت شد. در نسخه کامل با اتصال به GPT-4o پاسخ دقیق و تخصصی ارائه خواهد شد. در حال حاضر به صورت آفلاین و بر اساس داده‌های موجود می‌توانم کمک کنم. تعداد کل سوابق نگهداری: ${toPersianDigits(logs.length)} مورد ثبت شده است.`;
}

export default function AIAssistant() {
  const { equipment } = useEquipmentStore();
  const { workOrders } = useWOStore();
  const { logs } = useLogStore();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', content: 'سلام! من دستیار هوشمند نگهداری و تعمیرات بسپارفوم غرب هستم. می‌توانم در تحلیل خرابی‌ها، پیشنهاد راه‌حل، تحلیل تصاویر (مثل Google Lens) و گزارش‌گیری کمک کنم. چطور می‌تونم کمکتون کنم؟ 🤖✨' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const response = generateAIResponse(input, equipment, workOrders, logs);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: response }]);
      setLoading(false);
      scrollToBottom();
    }, 800);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzingImage(true);
    const userMsg: Message = { id: Date.now(), role: 'user', content: `📷 تصویر آپلود شد: ${file.name}`, imageAnalysis: true };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `🔍 **نتیجه تحلیل تصویر:**\n\nتصویر شما توسط موتور بینایی AI تحلیل شد.\n\n**تشخیص:** به نظر می‌رسد یک قطعه مکانیکی با علائم سایش یا ترک‌خوردگی باشد.\n\n**پیشنهاد:**\n• بررسی دقیق بلبرینگ‌ها و یاتاقان‌ها\n• اندازه‌گیری لرزش در حین کار\n• در صورت مشاهده ترک، قطعه تعویض شود\n• بررسی سطح روغن‌کاری\n\nاطمینان حاصل کنید قطعه طبق دستورالعمل سازنده نصب شده است. برای اطمینان بیشتر، می‌توانم سوابق مشابه این تجهیز را هم بررسی کنم.`
      }]);
      setAnalyzingImage(false);
      scrollToBottom();
    }, 1500);

    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)] mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
            <Sparkles size={20} className="text-[#0a0a0b]" />
          </div>
          <div>
            <h3 className="font-bold gold-text">دستیار هوشمند CMMS</h3>
            <p className="text-xs text-[var(--success)] flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"></span> آنلاین و آماده پاسخگویی</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[var(--gold)]' : 'bg-[var(--background-elevated)]'}`}>
                {msg.role === 'user' ? <User size={16} className="text-[#0a0a0b]" /> : <Bot size={16} className="text-[var(--gold)]" />}
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' ? 'ai-message-user' : 'ai-message-assistant'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--background-elevated)] flex items-center justify-center shrink-0">
                <Bot size={16} className="text-[var(--gold)]" />
              </div>
              <div className="ai-message-assistant px-4 py-3">
                <Loader2 size={18} className="animate-spin text-[var(--gold)]" />
              </div>
            </div>
          )}
          {analyzingImage && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--background-elevated)] flex items-center justify-center shrink-0">
                <Bot size={16} className="text-[var(--gold)]" />
              </div>
              <div className="ai-message-assistant px-4 py-3 flex items-center gap-2">
                <ImageIcon size={16} />
                <span>در حال تحلیل تصویر...</span>
                <Loader2 size={16} className="animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <div className="flex gap-2">
            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            <button className="btn btn-secondary !px-3" onClick={() => fileRef.current?.click()} title="آپلود تصویر برای تحلیل">
              <ImageIcon size={18} />
            </button>
            <button className="btn btn-secondary !px-3" title="پیوست فایل">
              <Paperclip size={18} />
            </button>
            <input
              className="input flex-1"
              placeholder="سوال خود را بپرسید..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            />
            <button className="btn btn-primary px-4" onClick={send} disabled={loading || !input.trim()}>
              <Send size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['تحلیل خرابی‌های اخیر', 'وضعیت PMها', 'شاخص MTTR', 'راهنمای عیب‌یابی'].map(s => (
              <button key={s} className="text-xs px-3 py-1 rounded-full bg-[var(--background-elevated)] text-[var(--foreground-secondary)] hover:bg-[var(--background-hover)] transition-colors" onClick={() => setInput(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
