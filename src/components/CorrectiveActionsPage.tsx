'use client';
import React, { useState, useMemo } from 'react';
import { useCAStore, useEquipmentStore, usePersonnelStore, useUIStore } from '@/lib/store';
import type { CorrectiveAction } from '@/lib/store';
import { Plus, Edit2, Trash2, Search, X, Check, Eye, AlertTriangle, FileCheck, Filter, Download, ChevronRight } from 'lucide-react';
import { toPersianDigits, formatJalali, priorityMap, generateId, exportToExcel } from '@/lib/utils';
import JalaliDateTimePicker from './JalaliDateTimePicker';

const statusMap: Record<string, { label: string; class: string }> = {
  open: { label: 'باز', class: 'badge-info' },
  in_progress: { label: 'در حال اجرا', class: 'badge-warning' },
  review: { label: 'بررسی اثربخشی', class: 'badge-gold' },
  closed: { label: 'بسته شده', class: 'badge-success' },
  cancelled: { label: 'لغو شده', class: 'badge-neutral' },
};

const categoryMap: Record<string, string> = {
  quality: 'کیفیت',
  safety: 'ایمنی',
  environment: 'محیط زیست',
  process: 'فرآیند',
  equipment: 'تجهیزات',
  other: 'سایر',
};

const sourceMap: Record<string, string> = {
  workorder: 'دستور کار',
  request: 'درخواست تعمیرات',
  inspection: 'بازرسی',
  audit: 'ممیزی',
  customer: 'شکایت مشتری',
  internal: 'گزارش داخلی',
};

const rootCauseMethodMap: Record<string, string> = {
  '5why': '5 چرا (5 Whys)',
  fishbone: 'نمودار استخوان ماهی',
  fta: 'تحلیل درخت خطا (FTA)',
  pareto: 'پارتو',
  other: 'سایر',
};

