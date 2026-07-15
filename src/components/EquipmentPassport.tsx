'use client';
import React, { useState, useMemo, useRef } from 'react';
import { useEquipmentStore, usePersonnelStore, useEquipmentPassportStore } from '@/lib/store';
import type { EquipmentPart, EquipmentPMOperation, EquipmentMaintenanceRecord, PMPlanFull, EquipmentCalibration } from '@/lib/store';
import { useUIStore } from '@/lib/store';
import { FileText, Wrench, Calendar, Gauge, Image as ImageIcon, Paperclip, Plus, Edit2, Trash2, X, Check, Clock, User, DollarSign, Activity, QrCode, Printer, Award, AlertTriangle, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toPersianDigits, formatJalali, generateId, frequencyLabels } from '@/lib/utils';
import JalaliDateTimePicker from './JalaliDateTimePicker';

interface Props {
  equipmentId: number;
  onClose: () => void;
}

type Tab = 'profile' | 'history' | 'pm' | 'calibration' | 'kpi' | 'documents';

const activityTypeMap: Record<string, string> = {
  pm: 'PM (پیشگیرانه)',
  cm: 'CM (اصلاحی)',
  emergency: 'تعمیر اضطراری',
  inspection: 'بازرسی',
  service: 'سرویس',
  overhaul: 'اورهال',
  calibration: 'کالیبراسیون',
  other: 'سایر',
};

const planTypeMap: Record<string, string> = {
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
  quarterly: 'فصلی',
  semi_annual: 'شش‌ماهه',
  annual: 'سالانه',
  runtime_hours: 'بر اساس ساعت کارکرد',
  cycles: 'تعداد سیکل',
  condition: 'شرایط تجهیز',
};

const criticalityMap: Record<string, { label: string; class: string }> = {
  main: { label: 'اصلی', class: 'badge-danger' },
  secondary: { label: 'فرعی', class: 'badge-warning' },
  consumable: { label: 'مصرفی', class: 'badge-info' },
};

