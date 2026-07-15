'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { WorkOrder } from '@/lib/store';
import { useEquipmentStore, usePersonnelStore, useUIStore, useTechnicalPersonnelStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth';
import { Check, X, ChevronLeft, ChevronRight, Camera, Mic, Sparkles, FileText, Clock, User as UserIcon, Wrench, Calendar, Image as ImageIcon, Send, Save } from 'lucide-react';
import { formatJalali, generateId, priorityMap, workOrderStatusMap } from '@/lib/utils';
import VoiceRecorder from './VoiceRecorder';
import ImageAnalyzer, { type AIImageAnalysis } from './ImageAnalyzer';
import JalaliDateTimePicker from './JalaliDateTimePicker';

interface Props {
  initial?: Partial<WorkOrder>;
  existingId?: number;
  onClose: () => void;
  onSave: (wo: WorkOrder) => void;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS = [
  { n: 1, label: 'اطلاعات پایه', icon: FileText },
  { n: 2, label: 'زمان‌بندی', icon: Clock },
  { n: 3, label: 'تصاویر و AI', icon: Camera },
  { n: 4, label: 'گزارش کار', icon: Mic },
  { n: 5, label: 'دستیار PM', icon: Sparkles },
  { n: 6, label: 'تایید و ارسال', icon: Send },
];

export default function WOWizard({ initial, existingId, onClose, onSave }: Props) {
  const { equipment } = useEquipmentStore();
  const { personnel } = usePersonnelStore();
  const { technicalPersonnel } = useTechnicalPersonnelStore();
  const { users: authUsers } = useAuthStore();
  const { showNotification } = useUIStore();
  const [aiPMSuggestion, setAiPMSuggestion] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Build personnel list: ALL technical personnel + system users
  const allPersonnel = useMemo(() => {
    const list: Array<{ id: number; fullName: string; jobTitle?: string; avatarColor?: string; shift?: string; phone?: string; department?: string }> = [];
    const addedIds = new Set<number>();

    // 1. ALL technical personnel
    technicalPersonnel.forEach((tp, idx) => {
      const uniqueId = tp.accountId || (50000 + tp.id);
      if (!addedIds.has(uniqueId)) {
        list.push({
          id: uniqueId,
          fullName: `${tp.firstName} ${tp.lastName}`,
          jobTitle: `${tp.contractType || 'پرسنل فنی'} - NET: ${tp.codeNET}`,
          avatarColor: ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#D4A555','#ef4444','#14b8a6','#f97316'][idx % 10],
          phone: tp.mobile,
          department: tp.placeOfBirth,
        });
        addedIds.add(uniqueId);
      }
    });

    // 2. System users not already in list
    authUsers.forEach(u => {
      if (!addedIds.has(u.id)) {
        list.push({
          id: u.id,
          fullName: u.fullName,
          jobTitle: u.role === 'admin' ? 'مدیر کل' : u.role === 'manager' ? 'مدیر فنی' : u.role === 'technician' ? 'تکنسین' : 'کاربر',
          avatarColor: u.avatarColor || '#3b82f6',
          department: u.department,
        });
        addedIds.add(u.id);
      }
    });

    return list;
  }, [authUsers, technicalPersonnel]);
  const [step, setStep] = useState<Step>(1);

  const [form, setForm] = useState<WorkOrder>(() => ({
    id: existingId || Date.now(),
    woNumber: initial?.woNumber || generateId('WO'),
    title: initial?.title || '',
    description: initial?.description || '',
    type: initial?.type || 'corrective',
    priority: initial?.priority || 'medium',
    status: initial?.status || 'open',
    equipmentId: initial?.equipmentId,
    assignedTo: initial?.assignedTo,
    requesterName: initial?.requesterName || '',
    failureType: initial?.failureType || '',
    sourceRequestId: initial?.sourceRequestId,
    scheduledDate: initial?.scheduledDate || new Date().toISOString().split('T')[0],
    dueDate: initial?.dueDate || '',
    receivedAt: initial?.receivedAt || '',
    startedAt: initial?.startedAt || '',
    completedAt: initial?.completedAt || '',
    estimatedHours: initial?.estimatedHours || 0,
    beforeImages: initial?.beforeImages || [],
    afterImages: initial?.afterImages || [],
    aiImageAnalysis: initial?.aiImageAnalysis || [],
    technicianReport: initial?.technicianReport || '',
    voiceReport: initial?.voiceReport || '',
    voiceReportDuration: initial?.voiceReportDuration || 0,
    rootCause: initial?.rootCause || '',
    solution: initial?.solution || '',
    managerFeedback: initial?.managerFeedback || '',
    createdAt: initial?.createdAt || new Date().toISOString(),
  } as WorkOrder));

  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);

  // Auto-set receivedAt on open if not set
  useEffect(() => {
    if (!form.receivedAt && existingId) {
      setForm(f => ({ ...f, receivedAt: new Date().toISOString() }));
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setForm(f => ({
        ...f,
        [type === 'before' ? 'beforeImages' : 'afterImages']: [...(type === 'before' ? f.beforeImages || [] : f.afterImages || []), dataUrl],
      }));
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const removeImage = (type: 'before' | 'after', idx: number) => {
    setForm(f => ({
      ...f,
      [type === 'before' ? 'beforeImages' : 'afterImages']: (type === 'before' ? f.beforeImages || [] : f.afterImages || []).filter((_, i) => i !== idx),
    }));
  };

  const handleAIAnalysis = (analysis: AIImageAnalysis) => {
    setForm(f => ({
      ...f,
      aiImageAnalysis: [...(f.aiImageAnalysis || []), analysis],
      // Auto-fill root cause from first analysis if empty
      rootCause: f.rootCause || analysis.cause,
      solution: f.solution || analysis.solution,
    }));
    showNotification('success', 'تحلیل هوش مصنوعی اضافه شد.');
  };

  const removeAnalysis = (idx: number) => {
    setForm(f => ({ ...f, aiImageAnalysis: (f.aiImageAnalysis || []).filter((_, i) => i !== idx) }));
  };

  const handleVoice = (dataUrl: string, duration: number) => {
    setForm(f => ({ ...f, voiceReport: dataUrl, voiceReportDuration: duration }));
  };

  const clearVoice = () => {
    setForm(f => ({ ...f, voiceReport: '', voiceReportDuration: 0 }));
  };

  const validateStep = (s: Step): string | null => {
    if (s === 1) {
      if (!form.title.trim()) return 'عنوان دستور کار الزامی است';
      if (!form.equipmentId) return 'انتخاب تجهیز الزامی است';
    }
    if (s === 2) {
      if (!form.scheduledDate) return 'تاریخ برنامه الزامی است';
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) { showNotification('error', err); return; }
    if (step < 6) setStep((step + 1) as Step);
  };

  const prevStep = () => { if (step > 1) setStep((step - 1) as Step); };

  // AI PM suggestion generator
  const generateAIPMSuggestion = () => {
    const eq = equipment.find(e => e.id === form.equipmentId);
    if (!eq) { showNotification('error', 'ابتدا تجهیز را انتخاب کنید.'); return; }
    setAiLoading(true);
    setTimeout(() => {
      const name = eq.name.toLowerCase();
      let suggestion = '';

      if (name.includes('کانوایر') || name.includes('نوار نقاله') || name.includes('کلاوم')) {
        suggestion = `## برنامه PM پیشنهادی برای ${eq.name} (${eq.model || '-'})\n### بر اساس ISO 55000 و استانداردهای سازنده\n\n**روزانه:**\n• بازرسی بصری نوار نقاله و غلتک‌ها\n• کنترل صدای غیرعادی و لرزش\n• بررسی هم‌راستایی نوار\n\n**هفتگی:**\n• روغن‌کاری یاتاقان‌ها و نقاط متحرک\n• تنظیم کشش نوار نقاله\n• بررسی سایش غلتک‌ها\n\n**ماهانه:**\n• بازرسی گیربکس و سطح روغن\n• کنترل اتصالات الکتریکی موتور\n• بررسی وضعیت تسمه‌ها\n• تمیزکاری سنسورها\n\n**فصلی (۳ ماهه):**\n• تعویض روغن گیربکس\n• آنالیز ارتعاش موتور\n• بازرسی کامل الکتروموتور\n• تست سیستم ایمنی و اضطراری\n\n**سالانه:**\n• بازرسی کامل و اورهال\n• تعویض نوار نقاله در صورت نیاز\n• تعویض تمام یاتاقان‌ها\n• کالیبراسیون سنسورها\n\n**قطعات مصرفی:** یاتاقان، تسمه، روغن گیربکس، گریس\n**ابزار مورد نیاز:** آچار بکس، گریس‌پمپ، ارتعاش‌سنج، حرارت‌سنج`;
      } else if (name.includes('کمپرسور') || name.includes('compressor')) {
        suggestion = `## برنامه PM پیشنهادی برای ${eq.name}\n### بر اساس ISO 55000 و دستورالعمل سازنده\n\n**روزانه:**\n• کنترل فشار خروجی\n• بررسی دمای کمپرسور\n• تخلیه آب مخزن\n• کنترل نشتی هوا\n\n**هفتگی:**\n• تمیزکاری فیلتر هوا\n• بررسی سطح روغن\n• کنترل تسمه‌ها\n\n**ماهانه:**\n• تعویض فیلتر روغن\n• بررسی شیر اطمینان\n• کنترل سیستم خنک‌کننده\n\n**فصلی:**\n• تعویض روغن کمپرسور\n• بازرسی پیستون و سیلندر\n• تست فشار مخزن\n\n**سالانه:**\n• اورهال کامل\n• تعویض تسمه و واشرها\n• تست هیدرواستاتیک مخزن\n• کالیبراسیون فشارسنج‌ها`;
      } else if (name.includes('لیفتراک') || name.includes('forklift')) {
        suggestion = `## برنامه PM پیشنهادی برای ${eq.name}\n### بر اساس ISO 3691 و چک‌لیست سازنده\n\n**روزانه (چک‌لیست اپراتور):**\n• بازدید روغن موتور، گیربکس، هیدرولیک\n• بررسی باد لاستیک‌ها (${eq.model || '-'})\n• کنترل ترمزها و فرمان\n• بررسی چراغ‌ها، بوق و آینه‌ها\n• کنترل شاخک‌ها و زنجیرها\n\n**هفتگی:**\n• بادگیری فیلتر هوا\n• روغن‌کاری نقاط گریس‌خور\n\n**هر ۱۲۰ ساعت:**\n• تعویض روغن موتور + فیلتر\n\n**هر ۶۰۰ ساعت:**\n• تعویض فیلتر گیربکس\n\n**هر ۱۰۰۰ ساعت:**\n• تعویض روغن گیربکس\n• تعویض شمع و وایر\n\n**سالانه:**\n• بازرسی کامل موتور\n• تست باربری\n• تست ایمنی کامل`;
      } else if (name.includes('دیگ') || name.includes('بویلر') || name.includes('boiler')) {
        suggestion = `## برنامه PM پیشنهادی برای ${eq.name}\n### بر اساس ASME BPVC و استاندارد ملی\n\n**روزانه:**\n• کنترل سطح آب و فشار\n• بررسی عملکرد مشعل\n• تست شیر اطمینان\n• کنترل چشمی UV\n\n**هفتگی:**\n• بازرسی سیستم تغذیه آب\n• کنترل پمپ‌ها\n• بررسی فشارسنج‌ها\n\n**ماهانه:**\n• تعویض فیلتر سوخت\n• شستشوی استرینر\n• بررسی عایق‌بندی\n\n**فصلی:**\n• تمیزکاری لوله‌ها و مبدل‌ها\n• بازرسی عایق‌ها\n• تست سیستم ایمنی کامل\n\n**سالانه:**\n• بازرسی داخلی دیگ\n• تست هیدرواستاتیک\n• بازرسی فنی توسط سازمان استاندارد`;
      } else if (name.includes('ربات') || name.includes('تزریق') || name.includes('robot')) {
        suggestion = `## برنامه PM پیشنهادی برای ${eq.name}\n### بر اساس دستورالعمل FANUC/GM و ISO 55000\n\n**روزانه:**\n• کنترل شیلنگ‌های تزریق و هیدرولیک\n• بررسی نشتی مواد\n• نظافت نازل‌ها\n• کنترل سنسورها\n\n**هفتگی:**\n• روغن‌کاری نقاط متحرک\n• بررسی وایرینگ‌ها\n• کنترل فشار هیدرولیک\n\n**ماهانه:**\n• تعویض فیلتر روغن هیدرولیک\n• بادگیری تابلو برق\n• کنترل سروموتورها\n\n**فصلی:**\n• گریس‌کاری کامل مفاصل\n• بازرسی کابل‌ها و کانکتورها\n• کالیبراسیون سنسورها\n\n**سالانه:**\n• اورهال هیدرولیک\n• بازرسی کامل سیستم کنترل\n• تست دقت تزریق`;
      } else if (name.includes('چیلر') || name.includes('chiller')) {
        suggestion = `## برنامه PM پیشنهادی برای ${eq.name}\n### بر اساس ASHRAE و ISO 55000\n\n**روزانه:**\n• کنترل دمای ورودی/خروجی\n• بررسی فشار گاز\n• کنترل جریان آب\n• بررسی عملکرد فن‌ها\n\n**ماهانه:**\n• تمیزکاری کندانسور\n• بررسی شارژ گاز\n• کنترل روغن کمپرسور\n\n**فصلی:**\n• اسیدشویی مبدل‌ها\n• تعویض فیلترها\n• بازرسی ترموستات\n\n**سالانه:**\n• بازرسی کامل کمپرسور\n• تعویض روغن\n• تست نشتی گاز`;
      } else {
        suggestion = `## برنامه PM پیشنهادی برای ${eq.name} (${eq.model || '-'})\n### بر اساس ISO 55000\n\n**روزانه:**\n• بازرسی بصری تجهیز\n• کنترل صدا و لرزش غیرعادی\n• بررسی دما و فشار عملکرد\n\n**هفتگی:**\n• تمیزکاری تجهیز\n• روغن‌کاری نقاط متحرک\n• بررسی اتصالات\n\n**ماهانه:**\n• تعویض فیلترها\n• بازرسی اتصالات الکتریکی\n• کنترل سنسورها\n\n**فصلی:**\n• تعویض روغن\n• بازرسی قطعات سایشی\n• تست عملکرد سیستم ایمنی\n\n**سالانه:**\n• اورهال کامل\n• تعویض قطعات فرسوده\n• کالیبراسیون\n\n**توجه:** این برنامه پیشنهادی عمومی است. برای برنامه دقیق‌تر، دفترچه راهنمای سازنده تجهیز (${eq.manufacturer || 'نامشخص'}) را مطالعه فرمایید.`;
      }

      setAiPMSuggestion(suggestion);
      setAiLoading(false);
    }, 1500);
  };

  const handleSave = (asCompleted: boolean = false) => {
    const err = validateStep(1);
    if (err) { showNotification('error', err); return; }
    const finalForm: WorkOrder = {
      ...form,
      status: asCompleted ? 'completed' : (form.status === 'open' ? 'in_progress' : form.status),
      completedAt: asCompleted ? new Date().toISOString() : form.completedAt,
    };
    onSave(finalForm);
  };

  const canSkip = (s: Step) => s === 3; // تصاویر اختیاری

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-stretch justify-center z-[100] p-0 md:p-4" onClick={onClose}>
      <div className="bg-[var(--background-card)] border border-[var(--border)] w-full h-full md:h-auto md:max-h-[98vh] md:max-w-[1400px] md:rounded-2xl flex flex-col overflow-hidden shadow-2xl fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] bg-gradient-to-l from-[rgba(212,165,85,0.1)] to-transparent flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold gold-text">فرم دستور کار - {form.woNumber}</h3>
            <p className="text-xs text-[var(--foreground-muted)]">لطفاً مراحل را به ترتیب تکمیل کنید</p>
          </div>
          <button className="btn btn-ghost !p-2" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <div className="flex items-center gap-1">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.n;
              const isDone = step > s.n;
              return (
                <React.Fragment key={s.n}>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      isActive ? 'bg-[var(--gold)] text-[#0a0a0b] font-bold' :
                      isDone ? 'bg-[rgba(34,197,94,0.15)] text-[var(--success)]' :
                      'bg-[var(--background-elevated)] text-[var(--foreground-muted)]'
                    }`}
                    onClick={() => {
                      // Allow jumping back to any previous step
                      if (s.n < step) setStep(s.n as Step);
                    }}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-[#0a0a0b] text-[var(--gold)]' : ''}`}>
                      {isDone ? <Check size={12} /> : s.n}
                    </div>
                    <Icon size={12} />
                    <span className="hidden md:inline">{s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${isDone ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4 fade-in">
              <h4 className="font-bold flex items-center gap-2"><FileText size={18} className="text-[var(--gold)]" /> اطلاعات پایه دستور کار</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">عنوان دستور کار *</label>
                  <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثلاً: تعویض بلبرینگ کانوایر CV09-24001" />
                </div>
                <div>
                  <label className="label">نوع</label>
                  <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="corrective">اصلاحی</option>
                    <option value="preventive">پیشگیرانه (PM)</option>
                    <option value="predictive">پیش‌بینانه</option>
                    <option value="emergency">اضطراری</option>
                  </select>
                </div>
                <div>
                  <label className="label">اولویت</label>
                  <select className="select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {Object.entries(priorityMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">تجهیز *</label>
                  <select className="select" value={form.equipmentId || ''} onChange={e => setForm({ ...form, equipmentId: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">-- انتخاب --</option>
                    {equipment.filter(e => e.isLeaf).map(e => <option key={e.id} value={e.id}>{e.name} {e.model ? `(${e.model})` : ''} {e.feCode ? `[${e.feCode}]` : ''}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label flex items-center gap-1"><UserIcon size={12} /> تخصیص به تکنسین (فرد فنی)</label>
                  <TechnicianSelector
                    value={form.assignedTo}
                    onChange={(id) => setForm({ ...form, assignedTo: id })}
                    personnel={allPersonnel}
                  />
                </div>
                <div>
                  <label className="label">نام درخواست‌کننده</label>
                  <input className="input" value={form.requesterName || ''} onChange={e => setForm({ ...form, requesterName: e.target.value })} />
                </div>
                <div>
                  <label className="label">نوع خرابی</label>
                  <input className="input" value={form.failureType || ''} onChange={e => setForm({ ...form, failureType: e.target.value })} placeholder="مکانیکی / الکتریکی / ..." />
                </div>
                <div className="md:col-span-2">
                  <label className="label">شرح مشکل / توضیحات</label>
                  <textarea className="textarea" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 fade-in">
              <h4 className="font-bold flex items-center gap-2"><Clock size={18} className="text-[var(--gold)]" /> زمان‌بندی دستور کار (تاریخ شمسی)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
                  <label className="label flex items-center gap-1"><Calendar size={12} /> تاریخ برنامه *</label>
                  <JalaliDateTimePicker
                    value={form.scheduledDate || ''}
                    onChange={iso => setForm({ ...form, scheduledDate: iso.split('T')[0] })}
                    showTime={false}
                  />
                </div>
                <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
                  <label className="label flex items-center gap-1"><Calendar size={12} /> موعد انجام</label>
                  <JalaliDateTimePicker
                    value={form.dueDate || ''}
                    onChange={iso => setForm({ ...form, dueDate: iso.split('T')[0] })}
                    showTime={false}
                  />
                </div>
                <div className="p-4 rounded-lg border border-[var(--gold)]/30 bg-[rgba(212,165,85,0.05)] md:col-span-2">
                  <label className="label flex items-center gap-1"><Calendar size={12} /> تاریخ و ساعت دریافت دستور کار توسط تکنسین</label>
                  <JalaliDateTimePicker
                    value={form.receivedAt || ''}
                    onChange={iso => setForm({ ...form, receivedAt: iso })}
                  />
                  {form.receivedAt && <div className="text-xs text-[var(--foreground-muted)] mt-2">ثبت شده: {formatJalali(form.receivedAt, 'yyyy/MM/dd HH:mm')}</div>}
                </div>
                <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
                  <label className="label flex items-center gap-1"><Clock size={12} /> تاریخ و ساعت شروع کار</label>
                  <JalaliDateTimePicker
                    value={form.startedAt || ''}
                    onChange={iso => setForm({ ...form, startedAt: iso })}
                  />
                </div>
                <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
                  <label className="label flex items-center gap-1"><Check size={12} /> تاریخ و ساعت پایان کار</label>
                  <JalaliDateTimePicker
                    value={form.completedAt || ''}
                    onChange={iso => setForm({ ...form, completedAt: iso })}
                  />
                </div>
                <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] md:col-span-2">
                  <label className="label">ساعت تخمینی کار</label>
                  <input type="number" step="0.5" className="input !w-40" value={form.estimatedHours || 0} onChange={e => setForm({ ...form, estimatedHours: Number(e.target.value) })} />
                  <span className="text-xs text-[var(--foreground-muted)] mr-2">ساعت</span>
                </div>
              </div>
              <div className="p-3 bg-[var(--background-secondary)] rounded-lg text-xs text-[var(--foreground-muted)]">
                <strong>نکته:</strong> زمان دریافت، شروع و پایان برای محاسبه MTTR و ارزیابی عملکرد ضروری است. همه تاریخ‌ها به صورت شمسی انتخاب می‌شوند.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 fade-in">
              <h4 className="font-bold flex items-center gap-2"><Camera size={18} className="text-[var(--gold)]" /> تصاویر قبل/بعد از تعمیر و تحلیل هوش مصنوعی</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before images */}
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-sm flex items-center gap-1"><Camera size={14} /> عکس‌های قبل از تعمیر</h5>
                    <button className="btn btn-secondary !text-xs !py-1 !px-2" onClick={() => beforeFileRef.current?.click()}>+ افزودن عکس</button>
                  </div>
                  <input type="file" ref={beforeFileRef} className="hidden" accept="image/*" capture="environment" onChange={e => handleImageUpload(e, 'before')} />
                  <div className="grid grid-cols-3 gap-2">
                    {(form.beforeImages || []).map((img, idx) => (
                      <div key={idx} className="relative rounded overflow-hidden border border-[var(--border)]">
                        <img src={img} alt="" className="w-full h-20 object-cover" />
                        <button className="absolute top-0.5 left-0.5 bg-black/60 text-white rounded-full p-0.5" onClick={() => removeImage('before', idx)}><X size={10} /></button>
                      </div>
                    ))}
                    {(form.beforeImages || []).length === 0 && (
                      <div className="col-span-3 text-center py-4 text-xs text-[var(--foreground-muted)] border border-dashed border-[var(--border)] rounded">
                        هنوز عکسی اضافه نشده
                      </div>
                    )}
                  </div>
                </div>

                {/* After images */}
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-sm flex items-center gap-1"><Check size={14} className="text-[var(--success)]" /> عکس‌های بعد از تعمیر</h5>
                    <button className="btn btn-secondary !text-xs !py-1 !px-2" onClick={() => afterFileRef.current?.click()}>+ افزودن عکس</button>
                  </div>
                  <input type="file" ref={afterFileRef} className="hidden" accept="image/*" capture="environment" onChange={e => handleImageUpload(e, 'after')} />
                  <div className="grid grid-cols-3 gap-2">
                    {(form.afterImages || []).map((img, idx) => (
                      <div key={idx} className="relative rounded overflow-hidden border border-[var(--border)]">
                        <img src={img} alt="" className="w-full h-20 object-cover" />
                        <button className="absolute top-0.5 left-0.5 bg-black/60 text-white rounded-full p-0.5" onClick={() => removeImage('after', idx)}><X size={10} /></button>
                      </div>
                    ))}
                    {(form.afterImages || []).length === 0 && (
                      <div className="col-span-3 text-center py-4 text-xs text-[var(--foreground-muted)] border border-dashed border-[var(--border)] rounded">
                        هنوز عکسی اضافه نشده
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Image Analysis */}
              <ImageAnalyzer
                onAnalyzed={handleAIAnalysis}
                existingAnalyses={form.aiImageAnalysis || []}
                onRemove={removeAnalysis}
                title="دستیار AI تحلیل تصویر تجهیز (مانند Google Lens)"
              />

              {(form.aiImageAnalysis || []).length > 0 && (
                <div className="p-3 bg-[rgba(34,197,94,0.05)] border border-[var(--success)]/30 rounded-lg text-xs">
                  <strong className="text-[var(--success)]">✓ تحلیل AI به صورت خودکار در فیلدهای «علت ریشه‌ای» و «راه‌حل» مرحله بعد اعمال شد.</strong>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 fade-in">
              <h4 className="font-bold flex items-center gap-2"><Mic size={18} className="text-[var(--gold)]" /> گزارش کار تکنسین</h4>

              <div>
                <label className="label flex items-center gap-1"><FileText size={12} /> گزارش متنی</label>
                <textarea
                  className="textarea"
                  rows={5}
                  value={form.technicianReport || ''}
                  onChange={e => setForm({ ...form, technicianReport: e.target.value })}
                  placeholder="شرح کامل کارهای انجام شده، قطعات تعویضی، تست‌های انجام شده و نتیجه..."
                />
              </div>

              <div>
                <label className="label flex items-center gap-1"><Mic size={12} /> گزارش صوتی (ویس)</label>
                <VoiceRecorder
                  onRecorded={handleVoice}
                  existingUrl={form.voiceReport}
                  existingDuration={form.voiceReportDuration}
                  onClear={clearVoice}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">علت ریشه‌ای خرابی</label>
                  <textarea className="textarea" rows={3} value={form.rootCause || ''} onChange={e => setForm({ ...form, rootCause: e.target.value })} placeholder="به صورت خودکار از تحلیل AI پر می‌شود، قابل ویرایش" />
                </div>
                <div>
                  <label className="label">راه‌حل / اقدامات انجام شده</label>
                  <textarea className="textarea" rows={3} value={form.solution || ''} onChange={e => setForm({ ...form, solution: e.target.value })} />
                </div>
              </div>

              <div className="p-3 bg-[var(--background-secondary)] rounded-lg text-xs text-[var(--foreground-muted)] flex items-start gap-2">
                <Send size={14} className="text-[var(--gold)] mt-0.5 shrink-0" />
                <span>گزارش شما (متن + ویس + عکس‌ها + تحلیل AI) پس از ذخیره به صورت خودکار برای <strong>مدیر فنی</strong> ارسال می‌شود.</span>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 fade-in">
              <h4 className="font-bold flex items-center gap-2"><Sparkles size={18} className="text-[var(--gold)]" /> دستیار هوش مصنوعی - برنامه PM پیشنهادی</h4>
              <div className="p-3 bg-[rgba(212,165,85,0.08)] border border-[var(--gold)]/30 rounded-lg text-sm">
                <p>با کلیک روی دکمه زیر، هوش مصنوعی بر اساس نوع تجهیز انتخاب‌شده و استانداردهای صنعتی مرتبط (ISO 55000, ISO 3691, ASME BPVC, ASHRAE و ...)، یک برنامه تعمیرات و نگهداری پیشنهادی ارائه می‌دهد.</p>
              </div>
              <button className="btn btn-primary w-full !py-3" onClick={generateAIPMSuggestion} disabled={aiLoading || !form.equipmentId}>
                {aiLoading ? <><span className="animate-spin">⏳</span> در حال تحلیل تجهیز...</> : <><Sparkles size={16} /> تولید برنامه PM پیشنهادی بر اساس استاندارد</>}
              </button>
              {aiPMSuggestion && (
                <div className="p-4 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] max-h-[400px] overflow-y-auto">
                  <div className="prose prose-sm text-sm whitespace-pre-wrap leading-relaxed text-[var(--foreground)]">
                    {aiPMSuggestion.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-bold gold-text mt-4 mb-2">{line.replace('## ', '')}</h3>;
                      if (line.startsWith('### ')) return <h4 key={i} className="text-sm font-bold text-[var(--foreground-secondary)] mb-2">{line.replace('### ', '')}</h4>;
                      if (line.startsWith('**') && line.endsWith('**')) return <h5 key={i} className="font-bold text-[var(--gold)] mt-3 mb-1">{line.replace(/\*\*/g, '')}</h5>;
                      if (line.startsWith('• ')) return <div key={i} className="flex gap-2 text-xs mr-4"><span className="text-[var(--gold)]">•</span><span>{line.replace('• ', '')}</span></div>;
                      return <p key={i} className="text-xs">{line}</p>;
                    })}
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                    <button className="btn btn-secondary flex-1" onClick={() => {
                      if (form.description) {
                        setForm(f => ({ ...f, description: f.description + '\n\n--- برنامه PM پیشنهادی AI ---\n' + aiPMSuggestion }));
                      } else {
                        setForm(f => ({ ...f, description: aiPMSuggestion }));
                      }
                      showNotification('success', 'برنامه PM به توضیحات دستور کار اضافه شد.');
                    }}>📋 افزودن به شرح دستور کار</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 fade-in">
              <h4 className="font-bold flex items-center gap-2"><Send size={18} className="text-[var(--gold)]" /> پیش‌نمایش و ارسال به مدیر فنی</h4>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <SummaryItem label="شماره WO" value={form.woNumber} />
                <SummaryItem label="عنوان" value={form.title} />
                <SummaryItem label="تجهیز" value={equipment.find(e => e.id === form.equipmentId)?.name || '-'} />
                <SummaryItem label="تکنسین" value={personnel.find(p => p.id === form.assignedTo)?.fullName || '-'} />
                <SummaryItem label="نوع" value={form.type === 'preventive' ? 'PM' : form.type === 'emergency' ? 'اضطراری' : form.type === 'corrective' ? 'اصلاحی' : 'پیش‌بینانه'} />
                <SummaryItem label="اولویت" value={priorityMap[form.priority]?.label || form.priority} />
                <SummaryItem label="دریافت" value={form.receivedAt ? formatJalali(form.receivedAt, 'yyyy/MM/dd HH:mm') : '-'} />
                <SummaryItem label="پایان" value={form.completedAt ? formatJalali(form.completedAt, 'yyyy/MM/dd HH:mm') : '-'} />
                <SummaryItem label="عکس قبل" value={`${(form.beforeImages || []).length} عدد`} />
                <SummaryItem label="عکس بعد" value={`${(form.afterImages || []).length} عدد`} />
                <SummaryItem label="تحلیل AI" value={`${(form.aiImageAnalysis || []).length} مورد`} />
                <SummaryItem label="گزارش صوتی" value={form.voiceReport ? `${form.voiceReportDuration || 0} ثانیه` : 'ندارد'} />
              </div>

              {form.technicianReport && (
                <div className="p-3 bg-[var(--background-secondary)] rounded-lg">
                  <div className="text-xs text-[var(--foreground-muted)] mb-1">گزارش متنی:</div>
                  <p className="text-sm whitespace-pre-wrap">{form.technicianReport}</p>
                </div>
              )}

              <div>
                <label className="label">بازخورد / تایید مدیر فنی (اختیاری)</label>
                <textarea className="textarea" rows={2} value={form.managerFeedback || ''} onChange={e => setForm({ ...form, managerFeedback: e.target.value })} placeholder="نظرات و تایید مدیر فنی..." />
              </div>

              <div className="p-3 bg-[rgba(212,165,85,0.08)] border border-[var(--gold)]/30 rounded-lg text-sm">
                <strong className="text-[var(--gold)]">آماده ارسال:</strong> با کلیک روی «ثبت و ارسال» دستور کار با وضعیت «در حال انجام» ثبت شده و گزارش کامل برای مدیر فنی ارسال می‌شود. با «ثبت به عنوان تکمیل شده» وضعیت نهایی می‌شود.
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--background-secondary)] flex items-center justify-between gap-2">
          <button className="btn btn-secondary" onClick={prevStep} disabled={step === 1}>
            <ChevronRight size={16} /> قبلی
          </button>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => handleSave(false)}><Save size={14} /> ذخیره پیش‌نویس</button>
            {step === 6 ? (
              <>
                <button className="btn btn-success" onClick={() => handleSave(true)}><Check size={14} /> ثبت و تکمیل</button>
                <button className="btn btn-primary" onClick={() => handleSave(false)}><Send size={14} /> ثبت و ارسال به مدیر فنی</button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={nextStep}>
                ادامه <ChevronLeft size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-2 rounded bg-[var(--background-secondary)]">
      <div className="text-[10px] text-[var(--foreground-muted)]">{label}</div>
      <div className="font-medium text-sm truncate">{value}</div>
    </div>
  );
}

function TechnicianSelector({ value, onChange, personnel }: { value: number | undefined; onChange: (id: number | undefined) => void; personnel: any[] }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const selected = personnel.find((p: any) => p.id === value);

  const filtered = personnel.filter((p: any) =>
    !search || p.fullName.includes(search) || (p.jobTitle || '').includes(search) || (p.department || '').includes(search)
  );

  return (
    <div className="relative">
      <button
        type="button"
        className={`w-full text-right p-3 rounded-lg border transition-all ${open ? 'border-[var(--gold)] ring-2 ring-[var(--gold)]/20' : 'border-[var(--border)]'} bg-[var(--background-secondary)] hover:border-[var(--gold-dark)]`}
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-[#0a0a0b] shrink-0" style={{ background: selected.avatarColor || '#D4A555' }}>
              {selected.fullName.charAt(0)}
            </div>
            <div className="flex-1 text-right">
              <div className="font-bold text-base">{selected.fullName}</div>
              <div className="text-xs text-[var(--foreground-muted)] flex flex-wrap gap-2 mt-0.5">
                {selected.jobTitle && <span>• {selected.jobTitle}</span>}
                {selected.department && <span>• {selected.department}</span>}
                {selected.shift && <span>• {selected.shift === 'morning' ? 'صبحکار' : selected.shift === 'evening' ? 'عصرکار' : selected.shift === 'night' ? 'شب‌کار' : 'چرخشی'}</span>}
                {selected.phone && <span dir="ltr">• {selected.phone}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[var(--foreground-muted)] py-2">برای انتخاب تکنسین کلیک کنید...</div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 left-0 mt-1 bg-[var(--background-card)] border border-[var(--border)] rounded-lg shadow-2xl z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-[var(--border)]">
              <input
                className="input !text-sm"
                placeholder="جستجو بر اساس نام، شغل یا واحد..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <button
                type="button"
                className="w-full text-right p-3 hover:bg-[var(--background-hover)] border-b border-[var(--border)] text-sm text-[var(--foreground-muted)]"
                onClick={() => { onChange(undefined); setOpen(false); }}
              >
                -- بدون تخصیص --
              </button>
              {filtered.map((p: any) => (
                <button
                  type="button"
                  key={p.id}
                  className={`w-full text-right p-3 hover:bg-[var(--background-hover)] border-b border-[var(--border)] flex items-center gap-3 ${value === p.id ? 'bg-[rgba(212,165,85,0.1)]' : ''}`}
                  onClick={() => { onChange(p.id); setOpen(false); setSearch(''); }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#0a0a0b] shrink-0" style={{ background: p.avatarColor || '#3b82f6' }}>
                    {p.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{p.fullName}</div>
                    <div className="text-xs text-[var(--foreground-muted)]">
                      {p.jobTitle}{p.department ? ` • ${p.department}` : ''}{p.shift ? ` • ${p.shift === 'morning' ? 'صبحکار' : p.shift === 'evening' ? 'عصرکار' : p.shift === 'night' ? 'شب‌کار' : 'چرخشی'}` : ''}
                    </div>
                  </div>
                  {value === p.id && <Check size={16} className="text-[var(--gold)]" />}
                </button>
              ))}
              {filtered.length === 0 && <div className="p-4 text-center text-sm text-[var(--foreground-muted)]">پرسنلی یافت نشد.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