export default function CorrectiveActionsPage() {
  const { actions, addAction, updateAction, deleteAction } = useCAStore();
  const { equipment } = useEquipmentStore();
  const { personnel } = usePersonnelStore();
  const { showNotification } = useUIStore();

  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState<CorrectiveAction | null>(null);
  const [editItem, setEditItem] = useState<CorrectiveAction | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const emptyAction = (): CorrectiveAction => ({
    id: Date.now(),
    carNumber: generateId('CA'),
    title: '',
    description: '',
    source: 'internal',
    priority: 'medium',
    category: 'process',
    status: 'open',
    rootCauseMethod: '5why',
    createdAt: new Date().toISOString(),
  });

  const [form, setForm] = useState<CorrectiveAction>(emptyAction());

  const filtered = useMemo(() => {
    return actions.filter(a => {
      const matchSearch = !search || a.title.includes(search) || a.description.includes(search) || a.carNumber.includes(search);
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [actions, search, statusFilter]);

  const openNew = () => {
    setEditItem(null);
    setForm(emptyAction());
    setCurrentStep(1);
    setShowModal(true);
  };

  const openEdit = (a: CorrectiveAction) => {
    setEditItem(a);
    setForm({ ...a });
    setCurrentStep(1);
    setShowModal(true);
  };

  const save = () => {
    if (!form.title.trim()) { showNotification('error', 'عنوان الزامی است.'); return; }
    if (editItem) {
      updateAction(editItem.id, { ...form, updatedAt: new Date().toISOString() });
      showNotification('success', 'اقدام اصلاحی به‌روز شد.');
    } else {
      addAction(form);
      showNotification('success', 'اقدام اصلاحی جدید ثبت شد.');
    }
    setShowModal(false);
  };

  const remove = (id: number) => {
    if (confirm('آیا از حذف این اقدام اصلاحی اطمینان دارید؟')) {
      deleteAction(id);
      showNotification('success', 'اقدام حذف شد.');
    }
  };

  const exportList = () => {
    exportToExcel(actions, 'corrective-actions', [
      { key: 'carNumber', label: 'شماره' },
      { key: 'title', label: 'عنوان' },
      { key: 'category', label: 'دسته' },
      { key: 'priority', label: 'اولویت' },
      { key: 'status', label: 'وضعیت' },
      { key: 'd4_rootCause', label: 'علت ریشه‌ای' },
      { key: 'd5_permanentAction', label: 'اقدام اصلاحی' },
    ]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="section-title mb-0">اقدامات اصلاحی و پیشگیرانه (CAPA / 8D / RCA)</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className="input !pr-10 !w-56" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select !w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={exportList}><Download size={16} /> خروجی</button>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> اقدام جدید</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <StatCard label="باز" value={actions.filter(a => a.status === 'open').length} color="#3b82f6" />
        <StatCard label="در حال اجرا" value={actions.filter(a => a.status === 'in_progress').length} color="#f59e0b" />
        <StatCard label="بررسی" value={actions.filter(a => a.status === 'review').length} color="#D4A555" />
        <StatCard label="بسته شده" value={actions.filter(a => a.status === 'closed').length} color="#22c55e" />
        <StatCard label="بحرانی" value={actions.filter(a => a.priority === 'critical' && a.status !== 'closed').length} color="#ef4444" />
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>شماره</th>
                <th>عنوان</th>
                <th>منبع</th>
                <th>دسته</th>
                <th>اولویت</th>
                <th>وضعیت</th>
                <th>مسئول</th>
                <th>موعد</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const assignee = personnel.find(p => p.id === a.assignedTo);
                const eq = equipment.find(e => e.id === a.equipmentId);
                return (
                  <tr key={a.id}>
                    <td className="font-mono text-xs">{a.carNumber}</td>
                    <td className="font-medium max-w-[250px] truncate" title={a.description}>{a.title}{eq && <div className="text-xs text-[var(--foreground-muted)]">{eq.name}</div>}</td>
                    <td><span className="badge badge-neutral">{sourceMap[a.source]}</span></td>
                    <td><span className="badge badge-info">{categoryMap[a.category]}</span></td>
                    <td><span className={`badge ${priorityMap[a.priority]?.class}`}>{priorityMap[a.priority]?.label}</span></td>
                    <td><span className={`badge ${statusMap[a.status]?.class}`}>{statusMap[a.status]?.label}</span></td>
                    <td className="text-sm">{assignee?.fullName || '-'}</td>
                    <td className="text-sm">{a.dueDate ? formatJalali(a.dueDate) : '-'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost !p-2" onClick={() => setViewItem(a)} title="مشاهده"><Eye size={14} /></button>
                        <button className="btn btn-ghost !p-2" onClick={() => openEdit(a)} title="ویرایش"><Edit2 size={14} /></button>
                        <button className="btn btn-ghost !p-2 text-[var(--danger)]" onClick={() => remove(a.id)} title="حذف"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-[var(--foreground-muted)]">اقدام اصلاحی ثبت نشده است.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div className="modal-content p-6 max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold gold-text">{viewItem.title}</h3>
                <div className="text-xs text-[var(--foreground-muted)]">{viewItem.carNumber}</div>
              </div>
              <button className="btn btn-ghost !p-2" onClick={() => setViewItem(null)}><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <Section title="اطلاعات پایه">
                <InfoRow label="منبع" value={sourceMap[viewItem.source]} />
                <InfoRow label="دسته" value={categoryMap[viewItem.category]} />
                <InfoRow label="اولویت" value={priorityMap[viewItem.priority]?.label} />
                <InfoRow label="وضعیت" value={statusMap[viewItem.status]?.label} />
                <InfoRow label="تجهیز" value={equipment.find(e => e.id === viewItem.equipmentId)?.name || '-'} />
                <InfoRow label="مسئول" value={personnel.find(p => p.id === viewItem.assignedTo)?.fullName || '-'} />
                <InfoRow label="موعد" value={viewItem.dueDate ? formatJalali(viewItem.dueDate) : '-'} />
              </Section>

              <Section title="شرح مشکل">
                <p className="text-sm whitespace-pre-wrap">{viewItem.description}</p>
              </Section>

              <Section title="متدولوژی 8D">
                {viewItem.d1_team && <InfoRow label="D1 - تیم حل مسئله" value={viewItem.d1_team} />}
                {viewItem.d2_problem && <InfoRow label="D2 - تعریف مشکل" value={viewItem.d2_problem} />}
                {viewItem.d3_containment && <InfoRow label="D3 - اقدام موقت" value={viewItem.d3_containment} />}
                {viewItem.d4_rootCause && <InfoRow label="D4 - علت ریشه‌ای" value={viewItem.d4_rootCause} />}
                {viewItem.d5_permanentAction && <InfoRow label="D5 - اقدام اصلاحی دائمی" value={viewItem.d5_permanentAction} />}
                {viewItem.d6_implementation && <InfoRow label="D6 - اجرا و اعتبارسنجی" value={viewItem.d6_implementation} />}
                {viewItem.d7_prevention && <InfoRow label="D7 - جلوگیری از تکرار" value={viewItem.d7_prevention} />}
                {viewItem.d8_congratulation && <InfoRow label="D8 - تقدیر از تیم" value={viewItem.d8_congratulation} />}
              </Section>

              {viewItem.rootCauseMethod && (
                <Section title="تحلیل علت ریشه‌ای (RCA)">
                  <InfoRow label="روش" value={rootCauseMethodMap[viewItem.rootCauseMethod]} />
                  {viewItem.rootCauseAnalysis && <div className="mt-2 p-3 bg-[var(--background-secondary)] rounded-lg text-sm whitespace-pre-wrap">{viewItem.rootCauseAnalysis}</div>}
                </Section>
              )}

              {viewItem.effectivenessCheck && (
                <Section title="بررسی اثربخشی">
                  <div className="p-3 bg-[var(--background-secondary)] rounded-lg text-sm whitespace-pre-wrap">{viewItem.effectivenessCheck}</div>
                  {viewItem.effectivenessResult && <div className="mt-2"><span className={`badge ${viewItem.effectivenessResult === 'effective' ? 'badge-success' : viewItem.effectivenessResult === 'ineffective' ? 'badge-danger' : 'badge-warning'}`}>{viewItem.effectivenessResult === 'effective' ? 'مؤثر' : viewItem.effectivenessResult === 'ineffective' ? 'نامؤثر' : 'در انتظار'}</span></div>}
                </Section>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setViewItem(null)}>بستن</button>
              <button className="btn btn-primary" onClick={() => { setViewItem(null); openEdit(viewItem); }}><Edit2 size={14} /> ویرایش</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/New Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6 max-w-4xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{editItem ? 'ویرایش اقدام اصلاحی' : 'اقدام اصلاحی جدید (CAPA/8D)'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-2 mb-6">
              {[
                { n: 1, label: 'اطلاعات پایه' },
                { n: 2, label: 'متدولوژی 8D' },
                { n: 3, label: 'RCA و تحلیل' },
                { n: 4, label: 'اثربخشی و بستن' },
              ].map(s => (
                <React.Fragment key={s.n}>
                  <button className={`px-3 py-1.5 rounded-lg text-xs transition-all ${currentStep === s.n ? 'bg-[var(--gold)] text-[#0a0a0b] font-bold' : currentStep > s.n ? 'bg-[rgba(34,197,94,0.15)] text-[var(--success)]' : 'bg-[var(--background-elevated)] text-[var(--foreground-muted)]'}`} onClick={() => setCurrentStep(s.n as any)}>
                    {s.n}. {s.label}
                  </button>
                  {s.n < 4 && <ChevronRight size={14} className="text-[var(--foreground-muted)] rotate-180" />}
                </React.Fragment>
              ))}
            </div>

            {currentStep === 1 && (
              <div className="grid grid-cols-2 gap-4 fade-in">
                <div className="col-span-2">
                  <label className="label">عنوان اقدام *</label>
                  <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="label">شرح کامل مشکل / عدم انطباق</label>
                  <textarea className="textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label className="label">منبع</label>
                  <select className="select" value={form.source} onChange={e => setForm({ ...form, source: e.target.value as any })}>
                    {Object.entries(sourceMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">دسته</label>
                  <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })}>
                    {Object.entries(categoryMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">اولویت</label>
                  <select className="select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}>
                    {Object.entries(priorityMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">وضعیت</label>
                  <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                    {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">تجهیز مرتبط</label>
                  <select className="select" value={form.equipmentId || ''} onChange={e => setForm({ ...form, equipmentId: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">-- بدون --</option>
                    {equipment.filter(e => e.isLeaf).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">مسئول اجرا</label>
                  <select className="select" value={form.assignedTo || ''} onChange={e => setForm({ ...form, assignedTo: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">-- بدون --</option>
                    {personnel.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">موعد انجام</label>
                  <JalaliDateTimePicker value={form.dueDate || ''} onChange={iso => setForm({ ...form, dueDate: iso.split('T')[0] })} showTime={false} />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 fade-in">
                <div className="p-3 bg-[rgba(212,165,85,0.08)] rounded-lg text-xs text-[var(--foreground-muted)] mb-2">
                  <strong>متدولوژی 8D:</strong> روش استاندارد جهانی برای حل مسائل کیفی و فرآیندی - شامل ۸ گام از تشکیل تیم تا جلوگیری از تکرار.
                </div>
                <Field8D label="D1 - تشکیل تیم حل مسئله" value={form.d1_team || ''} onChange={v => setForm({ ...form, d1_team: v })} placeholder="اعضای تیم و نقش هر فرد" />
                <Field8D label="D2 - تعریف دقیق مشکل" value={form.d2_problem || ''} onChange={v => setForm({ ...form, d2_problem: v })} placeholder="چه چیزی، کجا، چه زمانی، چند بار؟" />
                <Field8D label="D3 - اقدام موقت (Containment)" value={form.d3_containment || ''} onChange={v => setForm({ ...form, d3_containment: v })} placeholder="اقدام فوری برای جلوگیری از گسترش" />
                <Field8D label="D4 - تشخیص علت ریشه‌ای" value={form.d4_rootCause || ''} onChange={v => setForm({ ...form, d4_rootCause: v })} placeholder="چرا این مشکل رخ داد؟" />
                <Field8D label="D5 - تعیین اقدام اصلاحی دائمی" value={form.d5_permanentAction || ''} onChange={v => setForm({ ...form, d5_permanentAction: v })} placeholder="راه‌حل نهایی چیست؟" />
                <Field8D label="D6 - اجرا و اعتبارسنجی اقدام" value={form.d6_implementation || ''} onChange={v => setForm({ ...form, d6_implementation: v })} placeholder="نحوه اجرا و تست" />
                <Field8D label="D7 - جلوگیری از تکرار" value={form.d7_prevention || ''} onChange={v => setForm({ ...form, d7_prevention: v })} placeholder="تغییرات سیستمی/فرآیندی" />
                <Field8D label="D8 - تقدیر از تیم" value={form.d8_congratulation || ''} onChange={v => setForm({ ...form, d8_congratulation: v })} placeholder="ثبت درس‌آموخته‌ها" />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 fade-in">
                <div>
                  <label className="label">روش تحلیل علت ریشه‌ای</label>
                  <select className="select" value={form.rootCauseMethod || '5why'} onChange={e => setForm({ ...form, rootCauseMethod: e.target.value as any })}>
                    {Object.entries(rootCauseMethodMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">تحلیل دقیق (RCA)</label>
                  <textarea className="textarea" rows={6} value={form.rootCauseAnalysis || ''} onChange={e => setForm({ ...form, rootCauseAnalysis: e.target.value })} placeholder="مثال برای 5 Why:&#10;چرا ۱: ...&#10;چرا ۲: ...&#10;..." />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4 fade-in">
                <div>
                  <label className="label">بررسی اثربخشی اقدام</label>
                  <textarea className="textarea" rows={4} value={form.effectivenessCheck || ''} onChange={e => setForm({ ...form, effectivenessCheck: e.target.value })} placeholder="آیا اقدام اصلاحی مؤثر بود؟ چگونه ارزیابی شد؟" />
                </div>
                <div>
                  <label className="label">نتیجه اثربخشی</label>
                  <select className="select" value={form.effectivenessResult || 'pending'} onChange={e => setForm({ ...form, effectivenessResult: e.target.value as any })}>
                    <option value="pending">در انتظار بررسی</option>
                    <option value="effective">مؤثر</option>
                    <option value="ineffective">نامؤثر</option>
                  </select>
                </div>
                <div>
                  <label className="label">تاریخ بستن</label>
                  <JalaliDateTimePicker value={form.closedDate || ''} onChange={iso => setForm({ ...form, closedDate: iso.split('T')[0] })} showTime={false} />
                </div>
                <div>
                  <label className="label">بسته شده توسط</label>
                  <input className="input" value={form.closedBy || ''} onChange={e => setForm({ ...form, closedBy: e.target.value })} />
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button className="btn btn-secondary" onClick={() => setCurrentStep(Math.max(1, currentStep - 1) as any)} disabled={currentStep === 1}>قبلی</button>
              <div className="flex gap-2">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>انصراف</button>
                {currentStep < 4 ? (
                  <button className="btn btn-primary" onClick={() => setCurrentStep(Math.min(4, currentStep + 1) as any)}>ادامه</button>
                ) : (
                  <button className="btn btn-primary" onClick={save}><Check size={16} /> {editItem ? 'ذخیره تغییرات' : 'ثبت اقدام'}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="stat-card">
      <div className="text-2xl font-bold" style={{ color }}>{toPersianDigits(value)}</div>
      <div className="text-xs text-[var(--foreground-muted)] mt-1">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-bold text-sm mb-2 text-[var(--gold)]">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-[var(--foreground-muted)] min-w-[140px]">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Field8D({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="textarea" rows={2} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