export default function EquipmentPassport({ equipmentId, onClose }: Props) {
  const { equipment } = useEquipmentStore();
  const { personnel } = usePersonnelStore();
  const passportStore = useEquipmentPassportStore();
  const { showNotification } = useUIStore();

  const eq = equipment.find(e => e.id === equipmentId);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editHistory, setEditHistory] = useState<EquipmentMaintenanceRecord | null>(null);
  const [historyView, setHistoryView] = useState<'timeline' | 'table'>('timeline');
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');

  // PM Modal
  const [showPMModal, setShowPMModal] = useState(false);
  const [editPM, setEditPM] = useState<PMPlanFull | null>(null);

  // Parts Modal
  const [showPartModal, setShowPartModal] = useState(false);
  const [editPart, setEditPart] = useState<EquipmentPart | null>(null);

  // Operation Modal
  const [showOpModal, setShowOpModal] = useState(false);
  const [editOp, setEditOp] = useState<EquipmentPMOperation | null>(null);

  // Calibration Modal
  const [showCalModal, setShowCalModal] = useState(false);
  const [editCal, setEditCal] = useState<EquipmentCalibration | null>(null);

  // Edit Equipment Modal (for basic profile)
  const [showEditEqModal, setShowEditEqModal] = useState(false);
  const [editEqForm, setEditEqForm] = useState<any>(eq);

  // Documents
  const [showDocModal, setShowDocModal] = useState(false);
  const [documents, setDocuments] = useState<Array<{ id: number; name: string; type: string; size: number; url: string; uploadDate: string; description?: string }>>(() => {
    try {
      const stored = localStorage.getItem(`cmms_docs_${equipmentId}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const docFileRef = useRef<HTMLInputElement>(null);
  const [docForm, setDocForm] = useState<{ name: string; description: string; url: string; type: string; size: number }>({ name: '', description: '', url: '', type: '', size: 0 });
  const [editDocId, setEditDocId] = useState<number | null>(null);

  // History form state
  const emptyHistory = (): EquipmentMaintenanceRecord => ({
    id: Date.now(),
    equipmentId,
    activityType: 'pm',
    description: '',
    createdAt: new Date().toISOString(),
  });
  const [histForm, setHistForm] = useState<EquipmentMaintenanceRecord>(emptyHistory());

  // PM form state
  const emptyPM = (): PMPlanFull => ({
    id: Date.now(),
    equipmentId,
    title: '',
    planType: 'monthly',
    frequency: 'ماهانه',
    importanceLevel: 'medium',
    equipmentCriticality: 'medium',
    priority: 'medium',
    isActive: true,
  });
  const [pmForm, setPMForm] = useState<PMPlanFull>(emptyPM());

  // Part form state
  const emptyPart = (): EquipmentPart => ({
    id: Date.now(),
    equipmentId,
    name: '',
    criticality: 'main',
    stockStatus: 'available',
  });
  const [partForm, setPartForm] = useState<EquipmentPart>(emptyPart());

  // Operation form
  const emptyOp = (): EquipmentPMOperation => ({
    id: Date.now(),
    equipmentId,
    description: '',
    period: 'ماهانه',
  });
  const [opForm, setOpForm] = useState<EquipmentPMOperation>(emptyOp());

  // Calibration form
  const emptyCal = (): EquipmentCalibration => ({
    id: Date.now(),
    equipmentId,
    period: 'یک ساله',
    type: 'internal',
    location: 'آزمایشگاه',
    records: [],
  });
  const [calForm, setCalForm] = useState<EquipmentCalibration>(emptyCal());

  if (!eq) return null;

  // Filtered data
  const parts = passportStore.parts.filter(p => p.equipmentId === equipmentId);
  const pmOps = passportStore.pmOperations.filter(p => p.equipmentId === equipmentId);
  const records = passportStore.maintenanceRecords.filter(r => r.equipmentId === equipmentId);
  const pmPlans = passportStore.pmPlansFull.filter(p => p.equipmentId === equipmentId);
  const calibrations = passportStore.calibrations.filter(c => c.equipmentId === equipmentId);

  const filteredRecords = records.filter(r => {
    const matchSearch = !historySearch || r.description.includes(historySearch) || (r.workOrderNumber || '').includes(historySearch) || (r.partName || '').includes(historySearch);
    const matchType = historyTypeFilter === 'all' || r.activityType === historyTypeFilter;
    return matchSearch && matchType;
  }).sort((a, b) => (b.maintenanceDate || b.createdAt).localeCompare(a.maintenanceDate || a.createdAt));

  // KPI calculations for this equipment
  const repairRecords = records.filter(r => r.activityType === 'cm' || r.activityType === 'emergency');
  const pmRecords = records.filter(r => r.activityType === 'pm');
  const totalDowntime = records.reduce((s, r) => s + (r.downtimeMinutes || 0), 0);
  const totalCost = records.reduce((s, r) => s + (r.cost || 0), 0);
  const totalOperatingHours = Math.max(1000, records.length * 50); // Mock
  const mtbf = repairRecords.length > 0 ? Math.round((totalOperatingHours - totalDowntime / 60) / repairRecords.length) : totalOperatingHours;
  const mttr = repairRecords.length > 0 ? Math.round(repairRecords.reduce((s, r) => s + (r.downtimeMinutes || 0), 0) / repairRecords.length) : 0;
  const availability = totalOperatingHours > 0 ? Math.round(((totalOperatingHours - totalDowntime / 60) / totalOperatingHours) * 10000) / 100 : 100;
  const failureRate = totalOperatingHours > 0 ? (repairRecords.length / totalOperatingHours * 1000).toFixed(2) : '0';

  // Save history
  const saveHistory = () => {
    if (!histForm.description.trim()) { showNotification('error', 'شرح فعالیت الزامی است.'); return; }
    if (editHistory) {
      passportStore.updateMaintenanceRecord(editHistory.id, histForm);
      showNotification('success', 'سابقه به‌روز شد.');
    } else {
      passportStore.addMaintenanceRecord(histForm);
      showNotification('success', 'سابقه جدید ثبت شد.');
      // Auto-update PM plan lastDone if it's a PM activity
      if (histForm.activityType === 'pm' && histForm.maintenanceDate) {
        // Find matching PM plan and update nextDue
        pmPlans.forEach(plan => {
          if (plan.isActive && plan.intervalDays) {
            const lastDone = new Date(histForm.maintenanceDate!);
            const nextDue = new Date(lastDone);
            nextDue.setDate(nextDue.getDate() + plan.intervalDays);
            passportStore.updatePMPlanFull(plan.id, { lastDone: histForm.maintenanceDate, nextDue: nextDue.toISOString().split('T')[0] });
          }
        });
      }
    }
    setShowHistoryModal(false);
  };

  // Save PM Plan
  const savePM = () => {
    if (!pmForm.title.trim()) { showNotification('error', 'عنوان برنامه الزامی است.'); return; }
    if (editPM) {
      passportStore.updatePMPlanFull(editPM.id, pmForm);
    } else {
      // Auto-calculate nextDue if startDate and intervalDays exist
      if (pmForm.startDate && pmForm.intervalDays) {
        const start = new Date(pmForm.startDate);
        const next = new Date(start);
        next.setDate(next.getDate() + pmForm.intervalDays);
        pmForm.nextDue = next.toISOString().split('T')[0];
      }
      passportStore.addPMPlanFull(pmForm);
    }
    showNotification('success', 'برنامه PM ذخیره شد.');
    setShowPMModal(false);
  };

  // Save Part
  const savePart = () => {
    if (!partForm.name.trim()) { showNotification('error', 'نام قطعه الزامی است.'); return; }
    if (editPart) passportStore.updatePart(editPart.id, partForm);
    else passportStore.addPart(partForm);
    showNotification('success', 'قطعه ذخیره شد.');
    setShowPartModal(false);
  };

  // Save Operation
  const saveOp = () => {
    if (!opForm.description.trim()) { showNotification('error', 'شرح عملیات الزامی است.'); return; }
    if (editOp) passportStore.updatePMOperation(editOp.id, opForm);
    else passportStore.addPMOperation(opForm);
    showNotification('success', 'عملیات نگهداری ذخیره شد.');
    setShowOpModal(false);
  };

  // Save Calibration
  const saveCal = () => {
    if (editCal) passportStore.updateCalibration(editCal.id, calForm);
    else passportStore.addCalibration(calForm);
    showNotification('success', 'اطلاعات کالیبراسیون ذخیره شد.');
    setShowCalModal(false);
  };

  const addCalibrationRecord = () => {
    setCalForm({
      ...calForm,
      records: [...(calForm.records || []), { id: Date.now(), date: new Date().toISOString().split('T')[0], calibratorName: '', records: '' }],
    });
  };

  // Handle document file select
  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDocForm(f => ({
        ...f,
        name: file.name,
        type: file.type,
        size: file.size,
        url: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const saveDoc = () => {
    if (!docForm.name.trim()) { showNotification('error', 'نام مدرک الزامی است.'); return; }
    if (!docForm.url) { showNotification('error', 'لطفاً یک فایل انتخاب کنید.'); return; }
    let newList;
    if (editDocId !== null) {
      newList = documents.map(d => d.id === editDocId ? { ...d, ...docForm } : d);
    } else {
      newList = [...documents, { id: Date.now(), ...docForm, uploadDate: new Date().toISOString() }];
    }
    setDocuments(newList);
    try { localStorage.setItem(`cmms_docs_${equipmentId}`, JSON.stringify(newList)); } catch {}
    showNotification('success', 'مدرک ذخیره شد.');
    setShowDocModal(false);
  };

  // Save equipment profile edit
  const saveEquipmentEdit = () => {
    if (!editEqForm.name?.trim()) { showNotification('error', 'نام تجهیز الزامی است.'); return; }
    useEquipmentStore.getState().updateEquipment(equipmentId, editEqForm);
    showNotification('success', 'شناسنامه تجهیز به‌روز شد.');
    setShowEditEqModal(false);
  };

  // Handle image upload for history
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setHistForm(f => ({
        ...f,
        [type === 'before' ? 'beforeImages' : 'afterImages']: [...(type === 'before' ? f.beforeImages || [] : f.afterImages || []), dataUrl],
      }));
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-stretch justify-center p-0 md:p-4">
      <div className="bg-[var(--background-card)] border border-[var(--border)] w-full h-full md:h-auto md:max-h-[98vh] md:max-w-[1400px] md:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] bg-gradient-to-l from-[rgba(212,165,85,0.1)] to-transparent flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-white p-1.5 rounded shrink-0 hidden sm:block">
              <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/eq/${eq.feCode || eq.pmCode || eq.id}`} size={50} level="M" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold gold-text truncate">پرونده دیجیتال تجهیز: {eq.name}</h2>
              <div className="text-xs text-[var(--foreground-muted)] flex flex-wrap gap-2">
                {eq.feCode && <span>شناسنامه: {eq.feCode}</span>}
                {eq.pmCode && <span>کد PM: {eq.pmCode}</span>}
                {eq.model && <span>مدل: {eq.model}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary !text-xs" onClick={() => {
              const w = window.open('', '_blank');
              if (!w) return;
              w.document.write(`<html dir="rtl"><head><title>پرونده تجهیز - ${eq.name}</title></head><body><h1>پرونده دیجیتال تجهیز</h1><p>در حال چاپ...</p></body></html>`);
              w.document.close();
              w.print();
            }}><Printer size={14} /> چاپ پرونده</button>
            <button className="btn btn-ghost !p-2" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] bg-[var(--background-secondary)] overflow-x-auto">
          {[
            { id: 'profile', label: 'شناسنامه و قطعات', icon: FileText },
            { id: 'history', label: `سوابق (${toPersianDigits(records.length)})`, icon: Wrench },
            { id: 'pm', label: `برنامه PM (${toPersianDigits(pmPlans.length)})`, icon: Calendar },
            { id: 'calibration', label: `کالیبراسیون (${toPersianDigits(calibrations.length)})`, icon: Gauge },
            { id: 'kpi', label: 'شاخص‌ها', icon: Activity },
            { id: 'documents', label: 'مستندات', icon: Paperclip },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} className={`flex items-center gap-2 px-4 py-3 text-sm transition-all whitespace-nowrap border-b-2 ${activeTab === t.id ? 'border-[var(--gold)] text-[var(--gold)] font-bold bg-[rgba(212,165,85,0.05)]' : 'border-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'}`} onClick={() => setActiveTab(t.id as Tab)}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Basic info */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[var(--gold)]">مشخصات فنی</h3>
                  <button className="btn btn-secondary !text-xs" onClick={() => { setEditEqForm({ ...eq }); setShowEditEqModal(true); }}><Edit2 size={12} /> ویرایش شناسنامه</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <Info label="نام تجهیز" value={eq.name} />
                  <Info label="مدل" value={eq.model} />
                  <Info label="شماره سریال" value={eq.serialNumber} />
                  <Info label="سازنده" value={eq.manufacturer} />
                  <Info label="کشور سازنده" value={eq.country} />
                  <Info label="سال ساخت" value={eq.manufactureYear} />
                  <Info label="محل استفاده" value={eq.location} />
                  <Info label="ظرفیت" value={eq.capacity} />
                  <Info label="توان" value={eq.power} />
                  <Info label="ولتاژ" value={eq.voltage} />
                  <Info label="سمت مجاز به کار" value={eq.authorizedPersonnel} />
                </div>
              </div>

              {/* Parts */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[var(--gold)]">لیست قطعات دستگاه ({toPersianDigits(parts.length)})</h3>
                  <button className="btn btn-primary !text-xs" onClick={() => { setEditPart(null); setPartForm(emptyPart()); setShowPartModal(true); }}><Plus size={14} /> افزودن قطعه</button>
                </div>
                {parts.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-muted)] text-center py-4">هنوز قطعه‌ای تعریف نشده است.</p>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr><th>#</th><th>نام قطعه</th><th>نوع</th><th>وضعیت موجودی</th><th>ملاحظات</th><th>عملیات</th></tr>
                      </thead>
                      <tbody>
                        {parts.map((p, idx) => (
                          <tr key={p.id}>
                            <td>{toPersianDigits(idx + 1)}</td>
                            <td className="font-medium">{p.name}</td>
                            <td><span className={`badge ${criticalityMap[p.criticality].class}`}>{criticalityMap[p.criticality].label}</span></td>
                            <td><span className={`badge ${p.stockStatus === 'available' ? 'badge-success' : p.stockStatus === 'unavailable' ? 'badge-danger' : 'badge-warning'}`}>{p.stockStatus === 'available' ? 'موجود' : p.stockStatus === 'unavailable' ? 'ناموجود' : 'در حال فعالیت'}</span></td>
                            <td className="text-xs text-[var(--foreground-muted)]">{p.notes || '-'}</td>
                            <td>
                              <div className="flex gap-1">
                                <button className="btn btn-ghost !p-1" onClick={() => { setEditPart(p); setPartForm(p); setShowPartModal(true); }}><Edit2 size={12} /></button>
                                <button className="btn btn-ghost !p-1 text-[var(--danger)]" onClick={() => { if (confirm('حذف شود؟')) passportStore.deletePart(p.id); }}><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* PM Operations */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[var(--gold)]">عملیات نگهداری استاندارد ({toPersianDigits(pmOps.length)})</h3>
                  <button className="btn btn-primary !text-xs" onClick={() => { setEditOp(null); setOpForm(emptyOp()); setShowOpModal(true); }}><Plus size={14} /> افزودن عملیات</button>
                </div>
                {pmOps.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-muted)] text-center py-4">هنوز عملیاتی تعریف نشده است.</p>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr><th>#</th><th>شرح عملیات</th><th>پریود</th><th>ملاحظات</th><th>عملیات</th></tr>
                      </thead>
                      <tbody>
                        {pmOps.map((o, idx) => (
                          <tr key={o.id}>
                            <td>{toPersianDigits(idx + 1)}</td>
                            <td>{o.description}</td>
                            <td><span className="badge badge-gold">{o.period}</span></td>
                            <td className="text-xs text-[var(--foreground-muted)]">{o.notes || '-'}</td>
                            <td>
                              <div className="flex gap-1">
                                <button className="btn btn-ghost !p-1" onClick={() => { setEditOp(o); setOpForm(o); setShowOpModal(true); }}><Edit2 size={12} /></button>
                                <button className="btn btn-ghost !p-1 text-[var(--danger)]" onClick={() => { if (confirm('حذف شود؟')) passportStore.deletePMOperation(o.id); }}><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                  <input className="input !w-48" placeholder="جستجو..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
                  <select className="select !w-auto" value={historyTypeFilter} onChange={e => setHistoryTypeFilter(e.target.value)}>
                    <option value="all">همه انواع</option>
                    {Object.entries(activityTypeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <div className="flex gap-1 p-1 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)]">
                    <button className={`px-3 py-1 rounded text-xs ${historyView === 'timeline' ? 'bg-[var(--gold)] text-[#0a0a0b] font-bold' : 'text-[var(--foreground-muted)]'}`} onClick={() => setHistoryView('timeline')}>خط زمانی</button>
                    <button className={`px-3 py-1 rounded text-xs ${historyView === 'table' ? 'bg-[var(--gold)] text-[#0a0a0b] font-bold' : 'text-[var(--foreground-muted)]'}`} onClick={() => setHistoryView('table')}>جدول</button>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditHistory(null); setHistForm(emptyHistory()); setShowHistoryModal(true); }}><Plus size={16} /> ثبت سابقه جدید</button>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="card text-center py-12 text-[var(--foreground-muted)]">
                  <Wrench size={48} className="mx-auto mb-3 opacity-30" />
                  <p>سابقه‌ای ثبت نشده است. برای افزودن سابقه جدید کلیک کنید.</p>
                </div>
              ) : historyView === 'timeline' ? (
                <div className="relative pr-8 border-r-2 border-[var(--gold)]/30 space-y-4">
                  {filteredRecords.map(r => (
                    <div key={r.id} className="relative">
                      <div className="absolute right-[-42px] top-2 w-6 h-6 rounded-full bg-[var(--gold)] flex items-center justify-center text-[#0a0a0b]">
                        <Clock size={12} />
                      </div>
                      <div className="card">
                        <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold">{r.description.slice(0, 80)}{r.description.length > 80 ? '...' : ''}</span>
                              <span className={`badge ${r.activityType === 'pm' ? 'badge-gold' : r.activityType === 'cm' ? 'badge-danger' : r.activityType === 'emergency' ? 'badge-danger' : 'badge-info'}`}>{activityTypeMap[r.activityType]}</span>
                              {r.pmOrEm && <span className="badge badge-neutral">{r.pmOrEm}</span>}
                            </div>
                            <div className="text-xs text-[var(--foreground-muted)] mt-1 flex flex-wrap gap-3">
                              <span><Clock size={10} className="inline ml-1" />{r.maintenanceDate ? formatJalali(r.maintenanceDate) : '-'}</span>
                              {r.workOrderNumber && <span>WO: {r.workOrderNumber}</span>}
                              {r.partName && <span>قطعه: {r.partName}</span>}
                              {r.personnel && <span><User size={10} className="inline ml-1" />{r.personnel}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button className="btn btn-ghost !p-1" onClick={() => { setEditHistory(r); setHistForm(r); setShowHistoryModal(true); }}><Edit2 size={12} /></button>
                            <button className="btn btn-ghost !p-1 text-[var(--danger)]" onClick={() => { if (confirm('حذف شود؟')) passportStore.deleteMaintenanceRecord(r.id); }}><Trash2 size={12} /></button>
                          </div>
                        </div>
                        {r.failureCause && <div className="text-xs mt-2"><strong>علت خرابی:</strong> {r.failureCause}</div>}
                        {r.actionsTaken && <div className="text-xs mt-1"><strong>اقدامات:</strong> {r.actionsTaken}</div>}
                        {(r.beforeImages?.length || r.afterImages?.length) && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {(r.beforeImages || []).map((img, i) => <img key={`b${i}`} src={img} className="w-16 h-16 rounded object-cover border border-[var(--border)]" alt="" />)}
                            {(r.afterImages || []).map((img, i) => <img key={`a${i}`} src={img} className="w-16 h-16 rounded object-cover border border-[var(--success)]/50" alt="" />)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card">
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th><th>نام قطعه</th><th>نوع قطعه</th><th>وضعیت توقف</th><th>زمان توقف</th><th>تاریخ انجام</th><th>نوع تعمیر</th><th>شرح فعالیت</th><th>مدت زمان توقف</th><th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map((r, idx) => (
                          <tr key={r.id}>
                            <td>{toPersianDigits(idx + 1)}</td>
                            <td>{r.partName || '-'}</td>
                            <td>{r.partCriticality ? <span className={`badge ${criticalityMap[r.partCriticality].class}`}>{criticalityMap[r.partCriticality].label}</span> : '-'}</td>
                            <td>{r.stopStatus === 'stopped' ? 'متوقف' : r.stopStatus === 'running' ? 'در حال فعالیت' : '-'}</td>
                            <td>{r.stopTime || '-'}</td>
                            <td>{r.maintenanceDate ? formatJalali(r.maintenanceDate) : '-'}</td>
                            <td>{r.pmOrEm || activityTypeMap[r.activityType]}</td>
                            <td className="max-w-[200px] truncate" title={r.description}>{r.description}</td>
                            <td>{toPersianDigits(r.downtimeMinutes || 0)} دقیقه</td>
                            <td>
                              <div className="flex gap-1">
                                <button className="btn btn-ghost !p-1" onClick={() => { setEditHistory(r); setHistForm(r); setShowHistoryModal(true); }}><Edit2 size={12} /></button>
                                <button className="btn btn-ghost !p-1 text-[var(--danger)]" onClick={() => { if (confirm('حذف شود؟')) passportStore.deleteMaintenanceRecord(r.id); }}><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pm' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-bold">برنامه‌های نگهداری پیشگیرانه ({toPersianDigits(pmPlans.length)})</h3>
                <button className="btn btn-primary" onClick={() => { setEditPM(null); setPMForm(emptyPM()); setShowPMModal(true); }}><Plus size={16} /> افزودن برنامه PM</button>
              </div>

              {pmPlans.length === 0 ? (
                <div className="card text-center py-12 text-[var(--foreground-muted)]">
                  <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                  <p>برنامه PM تعریف نشده است.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pmPlans.map(p => {
                    const responsible = personnel.find(per => per.id === p.responsibleId);
                    const approver = personnel.find(per => per.id === p.approverId);
                    const isOverdue = p.nextDue && new Date(p.nextDue) < new Date();
                    return (
                      <div key={p.id} className={`card ${isOverdue ? 'border-[var(--danger)]' : ''} ${!p.isActive ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold flex items-center gap-2 flex-wrap">
                              <Calendar size={14} className="text-[var(--gold)]" />
                              <span className="truncate">{p.title}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="badge badge-gold">{planTypeMap[p.planType]}</span>
                              <span className={`badge ${p.importanceLevel === 'critical' ? 'badge-danger' : p.importanceLevel === 'high' ? 'badge-warning' : 'badge-info'}`}>اهمیت: {p.importanceLevel === 'critical' ? 'بحرانی' : p.importanceLevel === 'high' ? 'زیاد' : p.importanceLevel === 'medium' ? 'متوسط' : 'کم'}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button className="btn btn-ghost !p-1" onClick={() => { setEditPM(p); setPMForm(p); setShowPMModal(true); }}><Edit2 size={12} /></button>
                            <button className="btn btn-ghost !p-1 text-[var(--danger)]" onClick={() => { if (confirm('حذف شود؟')) passportStore.deletePMPlanFull(p.id); }}><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-[var(--foreground-secondary)]">
                          <div>تناوب: {p.frequency} {p.intervalDays ? `(${toPersianDigits(p.intervalDays)} روز)` : ''}</div>
                          {p.lastDone && <div>آخرین اجرا: {formatJalali(p.lastDone)}</div>}
                          {p.nextDue && <div className={isOverdue ? 'text-[var(--danger)] font-bold' : ''}>سرویس بعدی: {formatJalali(p.nextDue)} {isOverdue && '⚠️ معوق'}</div>}
                          {p.estimatedDuration && <div>مدت تخمینی: {toPersianDigits(p.estimatedDuration)} دقیقه</div>}
                          {responsible && <div>مسئول: {responsible.fullName}</div>}
                          {approver && <div>تأییدکننده: {approver.fullName}</div>}
                          {p.standardReference && <div>مرجع: {p.standardReference}</div>}
                        </div>
                        {p.checklist && p.checklist.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[var(--border)]">
                            <div className="text-xs font-bold mb-1">چک‌لیست:</div>
                            <ul className="text-xs list-disc pr-4 space-y-0.5">
                              {p.checklist.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'calibration' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-bold">اطلاعات کالیبراسیون ({toPersianDigits(calibrations.length)})</h3>
                <button className="btn btn-primary" onClick={() => { setEditCal(null); setCalForm(emptyCal()); setShowCalModal(true); }}><Plus size={16} /> افزودن کالیبراسیون</button>
              </div>
              {calibrations.length === 0 ? (
                <div className="card text-center py-12 text-[var(--foreground-muted)]">
                  <Gauge size={48} className="mx-auto mb-3 opacity-30" />
                  <p>اطلاعات کالیبراسیون ثبت نشده است.</p>
                </div>
              ) : calibrations.map(c => (
                <div key={c.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold flex items-center gap-2"><Gauge size={16} className="text-[var(--gold)]" /> اطلاعات کالیبراسیون</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <Info label="محدوده اندازه‌گیری" value={c.range} />
                        <Info label="پارامتر" value={c.parameter} />
                        <Info label="دقت" value={c.accuracy} />
                        <Info label="دوره" value={c.period} />
                        <Info label="نوع" value={c.type === 'internal' ? 'داخلی' : 'خارجی'} />
                        <Info label="محل استفاده" value={c.location} />
                      </div>
                      {c.method && <div className="mt-2 p-2 bg-[var(--background-secondary)] rounded text-sm"><strong>متد اجرا:</strong> {c.method}</div>}
                    </div>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost !p-1" onClick={() => { setEditCal(c); setCalForm(c); setShowCalModal(true); }}><Edit2 size={12} /></button>
                      <button className="btn btn-ghost !p-1 text-[var(--danger)]" onClick={() => { if (confirm('حذف شود؟')) passportStore.deleteCalibration(c.id); }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div className="table-container mt-3">
                    <table className="table">
                      <thead>
                        <tr><th>#</th><th>تاریخ کالیبراسیون</th><th>سوابق اجرایی</th><th>نام و امضاء کالیبره‌کننده</th></tr>
                      </thead>
                      <tbody>
                        {(c.records || []).map((r, idx) => (
                          <tr key={r.id}>
                            <td>{toPersianDigits(idx + 1)}</td>
                            <td>{formatJalali(r.date)}</td>
                            <td>{r.records || '-'}</td>
                            <td>{r.calibratorName || '-'}</td>
                          </tr>
                        ))}
                        {(c.records || []).length === 0 && <tr><td colSpan={4} className="text-center py-3 text-[var(--foreground-muted)] text-sm">سابقه‌ای ثبت نشده</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'kpi' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="MTBF" value={toPersianDigits(mtbf)} unit="ساعت" desc="میانگین زمان بین خرابی‌ها" color="#22c55e" />
              <KpiCard label="MTTR" value={toPersianDigits(mttr)} unit="دقیقه" desc="میانگین زمان تعمیر" color="#f59e0b" />
              <KpiCard label="Availability" value={toPersianDigits(availability)} unit="٪" desc="دسترس‌پذیری" color="#3b82f6" />
              <KpiCard label="Failure Rate" value={failureRate} unit="در ۱۰۰ ساعت" desc="نرخ خرابی" color="#ef4444" />
              <KpiCard label="کل سوابق" value={toPersianDigits(records.length)} unit="مورد" desc="تعداد کل فعالیت‌ها" color="#8b5cf6" />
              <KpiCard label="تعمیرات" value={toPersianDigits(repairRecords.length)} unit="مورد" desc="تعداد تعمیرات" color="#f97316" />
              <KpiCard label="PM انجام شده" value={toPersianDigits(pmRecords.length)} unit="مورد" desc="تعداد PM" color="#D4A555" />
              <KpiCard label="هزینه کل" value={toPersianDigits(totalCost.toLocaleString())} unit="ریال" desc="مجموع هزینه‌ها" color="#ec4899" />
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-bold">مدارک و فایل‌های پیوست ({toPersianDigits(documents.length)})</h3>
                <button className="btn btn-primary" onClick={() => { setEditDocId(null); setDocForm({ name: '', description: '', url: '', type: '', size: 0 }); setShowDocModal(true); setTimeout(() => docFileRef.current?.click(), 100); }}><Plus size={16} /> افزودن مدرک</button>
                <input type="file" ref={docFileRef} className="hidden" onChange={handleDocFileSelect} />
              </div>

              {documents.length === 0 ? (
                <div className="card text-center py-12 text-[var(--foreground-muted)]">
                  <Paperclip size={48} className="mx-auto mb-3 opacity-30" />
                  <p>مدرکی ثبت نشده است. برای افزودن فایل کلیک کنید.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="card flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-[var(--background-elevated)] flex items-center justify-center shrink-0">
                            <FileText size={20} className="text-[var(--gold)]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate text-sm">{doc.name}</div>
                            <div className="text-[10px] text-[var(--foreground-muted)]">{(doc.size / 1024).toFixed(1)} KB • {formatJalali(doc.uploadDate)}</div>
                          </div>
                        </div>
                      </div>
                      {doc.description && <p className="text-xs text-[var(--foreground-secondary)] mb-2 line-clamp-2">{doc.description}</p>}
                      <div className="flex gap-1 mt-auto">
                        <a href={doc.url} target="_blank" rel="noopener" className="btn btn-secondary !text-xs flex-1" download={doc.name}><Download size={12} /> دانلود</a>
                        <button className="btn btn-ghost !p-1" onClick={() => { setEditDocId(doc.id); setDocForm({ name: doc.name, description: doc.description || '', url: doc.url, type: doc.type, size: doc.size }); setShowDocModal(true); }}><Edit2 size={12} /></button>
                        <button className="btn btn-ghost !p-1 text-[var(--danger)]" onClick={() => { if (confirm('حذف مدرک؟')) { const newList = documents.filter(d => d.id !== doc.id); setDocuments(newList); localStorage.setItem(`cmms_docs_${equipmentId}`, JSON.stringify(newList)); } }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History Modal - Full */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-2 md:p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--background-card)] z-10">
              <h3 className="font-bold">{editHistory ? 'ویرایش سابقه' : 'ثبت سابقه نگهداری و تعمیرات'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">نام قطعه مورد تعمیر</label>
                  <select className="select" value={histForm.partName || ''} onChange={e => {
                    const p = parts.find(pp => pp.name === e.target.value);
                    setHistForm({ ...histForm, partName: e.target.value, partCriticality: p?.criticality, partStockStatus: p?.stockStatus });
                  }}>
                    <option value="">-- انتخاب --</option>
                    {parts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">نوع فعالیت *</label>
                  <select className="select" value={histForm.activityType} onChange={e => setHistForm({ ...histForm, activityType: e.target.value as any })}>
                    {Object.entries(activityTypeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">نوع تعمیر (PM/EM)</label>
                  <select className="select" value={histForm.pmOrEm || ''} onChange={e => setHistForm({ ...histForm, pmOrEm: e.target.value as any })}>
                    <option value="">-- انتخاب --</option>
                    <option value="PM">PM</option>
                    <option value="EM">EM</option>
                  </select>
                </div>
                <div>
                  <label className="label">شماره دستور کار</label>
                  <input className="input" value={histForm.workOrderNumber || ''} onChange={e => setHistForm({ ...histForm, workOrderNumber: e.target.value })} />
                </div>
                <div>
                  <label className="label">تاریخ انجام</label>
                  <JalaliDateTimePicker value={histForm.maintenanceDate || ''} onChange={iso => setHistForm({ ...histForm, maintenanceDate: iso.split('T')[0] })} showTime={false} />
                </div>
                <div>
                  <label className="label">زمان توقف</label>
                  <input type="time" className="input" value={histForm.stopTime || ''} onChange={e => setHistForm({ ...histForm, stopTime: e.target.value })} />
                </div>
                <div>
                  <label className="label">ساعت شروع</label>
                  <input type="time" className="input" value={histForm.startTime ? histForm.startTime.split('T')[1]?.slice(0, 5) || '' : ''} onChange={e => setHistForm({ ...histForm, startTime: e.target.value ? `${histForm.maintenanceDate || new Date().toISOString().split('T')[0]}T${e.target.value}` : '' })} />
                </div>
                <div>
                  <label className="label">ساعت پایان</label>
                  <input type="time" className="input" value={histForm.endTime ? histForm.endTime.split('T')[1]?.slice(0, 5) || '' : ''} onChange={e => setHistForm({ ...histForm, endTime: e.target.value ? `${histForm.maintenanceDate || new Date().toISOString().split('T')[0]}T${e.target.value}` : '' })} />
                </div>
                <div>
                  <label className="label">وضعیت توقف</label>
                  <select className="select" value={histForm.stopStatus || ''} onChange={e => setHistForm({ ...histForm, stopStatus: e.target.value as any })}>
                    <option value="">-- انتخاب --</option>
                    <option value="stopped">متوقف</option>
                    <option value="running">در حال فعالیت</option>
                  </select>
                </div>
                <div>
                  <label className="label">مدت توقف (دقیقه)</label>
                  <input type="number" className="input" value={histForm.downtimeMinutes || ''} onChange={e => setHistForm({ ...histForm, downtimeMinutes: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">مدت توقف تولید (دقیقه)</label>
                  <input type="number" className="input" value={histForm.productionDowntime || ''} onChange={e => setHistForm({ ...histForm, productionDowntime: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">هزینه (ریال)</label>
                  <input type="number" className="input" value={histForm.cost || ''} onChange={e => setHistForm({ ...histForm, cost: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className="label">شرح کامل فعالیت *</label>
                <textarea className="textarea" rows={3} value={histForm.description} onChange={e => setHistForm({ ...histForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">علت خرابی</label>
                  <textarea className="textarea" rows={2} value={histForm.failureCause || ''} onChange={e => setHistForm({ ...histForm, failureCause: e.target.value })} />
                </div>
                <div>
                  <label className="label">علت ریشه‌ای (Root Cause)</label>
                  <textarea className="textarea" rows={2} value={histForm.rootCause || ''} onChange={e => setHistForm({ ...histForm, rootCause: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">اقدامات انجام شده</label>
                <textarea className="textarea" rows={2} value={histForm.actionsTaken || ''} onChange={e => setHistForm({ ...histForm, actionsTaken: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">قطعات مصرفی</label>
                  <input className="input" value={histForm.consumedParts || ''} onChange={e => setHistForm({ ...histForm, consumedParts: e.target.value })} />
                </div>
                <div>
                  <label className="label">قطعات تعویض شده</label>
                  <input className="input" value={histForm.replacedParts || ''} onChange={e => setHistForm({ ...histForm, replacedParts: e.target.value })} />
                </div>
                <div>
                  <label className="label">نفرات انجام‌دهنده</label>
                  <input className="input" value={histForm.personnel || ''} onChange={e => setHistForm({ ...histForm, personnel: e.target.value })} placeholder="نام تکنسین‌ها" />
                </div>
                <div>
                  <label className="label">پیمانکار</label>
                  <input className="input" value={histForm.contractor || ''} onChange={e => setHistForm({ ...histForm, contractor: e.target.value })} />
                </div>
                <div>
                  <label className="label">نتیجه انجام کار</label>
                  <input className="input" value={histForm.result || ''} onChange={e => setHistForm({ ...histForm, result: e.target.value })} />
                </div>
                <div>
                  <label className="label">وضعیت تجهیز پس از تعمیر</label>
                  <input className="input" value={histForm.equipmentStatusAfter || ''} onChange={e => setHistForm({ ...histForm, equipmentStatusAfter: e.target.value })} />
                </div>
                <div>
                  <label className="label">تأییدکننده</label>
                  <input className="input" value={histForm.approvedBy || ''} onChange={e => setHistForm({ ...histForm, approvedBy: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">تصاویر قبل از تعمیر</label>
                  <input type="file" accept="image/*" className="hidden" id="before-img" onChange={e => handleImageUpload(e, 'before')} />
                  <button type="button" className="btn btn-secondary w-full !text-xs" onClick={() => document.getElementById('before-img')?.click()}><ImageIcon size={14} /> افزودن تصویر</button>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {(histForm.beforeImages || []).map((img, i) => <img key={i} src={img} className="w-12 h-12 rounded object-cover" alt="" />)}
                  </div>
                </div>
                <div>
                  <label className="label">تصاویر بعد از تعمیر</label>
                  <input type="file" accept="image/*" className="hidden" id="after-img" onChange={e => handleImageUpload(e, 'after')} />
                  <button type="button" className="btn btn-secondary w-full !text-xs" onClick={() => document.getElementById('after-img')?.click()}><ImageIcon size={14} /> افزودن تصویر</button>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {(histForm.afterImages || []).map((img, i) => <img key={i} src={img} className="w-12 h-12 rounded object-cover" alt="" />)}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2 sticky bottom-0 bg-[var(--background-card)]">
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={saveHistory}><Check size={16} /> ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* PM Plan Modal */}
      {showPMModal && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-2 md:p-4" onClick={() => setShowPMModal(false)}>
          <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold">{editPM ? 'ویرایش برنامه PM' : 'برنامه PM جدید'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowPMModal(false)}><X size={18} /></button>
            </div>
            <div className="p-4 md:p-6 space-y-3">
              <div>
                <label className="label">عنوان برنامه *</label>
                <input className="input" value={pmForm.title} onChange={e => setPMForm({ ...pmForm, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">نوع برنامه</label>
                  <select className="select" value={pmForm.planType} onChange={e => {
                    const v = e.target.value;
                    const freqMap: Record<string, string> = { daily: 'روزانه', weekly: 'هفتگی', monthly: 'ماهانه', quarterly: 'فصلی', semi_annual: 'شش‌ماهه', annual: 'سالانه' };
                    setPMForm({ ...pmForm, planType: v as any, frequency: freqMap[v] || pmForm.frequency });
                  }}>
                    {Object.entries(planTypeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">تناوب (متن)</label>
                  <input className="input" value={pmForm.frequency} onChange={e => setPMForm({ ...pmForm, frequency: e.target.value })} />
                </div>
                <div>
                  <label className="label">فاصله (روز)</label>
                  <input type="number" className="input" value={pmForm.intervalDays || ''} onChange={e => setPMForm({ ...pmForm, intervalDays: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">فاصله (ساعت کارکرد)</label>
                  <input type="number" className="input" value={pmForm.intervalHours || ''} onChange={e => setPMForm({ ...pmForm, intervalHours: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">تاریخ شروع</label>
                  <JalaliDateTimePicker value={pmForm.startDate || ''} onChange={iso => setPMForm({ ...pmForm, startDate: iso.split('T')[0] })} showTime={false} />
                </div>
                <div>
                  <label className="label">تاریخ پایان</label>
                  <JalaliDateTimePicker value={pmForm.endDate || ''} onChange={iso => setPMForm({ ...pmForm, endDate: iso.split('T')[0] })} showTime={false} />
                </div>
                <div>
                  <label className="label">مدت زمان اجرا (دقیقه)</label>
                  <input type="number" className="input" value={pmForm.estimatedDuration || ''} onChange={e => setPMForm({ ...pmForm, estimatedDuration: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">مسئول اجرا</label>
                  <select className="select" value={pmForm.responsibleId || ''} onChange={e => setPMForm({ ...pmForm, responsibleId: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">-- انتخاب --</option>
                    {personnel.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">مسئول تأیید</label>
                  <select className="select" value={pmForm.approverId || ''} onChange={e => setPMForm({ ...pmForm, approverId: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">-- انتخاب --</option>
                    {personnel.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">سطح اهمیت</label>
                  <select className="select" value={pmForm.importanceLevel} onChange={e => setPMForm({ ...pmForm, importanceLevel: e.target.value as any })}>
                    <option value="low">کم</option>
                    <option value="medium">متوسط</option>
                    <option value="high">زیاد</option>
                    <option value="critical">بحرانی</option>
                  </select>
                </div>
                <div>
                  <label className="label">درجه بحرانی تجهیز</label>
                  <select className="select" value={pmForm.equipmentCriticality} onChange={e => setPMForm({ ...pmForm, equipmentCriticality: e.target.value as any })}>
                    <option value="low">کم</option>
                    <option value="medium">متوسط</option>
                    <option value="high">زیاد</option>
                    <option value="critical">بحرانی</option>
                  </select>
                </div>
                <div>
                  <label className="label">اولویت</label>
                  <select className="select" value={pmForm.priority} onChange={e => setPMForm({ ...pmForm, priority: e.target.value as any })}>
                    <option value="low">کم</option>
                    <option value="medium">متوسط</option>
                    <option value="high">زیاد</option>
                    <option value="critical">بحرانی</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">دستورالعمل انجام کار</label>
                <textarea className="textarea" rows={3} value={pmForm.instructions || ''} onChange={e => setPMForm({ ...pmForm, instructions: e.target.value })} />
              </div>
              <div>
                <label className="label">چک‌لیست (هر مورد در یک خط)</label>
                <textarea className="textarea" rows={3} value={(pmForm.checklist || []).join('\n')} onChange={e => setPMForm({ ...pmForm, checklist: e.target.value.split('\n').filter(Boolean) })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">ابزار مورد نیاز</label>
                  <input className="input" value={pmForm.tools || ''} onChange={e => setPMForm({ ...pmForm, tools: e.target.value })} />
                </div>
                <div>
                  <label className="label">قطعات یدکی مورد نیاز</label>
                  <input className="input" value={pmForm.spareParts || ''} onChange={e => setPMForm({ ...pmForm, spareParts: e.target.value })} />
                </div>
                <div>
                  <label className="label">مواد مصرفی</label>
                  <input className="input" value={pmForm.consumables || ''} onChange={e => setPMForm({ ...pmForm, consumables: e.target.value })} />
                </div>
                <div>
                  <label className="label">روانکارها</label>
                  <input className="input" value={pmForm.lubricants || ''} onChange={e => setPMForm({ ...pmForm, lubricants: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">استاندارد یا دستورالعمل مرجع</label>
                <input className="input" value={pmForm.standardReference || ''} onChange={e => setPMForm({ ...pmForm, standardReference: e.target.value })} placeholder="مثلاً: ISO 55000, دستورالعمل داخلی شماره ..." />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="checkbox" checked={pmForm.isActive} onChange={e => setPMForm({ ...pmForm, isActive: e.target.checked })} />
                فعال
              </label>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowPMModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={savePM}><Check size={16} /> ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* Part Modal */}
      {showPartModal && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-2 md:p-4" onClick={() => setShowPartModal(false)}>
          <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold">{editPart ? 'ویرایش قطعه' : 'قطعه جدید'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowPartModal(false)}><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="label">نام قطعه *</label>
                <input className="input" value={partForm.name} onChange={e => setPartForm({ ...partForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">نوع</label>
                <select className="select" value={partForm.criticality} onChange={e => setPartForm({ ...partForm, criticality: e.target.value as any })}>
                  <option value="main">اصلی</option>
                  <option value="secondary">فرعی</option>
                  <option value="consumable">مصرفی</option>
                </select>
              </div>
              <div>
                <label className="label">وضعیت موجودی</label>
                <select className="select" value={partForm.stockStatus} onChange={e => setPartForm({ ...partForm, stockStatus: e.target.value as any })}>
                  <option value="available">موجود</option>
                  <option value="unavailable">ناموجود</option>
                  <option value="in_use">در حال فعالیت</option>
                </select>
              </div>
              <div>
                <label className="label">ملاحظات</label>
                <textarea className="textarea" rows={2} value={partForm.notes || ''} onChange={e => setPartForm({ ...partForm, notes: e.target.value })} />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowPartModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={savePart}><Check size={16} /> ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* Operation Modal */}
      {showOpModal && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-2 md:p-4" onClick={() => setShowOpModal(false)}>
          <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold">{editOp ? 'ویرایش عملیات' : 'عملیات جدید'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowOpModal(false)}><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="label">شرح عملیات *</label>
                <textarea className="textarea" rows={2} value={opForm.description} onChange={e => setOpForm({ ...opForm, description: e.target.value })} />
              </div>
              <div>
                <label className="label">پریود</label>
                <select className="select" value={opForm.period} onChange={e => setOpForm({ ...opForm, period: e.target.value })}>
                  <option value="روزانه">روزانه</option>
                  <option value="هفتگی">هفتگی</option>
                  <option value="ماهانه">ماهانه</option>
                  <option value="فصلی">فصلی</option>
                  <option value="سالانه">سالانه</option>
                </select>
              </div>
              <div>
                <label className="label">ملاحظات</label>
                <input className="input" value={opForm.notes || ''} onChange={e => setOpForm({ ...opForm, notes: e.target.value })} />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowOpModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={saveOp}><Check size={16} /> ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {showEditEqModal && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-2 md:p-4" onClick={() => setShowEditEqModal(false)}>
          <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold">ویرایش شناسنامه تجهیز</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowEditEqModal(false)}><X size={18} /></button>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="label">نام تجهیز *</label><input className="input" value={editEqForm?.name || ''} onChange={e => setEditEqForm({ ...editEqForm, name: e.target.value })} /></div>
              <div><label className="label">مدل</label><input className="input" value={editEqForm?.model || ''} onChange={e => setEditEqForm({ ...editEqForm, model: e.target.value })} /></div>
              <div><label className="label">شماره سریال</label><input className="input" value={editEqForm?.serialNumber || ''} onChange={e => setEditEqForm({ ...editEqForm, serialNumber: e.target.value })} /></div>
              <div><label className="label">کد PM</label><input className="input" value={editEqForm?.pmCode || ''} onChange={e => setEditEqForm({ ...editEqForm, pmCode: e.target.value })} /></div>
              <div><label className="label">شماره شناسنامه (FE)</label><input className="input" value={editEqForm?.feCode || ''} onChange={e => setEditEqForm({ ...editEqForm, feCode: e.target.value })} /></div>
              <div><label className="label">سازنده</label><input className="input" value={editEqForm?.manufacturer || ''} onChange={e => setEditEqForm({ ...editEqForm, manufacturer: e.target.value })} /></div>
              <div><label className="label">کشور سازنده</label><input className="input" value={editEqForm?.country || ''} onChange={e => setEditEqForm({ ...editEqForm, country: e.target.value })} /></div>
              <div><label className="label">سال ساخت</label><input className="input" value={editEqForm?.manufactureYear || ''} onChange={e => setEditEqForm({ ...editEqForm, manufactureYear: e.target.value })} /></div>
              <div><label className="label">محل استفاده</label><input className="input" value={editEqForm?.location || ''} onChange={e => setEditEqForm({ ...editEqForm, location: e.target.value })} /></div>
              <div><label className="label">ظرفیت</label><input className="input" value={editEqForm?.capacity || ''} onChange={e => setEditEqForm({ ...editEqForm, capacity: e.target.value })} /></div>
              <div><label className="label">توان</label><input className="input" value={editEqForm?.power || ''} onChange={e => setEditEqForm({ ...editEqForm, power: e.target.value })} /></div>
              <div><label className="label">ولتاژ</label><input className="input" value={editEqForm?.voltage || ''} onChange={e => setEditEqForm({ ...editEqForm, voltage: e.target.value })} /></div>
              <div><label className="label">دوره کالیبراسیون</label><input className="input" value={editEqForm?.calibrationPeriod || ''} onChange={e => setEditEqForm({ ...editEqForm, calibrationPeriod: e.target.value })} /></div>
              <div><label className="label">نوع کالیبراسیون</label><input className="input" value={editEqForm?.calibrationType || ''} onChange={e => setEditEqForm({ ...editEqForm, calibrationType: e.target.value })} /></div>
              <div className="md:col-span-2"><label className="label">سمت مجاز به کار</label><input className="input" value={editEqForm?.authorizedPersonnel || ''} onChange={e => setEditEqForm({ ...editEqForm, authorizedPersonnel: e.target.value })} /></div>
              <div className="md:col-span-2"><label className="label">توضیحات / نحوه کار</label><textarea className="textarea" rows={3} value={editEqForm?.notes || ''} onChange={e => setEditEqForm({ ...editEqForm, notes: e.target.value })} /></div>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="checkbox" checked={editEqForm?.hasPM ?? true} onChange={e => setEditEqForm({ ...editEqForm, hasPM: e.target.checked })} /> PM دارد</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="checkbox" checked={editEqForm?.pcRequired ?? false} onChange={e => setEditEqForm({ ...editEqForm, pcRequired: e.target.checked })} /> PC</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="checkbox" checked={editEqForm?.ncrRequired ?? false} onChange={e => setEditEqForm({ ...editEqForm, ncrRequired: e.target.checked })} /> NCR</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="checkbox" checked={editEqForm?.cbuRequired ?? false} onChange={e => setEditEqForm({ ...editEqForm, cbuRequired: e.target.checked })} /> CBU</label>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowEditEqModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={saveEquipmentEdit}><Check size={16} /> ذخیره تغییرات</button>
            </div>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-2 md:p-4" onClick={() => setShowDocModal(false)}>
          <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold">{editDocId ? 'ویرایش مدرک' : 'افزودن مدرک'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowDocModal(false)}><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="label">نام مدرک *</label>
                <input className="input" value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">فایل</label>
                <input type="file" className="hidden" id="doc-file-modal" onChange={handleDocFileSelect} />
                <button type="button" className="btn btn-secondary w-full" onClick={() => document.getElementById('doc-file-modal')?.click()}>
                  <Paperclip size={14} /> {docForm.url ? `فایل انتخاب شده: ${docForm.name}` : 'انتخاب فایل'}
                </button>
              </div>
              <div>
                <label className="label">توضیحات</label>
                <textarea className="textarea" rows={3} value={docForm.description} onChange={e => setDocForm({ ...docForm, description: e.target.value })} />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowDocModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={saveDoc}><Check size={16} /> ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* Calibration Modal */}
      {showCalModal && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-2 md:p-4" onClick={() => setShowCalModal(false)}>
          <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold">{editCal ? 'ویرایش کالیبراسیون' : 'کالیبراسیون جدید'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowCalModal(false)}><X size={18} /></button>
            </div>
            <div className="p-4 md:p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">نام تجهیز/برنامه محاسب</label>
                  <input className="input" defaultValue={eq.name} disabled />
                </div>
                <div>
                  <label className="label">کد تجهیز/نرم افزار</label>
                  <input className="input" defaultValue={eq.feCode || eq.pmCode || ''} disabled />
                </div>
                <div>
                  <label className="label">محدوده اندازه‌گیری/پایش</label>
                  <input className="input" value={calForm.range || ''} onChange={e => setCalForm({ ...calForm, range: e.target.value })} />
                </div>
                <div>
                  <label className="label">پارامتر اندازه‌گیری/پایش</label>
                  <input className="input" value={calForm.parameter || ''} onChange={e => setCalForm({ ...calForm, parameter: e.target.value })} />
                </div>
                <div>
                  <label className="label">دقت اندازه‌گیری/پایش</label>
                  <input className="input" value={calForm.accuracy || ''} onChange={e => setCalForm({ ...calForm, accuracy: e.target.value })} />
                </div>
                <div>
                  <label className="label">دوره کالیبراسیون</label>
                  <input className="input" value={calForm.period || ''} onChange={e => setCalForm({ ...calForm, period: e.target.value })} placeholder="یک ساله" />
                </div>
                <div>
                  <label className="label">نوع کالیبراسیون</label>
                  <select className="select" value={calForm.type || 'internal'} onChange={e => setCalForm({ ...calForm, type: e.target.value as any })}>
                    <option value="internal">داخلی</option>
                    <option value="external">خارجی</option>
                  </select>
                </div>
                <div>
                  <label className="label">محل مورد استفاده</label>
                  <input className="input" value={calForm.location || ''} onChange={e => setCalForm({ ...calForm, location: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">متد اجرای کالیبراسیون یا کنترل</label>
                <textarea className="textarea" rows={2} value={calForm.method || ''} onChange={e => setCalForm({ ...calForm, method: e.target.value })} placeholder="مثلاً: ISO 7500 - ASTM E4 - OIML R65" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">سوابق اجرایی کالیبراسیون</label>
                  <button type="button" className="btn btn-secondary !text-xs" onClick={addCalibrationRecord}><Plus size={12} /> افزودن سابقه</button>
                </div>
                <div className="space-y-2">
                  {(calForm.records || []).map((r, idx) => (
                    <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-xs text-[var(--foreground-muted)]">{toPersianDigits(idx + 1)}</div>
                      <div className="col-span-3">
                        <input type="date" className="input !text-xs" value={r.date} onChange={e => {
                          const recs = [...(calForm.records || [])];
                          recs[idx] = { ...recs[idx], date: e.target.value };
                          setCalForm({ ...calForm, records: recs });
                        }} />
                      </div>
                      <div className="col-span-4">
                        <input className="input !text-xs" placeholder="سوابق اجرایی" value={r.records || ''} onChange={e => {
                          const recs = [...(calForm.records || [])];
                          recs[idx] = { ...recs[idx], records: e.target.value };
                          setCalForm({ ...calForm, records: recs });
                        }} />
                      </div>
                      <div className="col-span-3">
                        <input className="input !text-xs" placeholder="نام کالیبره‌کننده" value={r.calibratorName || ''} onChange={e => {
                          const recs = [...(calForm.records || [])];
                          recs[idx] = { ...recs[idx], calibratorName: e.target.value };
                          setCalForm({ ...calForm, records: recs });
                        }} />
                      </div>
                      <button type="button" className="col-span-1 btn btn-ghost !p-1 text-[var(--danger)]" onClick={() => {
                        const recs = (calForm.records || []).filter((_, i) => i !== idx);
                        setCalForm({ ...calForm, records: recs });
                      }}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">نام و امضاء مسئول کالیبراسیون</label>
                <input className="input" value={calForm.responsibleSign || ''} onChange={e => setCalForm({ ...calForm, responsibleSign: e.target.value })} />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowCalModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={saveCal}><Check size={16} /> ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] text-[var(--foreground-muted)]">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function KpiCard({ label, value, unit, desc, color }: { label: string; value: string; unit: string; desc: string; color: string }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="text-xs text-[var(--foreground-muted)] mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold" style={{ color }}>{value}</span>
        <span className="text-xs text-[var(--foreground-muted)]">{unit}</span>
      </div>
      <div className="text-[10px] text-[var(--foreground-muted)] mt-2">{desc}</div>
    </div>
  );
}
