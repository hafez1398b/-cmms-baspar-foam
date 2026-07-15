'use client';
import React, { useState, useMemo } from 'react';
import { useMRStore, useEquipmentStore, useWOStore, useUIStore } from '@/lib/store';
import type { MaintenanceRequest, MaintenanceRequestItem } from '@/lib/store';
import { Plus, Edit2, Trash2, Download, Search, X, Check, ArrowRightLeft, Eye, Printer, FileText, List as ListIcon, Save } from 'lucide-react';
import { toPersianDigits, formatJalali, requestStatusMap, priorityMap, generateId, exportToExcel } from '@/lib/utils';
import JalaliDateTimePicker from './JalaliDateTimePicker';

type View = 'list' | 'form';

export default function MaintenanceRequestsPage() {
  const { requests, addRequest, updateRequest, deleteRequest } = useMRStore();
  const { equipment } = useEquipmentStore();
  const { addWorkOrder } = useWOStore();
  const { showNotification } = useUIStore();

  const [view, setView] = useState<View>('list');
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchSearch = !search || r.title.includes(search) || r.requesterFullName.includes(search) || (r.description || '').includes(search);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, search, statusFilter]);

  const emptyRequest = (): MaintenanceRequest => ({
    id: Date.now(),
    mrNumber: generateId('MR'),
    requesterFullName: '',
    department: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    requestedDate: new Date().toISOString().split('T')[0],
    docCode: 'BFG-FR-27-72',
    revisionDate: '۱۴۵/۰۳/۰۲',
    actionType: '',
    serviceType: '',
    equipmentCode: '',
    installLocation: '',
    breakdownDateTime: '',
    additionalInfo: '',
    causesStoppage: false,
    stoppageDateTime: '',
    urgencyLevel: '',
    breakdownCause: '',
    repairMethod: '',
    contractorName: '',
    maintSupervisorName: '',
    managementApproval: '',
    workDoneDescription: '',
    startDateTime: '',
    endDateTime: '',
    totalMaintenanceTime: '',
    itemsUsed: [
      { item: '', hoursOrCount: '', cost: '', notes: '' },
      { item: '', hoursOrCount: '', cost: '', notes: '' },
      { item: '', hoursOrCount: '', cost: '', notes: '' },
      { item: '', hoursOrCount: '', cost: '', notes: '' },
      { item: '', hoursOrCount: '', cost: '', notes: '' },
    ],
    maintTechSign: '',
    requesterSign: '',
    downtimeHours: '',
    deliverySign: '',
    deliveryTime: '',
    deliveryReceiptNumber: '',
  });

  const [form, setForm] = useState<MaintenanceRequest>(emptyRequest());
  const [isEdit, setIsEdit] = useState(false);

  const openNew = () => {
    setIsEdit(false);
    setForm(emptyRequest());
    setCurrentId(null);
    setView('form');
  };

  const openEdit = (r: MaintenanceRequest) => {
    setIsEdit(true);
    setForm({
      ...r,
      itemsUsed: r.itemsUsed || [{ item: '', hoursOrCount: '', cost: '', notes: '' }],
    });
    setCurrentId(r.id);
    setView('form');
  };

  const save = () => {
    if (!form.requesterFullName.trim()) {
      showNotification('error', 'نام درخواست‌کننده الزامی است.');
      return;
    }
    if (isEdit && currentId !== null) {
      updateRequest(currentId, form);
      showNotification('success', 'فرم با موفقیت به‌روز شد.');
    } else {
      addRequest(form);
      showNotification('success', 'فرم درخواست با موفقیت ثبت شد.');
      setCurrentId(form.id);
      setIsEdit(true);
    }
  };

  const remove = (id: number) => {
    if (confirm('آیا از حذف این درخواست اطمینان دارید؟')) {
      deleteRequest(id);
      showNotification('success', 'درخواست حذف شد.');
      if (currentId === id) setView('list');
    }
  };

  const convertToWO = (r: MaintenanceRequest) => {
    const { setPendingWOData } = useWOStore.getState();
    const { setCurrentPage, setPageTitle } = useUIStore.getState();
    // فرم مرحله‌ای WO را با اطلاعات از پیش پر شده باز می‌کنیم
    setPendingWOData({
      title: r.title || `درخواست ${r.mrNumber}`,
      description: `تبدیل شده از درخواست ${r.mrNumber}\n\nدرخواست‌دهنده: ${r.requesterFullName}\nواحد: ${r.department || '-'}\nشرح خرابی: ${r.description}\nاطلاعات تکمیلی: ${r.additionalInfo || '-'}\nعلت خرابی تشخیصی: ${r.breakdownCause || '-'}\nروش رفع پیشنهادی: ${r.repairMethod === 'internal' ? 'داخلی' : r.repairMethod === 'external' ? 'خارجی (پیمانکار: ' + (r.contractorName || '-') + ')' : '-'}`,
      type: r.actionType === 'preventive' ? 'preventive' : r.actionType === 'emergency' ? 'emergency' : 'corrective',
      priority: r.urgencyLevel === 'extreme' ? 'critical' : r.priority,
      status: 'open',
      equipmentId: r.equipmentId,
      requesterName: r.requesterFullName,
      sourceRequestId: r.id,
      failureType: r.breakdownCause,
      scheduledDate: new Date().toISOString().split('T')[0],
      beforeImages: r.description ? [] : [],
      createdAt: new Date().toISOString(),
    });
    updateRequest(r.id, { status: 'converted' });
    showNotification('success', 'درخواست به فرم دستور کار منتقل شد. لطفاً مراحل فرم را تکمیل کنید.');
    setCurrentPage('workorders');
    setPageTitle('دستور کارها');
  };

  const updateItem = (idx: number, key: keyof MaintenanceRequestItem, value: string) => {
    const items = [...(form.itemsUsed || [])];
    items[idx] = { ...items[idx], [key]: value };
    setForm({ ...form, itemsUsed: items });
  };

  const addItemRow = () => {
    setForm({ ...form, itemsUsed: [...(form.itemsUsed || []), { item: '', hoursOrCount: '', cost: '', notes: '' }] });
  };

  const handlePrint = () => {
    const printContent = document.getElementById('maintenance-request-form');
    if (!printContent) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html dir="rtl">
      <head>
        <title>فرم درخواست تعمیرات - ${form.mrNumber}</title>
        <style>
          :root {
            --border: #000;
            --border-light: #666;
            --background-elevated: #f0f0f0;
            --background-secondary: #fafafa;
            --background-card: #fff;
            --foreground: #000;
            --foreground-muted: #666;
            --gold: #b8923e;
            --gold-dark: #9a7830;
          }
          @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
          * { box-sizing: border-box; font-family: 'Vazirmatn', Tahoma, sans-serif; }
          body { margin: 0; padding: 20px; font-size: 11pt; color: #000; background: #fff; }
          table { width: 100%; border-collapse: collapse; }
          table td, table th { border: 1px solid #000 !important; padding: 8px; vertical-align: top; font-size: 10.5pt; }
          input, select, textarea { border: 1px solid #999 !important; background: #fff !important; color: #000 !important; width: 100%; font-family: inherit; font-size: inherit; padding: 4px 6px; outline: none; border-radius: 4px; }
          .no-print { display: none !important; }
          .badge { display: none; }
          button { display: none; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const equipmentMap = useMemo(() => {
    const m = new Map<number, string>();
    equipment.forEach(e => m.set(e.id, e.name + (e.model ? ` (${e.model})` : '')));
    return m;
  }, [equipment]);

  if (view === 'list') {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="section-title mb-0">درخواست‌های تعمیرات / ساخت و خدمات</h2>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input className="input !pr-10 !w-56" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="select !w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">همه وضعیت‌ها</option>
              {Object.entries(requestStatusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={() => exportToExcel(requests, 'maintenance-requests')}><Download size={16} /> خروجی</button>
            <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> فرم جدید</button>
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>شماره</th>
                  <th>درخواست‌دهنده</th>
                  <th>نوع اقدام</th>
                  <th>نوع خدمت</th>
                  <th>عنوان / تجهیز</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.mrNumber}</td>
                    <td>{r.requesterFullName}</td>
                    <td><span className="badge badge-info">{getActionLabel(r.actionType)}</span></td>
                    <td><span className="badge badge-neutral">{getServiceLabel(r.serviceType)}</span></td>
                    <td className="font-medium max-w-[250px] truncate">{r.title || equipmentMap.get(r.equipmentId || -1) || '-'}</td>
                    <td><span className={`badge ${requestStatusMap[r.status]?.class}`}>{requestStatusMap[r.status]?.label}</span></td>
                    <td className="text-sm">{formatJalali(r.requestedDate)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost !p-2" onClick={() => openEdit(r)} title="مشاهده / ویرایش"><Eye size={14} /></button>
                        <button className="btn btn-ghost !p-2 text-[var(--gold)]" onClick={() => convertToWO(r)} title="تبدیل به دستورکار"><ArrowRightLeft size={14} /></button>
                        <button className="btn btn-ghost !p-2 text-[var(--danger)]" onClick={() => remove(r.id)} title="حذف"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-[var(--foreground-muted)]">درخواستی ثبت نشده است. برای ثبت فرم جدید، روی «فرم جدید» کلیک کنید.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ===== FORM VIEW - مطابق عکس BFG-FR-27-72 =====
  return (
    <div>
      <div className="flex items-center justify-between mb-4 no-print">
        <button className="btn btn-secondary" onClick={() => setView('list')}>
          <ListIcon size={16} /> بازگشت به لیست
        </button>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={handlePrint}><Printer size={16} /> چاپ فرم</button>
          <button className="btn btn-primary" onClick={save}><Save size={16} /> ذخیره فرم</button>
        </div>
      </div>

      <div id="maintenance-request-form" className="bg-[var(--background-card)] border border-[var(--border)] p-3 md:p-6 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0">
        <table className="w-full border-collapse border border-[var(--border)] [&_td]:border-[var(--border)] [&_th]:border-[var(--border)] min-w-[700px]" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td rowSpan={3} className="border border-[var(--border)] p-2 w-[100px] text-center align-middle">
                <div className="text-xs">کد سند: {form.docCode || 'BFG-FR-27-72'}</div>
                <div className="text-xs mt-1">تاریخ ویرایش: {form.revisionDate || '۱۴۰۵/۰۳/۰۲'}</div>
                <div className="text-xs mt-1">شماره صفحه: ۱ از </div>
              </td>
              <td className="border border-[var(--border)] p-3 text-center" colSpan={2}>
                <div className="text-xl font-bold">فرم درخواست تعمیرات / ساخت و خدمات</div>
              </td>
              <td rowSpan={3} className="border border-[var(--border)] p-2 w-[120px] text-center align-middle">
                <div className="text-xs font-bold">شرکت بسپار فوم غرب</div>
                <div className="text-2xl mt-1">⚙️⚙️</div>
              </td>
            </tr>
            <tr>
              <td className="border border-[var(--border)] p-2 text-center">
                <div className="font-bold mb-1">تاریخ درخواست:</div>
                <div className="inline-block"><JalaliDateTimePicker value={form.requestedDate} onChange={iso => setForm({ ...form, requestedDate: iso.split('T')[0] })} showTime={false} /></div>
              </td>
              <td className="border border-[var(--border)] p-2 text-center">
                <span className="font-bold">شماره رسید درخواست:</span>{' '}
                <input
                  className="border-none bg-transparent inline-block w-32"
                  value={form.receiptNumber || ''}
                  onChange={e => setForm({ ...form, receiptNumber: e.target.value })}
                  placeholder="______"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-[var(--border)] p-2 text-center">
                <span className="font-bold">شماره فرم:</span> {form.mrNumber}
              </td>
              <td className="border border-[var(--border)] p-2 text-center">
                <span className={`font-bold ${form.status === 'converted' ? 'text-green-700' : ''}`}>
                  وضعیت: {requestStatusMap[form.status]?.label || form.status}
                </span>
              </td>
            </tr>

            {/* Row 1: نوع اقدام */}
            <tr>
              <td className="border border-[var(--border)] p-2 bg-[var(--background-elevated)] font-bold text-center" rowSpan={6}>درخواست کننده</td>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <div className="font-bold mb-2">نوع اقدام:</div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <RadioField label="تعمیر اضطراری" checked={form.actionType === 'emergency'} onChange={() => setForm({ ...form, actionType: 'emergency' })} />
                  <RadioField label="پیشگیرانه" checked={form.actionType === 'preventive'} onChange={() => setForm({ ...form, actionType: 'preventive' })} />
                  <RadioField label="خدمات" checked={form.actionType === 'service'} onChange={() => setForm({ ...form, actionType: 'service' })} />
                  <RadioField label="ساخت ابزار تولیدی/کنترلی" checked={form.actionType === 'manufacturing'} onChange={() => setForm({ ...form, actionType: 'manufacturing' })} />
                </div>
              </td>
            </tr>

            {/* Row 2: نوع خدمت */}
            <tr>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <div className="font-bold mb-2">نوع خدمت:</div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <RadioField label="تاسیسات" checked={form.serviceType === 'facilities'} onChange={() => setForm({ ...form, serviceType: 'facilities' })} />
                  <RadioField label="برقی" checked={form.serviceType === 'electrical'} onChange={() => setForm({ ...form, serviceType: 'electrical' })} />
                  <RadioField label="هیدرولیکی" checked={form.serviceType === 'hydraulic'} onChange={() => setForm({ ...form, serviceType: 'hydraulic' })} />
                  <RadioField label="سایر" checked={form.serviceType === 'other'} onChange={() => setForm({ ...form, serviceType: 'other' })} />
                </div>
              </td>
            </tr>

            {/* Row 3: اطلاعات تجهیز */}
            <tr>
              <td className="border border-[var(--border)] p-2">
                <label className="font-bold block mb-1">نام تجهیز:</label>
                <select
                  className="w-full border border-[var(--border-light)] rounded px-2 py-1 text-sm bg-white"
                  value={form.equipmentId || ''}
                  onChange={e => {
                    const eqId = e.target.value ? Number(e.target.value) : undefined;
                    const eq = equipment.find(x => x.id === eqId);
                    setForm({
                      ...form,
                      equipmentId: eqId,
                      equipmentCode: eq?.pmCode || eq?.feCode || form.equipmentCode || '',
                      installLocation: eq?.location || form.installLocation || '',
                    });
                  }}
                >
                  <option value="">-- انتخاب --</option>
                  {equipment.filter(e => e.isLeaf).map(e => <option key={e.id} value={e.id}>{e.name} {e.model ? `(${e.model})` : ''}</option>)}
                </select>
              </td>
              <td className="border border-[var(--border)] p-2">
                <label className="font-bold block mb-1">کد تجهیز:</label>
                <input className="w-full border border-[var(--border-light)] rounded px-2 py-1 text-sm" value={form.equipmentCode || ''} onChange={e => setForm({ ...form, equipmentCode: e.target.value })} />
              </td>
              <td className="border border-[var(--border)] p-2">
                <label className="font-bold block mb-1">محل نصب:</label>
                <input className="w-full border border-[var(--border-light)] rounded px-2 py-1 text-sm" value={form.installLocation || ''} onChange={e => setForm({ ...form, installLocation: e.target.value })} />
              </td>
            </tr>
            <tr>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <label className="font-bold block mb-1">ساعت / تاریخ خرابی (شمسی):</label>
                <JalaliDateTimePicker value={form.breakdownDateTime || ''} onChange={iso => setForm({ ...form, breakdownDateTime: iso })} />
              </td>
            </tr>

            {/* Row 4: شرح خرابی */}
            <tr>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <label className="font-bold block mb-1">شرح خرابی یا درخواست خدمت:</label>
                <textarea
                  className="w-full border border-[var(--border-light)] rounded px-2 py-1 text-sm min-h-[100px]"
                  rows={4}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value, title: form.title || e.target.value.slice(0, 50) })}
                />
              </td>
            </tr>

            {/* Row 5: اطلاعات تکمیلی */}
            <tr>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <label className="font-bold block mb-1">اطلاعات تکمیلی در خصوص خرابی:</label>
                <textarea
                  className="w-full border border-[var(--border-light)] rounded px-2 py-1 text-sm min-h-[80px]"
                  rows={3}
                  value={form.additionalInfo || ''}
                  onChange={e => setForm({ ...form, additionalInfo: e.target.value })}
                />
              </td>
            </tr>

            {/* Row 6: توقف / ضرورت */}
            <tr>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">آیا خرابی موجب توقف شده است؟</span>
                    <RadioField label="بله" checked={form.causesStoppage === true} onChange={() => setForm({ ...form, causesStoppage: true })} />
                    <RadioField label="خیر" checked={form.causesStoppage === false} onChange={() => setForm({ ...form, causesStoppage: false })} />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">ساعت / تاریخ توقف (شمسی):</label>
                    <JalaliDateTimePicker value={form.stoppageDateTime || ''} onChange={iso => setForm({ ...form, stoppageDateTime: iso })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold block mb-1">میزان ضرورت انجام کار:</label>
                    <div className="flex gap-3">
                      <RadioField label="فوق العاده ضروری" checked={form.urgencyLevel === 'extreme'} onChange={() => setForm({ ...form, urgencyLevel: 'extreme' })} />
                      <RadioField label="ضروری" checked={form.urgencyLevel === 'necessary'} onChange={() => setForm({ ...form, urgencyLevel: 'necessary' })} />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">واحد درخواست کننده:</label>
                    <input className="w-full border border-[var(--border-light)] rounded px-2 py-1 text-sm" value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })} />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">نام درخواست کننده:</label>
                    <input className="w-full border border-[var(--border-light)] rounded px-2 py-1 text-sm" value={form.requesterFullName} onChange={e => setForm({ ...form, requesterFullName: e.target.value })} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="font-bold block mb-1">امضاء درخواست کننده:</label>
                  <input className="w-full border-b border-dotted border-[var(--border)] bg-transparent px-2 py-1 text-sm" value={form.requesterSign || ''} onChange={e => setForm({ ...form, requesterSign: e.target.value })} placeholder="........................" />
                </div>
              </td>
            </tr>

            {/* مسئول نت */}
            <tr>
              <td className="border border-[var(--border)] p-2 bg-[var(--background-elevated)] font-bold text-center" rowSpan={3}>مسئول نت</td>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <label className="font-bold block mb-1">تشخیص علت خرابی:</label>
                <textarea className="w-full border border-[var(--border-light)] rounded px-2 py-1 text-sm" rows={2} value={form.breakdownCause || ''} onChange={e => setForm({ ...form, breakdownCause: e.target.value })} />
              </td>
            </tr>
            <tr>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <div className="mb-2">
                  <span className="font-bold">تشخیص روش رفع خرابی:</span>
                  <div className="inline-flex gap-6 mr-4">
                    <RadioField label="داخلی" checked={form.repairMethod === 'internal'} onChange={() => setForm({ ...form, repairMethod: 'internal' })} />
                    <RadioField label="خارجی (بیرون از شرکت)" checked={form.repairMethod === 'external'} onChange={() => setForm({ ...form, repairMethod: 'external' })} />
                  </div>
                </div>
                <div>
                  <span>توسط پیمانکار خارجی </span>
                  <input className="border-b border-dotted border-[var(--border)] bg-transparent px-2 text-sm inline-block w-48" value={form.contractorName || ''} onChange={e => setForm({ ...form, contractorName: e.target.value })} placeholder="...................................." />
                  <span> اقدام گردد.</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-[var(--border)] p-2">
                <label className="font-bold block mb-1">نام و امضاء مسئول نت:</label>
                <input className="w-full border-b border-dotted border-[var(--border)] bg-transparent px-2 py-1 text-sm" value={form.maintSupervisorName || ''} onChange={e => setForm({ ...form, maintSupervisorName: e.target.value })} />
              </td>
              <td className="border border-[var(--border)] p-2" colSpan={2}>
                <label className="font-bold block mb-1">تایید مدیریت:</label>
                <input className="w-full border-b border-dotted border-[var(--border)] bg-transparent px-2 py-1 text-sm" value={form.managementApproval || ''} onChange={e => setForm({ ...form, managementApproval: e.target.value })} />
              </td>
            </tr>

            {/* نگهداری */}
            <tr>
              <td className="border border-[var(--border)] p-2 bg-[var(--background-elevated)] font-bold text-center" rowSpan={3}>نگهداری تعمیرات / ساخت</td>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="font-bold block mb-1">تاریخ و ساعت شروع تعمیر / ساخت (شمسی):</label>
                    <JalaliDateTimePicker value={form.startDateTime || ''} onChange={iso => setForm({ ...form, startDateTime: iso })} />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">تاریخ و ساعت پایان تعمیر / ساخت (شمسی):</label>
                    <JalaliDateTimePicker value={form.endDateTime || ''} onChange={iso => setForm({ ...form, endDateTime: iso })} />
                  </div>
                </div>
                <div>
                  <label className="font-bold block mb-1">کل زمان خالص تعمیرات / ساخت:</label>
                  <input className="w-full border border-[var(--border-light)] rounded px-2 py-1 text-sm" value={form.totalMaintenanceTime || ''} onChange={e => setForm({ ...form, totalMaintenanceTime: e.target.value })} placeholder="ساعت / دقیقه" />
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <label className="font-bold block mb-1">شرح کار انجام شده:</label>
                <textarea className="w-full border border-[var(--border-light)] rounded px-2 py-1 text-sm" rows={3} value={form.workDoneDescription || ''} onChange={e => setForm({ ...form, workDoneDescription: e.target.value })} />
              </td>
            </tr>
            <tr>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[var(--background-elevated)]">
                      <th className="border border-[var(--border)] p-2 font-bold">اقلام یا خدمات مصرف شده</th>
                      <th className="border border-[var(--border)] p-2 font-bold w-28">نفر ساعت / تعداد</th>
                      <th className="border border-[var(--border)] p-2 font-bold w-32">هزینه</th>
                      <th className="border border-[var(--border)] p-2 font-bold w-36">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.itemsUsed || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="border border-[var(--border)] p-1"><input className="w-full bg-transparent px-2 py-1" value={it.item} onChange={e => updateItem(idx, 'item', e.target.value)} /></td>
                        <td className="border border-[var(--border)] p-1"><input className="w-full bg-transparent px-2 py-1" value={it.hoursOrCount} onChange={e => updateItem(idx, 'hoursOrCount', e.target.value)} /></td>
                        <td className="border border-[var(--border)] p-1"><input className="w-full bg-transparent px-2 py-1" value={it.cost} onChange={e => updateItem(idx, 'cost', e.target.value)} /></td>
                        <td className="border border-[var(--border)] p-1"><input className="w-full bg-transparent px-2 py-1" value={it.notes} onChange={e => updateItem(idx, 'notes', e.target.value)} /></td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={4} className="border border-[var(--border)] p-1 text-center">
                        <button type="button" onClick={addItemRow} className="text-blue-600 hover:underline text-xs no-print">+ افزودن ردیف</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* امضاها + خواب دستگاه */}
            <tr>
              <td className="border border-[var(--border)] p-2 bg-[var(--background-elevated)] font-bold text-center">تکمیل</td>
              <td className="border border-[var(--border)] p-2">
                <label className="font-bold block mb-1">امضاء مسئول نگهداری تعمیرات / مسئول فنی:</label>
                <input className="w-full border-b border-dotted border-[var(--border)] bg-transparent px-2 py-1 text-sm" value={form.maintTechSign || ''} onChange={e => setForm({ ...form, maintTechSign: e.target.value })} />
              </td>
              <td className="border border-[var(--border)] p-2">
                <label className="font-bold block mb-1">امضاء درخواست کننده:</label>
                <input className="w-full border-b border-dotted border-[var(--border)] bg-transparent px-2 py-1 text-sm" value={form.requesterSign || ''} onChange={e => setForm({ ...form, requesterSign: e.target.value })} />
              </td>
              <td className="border border-[var(--border)] p-2">
                <label className="font-bold block mb-1">مدت زمان خواب دستگاه بر حسب ساعت:</label>
                <input className="w-full border border-[var(--border-light)] rounded px-2 py-1 text-sm" value={form.downtimeHours || ''} onChange={e => setForm({ ...form, downtimeHours: e.target.value })} />
              </td>
            </tr>

            {/* تحویل */}
            <tr>
              <td className="border border-[var(--border)] p-2 bg-[var(--background-elevated)] font-bold text-center">تحویل</td>
              <td className="border border-[var(--border)] p-2" colSpan={3}>
                <div className="mb-2">
                  <span className="font-bold">رسید درخواست‌کننده کار از واحد نت &nbsp;&nbsp;&nbsp; شماره نت رسید درخواست: </span>
                  <input className="border-b border-dotted border-[var(--border)] bg-transparent px-2 text-sm inline-block w-40" value={form.deliveryReceiptNumber || ''} onChange={e => setForm({ ...form, deliveryReceiptNumber: e.target.value })} placeholder="...................................." />
                </div>
                <div className="mb-2 text-sm">
                  درخواست <input className="border-b border-dotted border-[var(--border)] bg-transparent px-2 text-sm inline-block w-48" value={form.requesterFullName} onChange={e => setForm({ ...form, requesterFullName: e.target.value })} />
                  &nbsp; در تاریخ <input className="border-b border-dotted border-[var(--border)] bg-transparent px-2 text-sm inline-block w-32" value={form.requestedDate} onChange={e => setForm({ ...form, requestedDate: e.target.value })} />
                  &nbsp; توسط آقای / خانم <input className="border-b border-dotted border-[var(--border)] bg-transparent px-2 text-sm inline-block w-40" value={form.deliverySign || ''} onChange={e => setForm({ ...form, deliverySign: e.target.value })} />
                  &nbsp; به واحد نت تحویل داده شده است.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold block mb-1">ساعت تحویل:</label>
                    <input className="w-full border-b border-dotted border-[var(--border)] bg-transparent px-2 py-1 text-sm" value={form.deliveryTime || ''} onChange={e => setForm({ ...form, deliveryTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">امضاء تحویل گیرنده:</label>
                    <input className="w-full border-b border-dotted border-[var(--border)] bg-transparent px-2 py-1 text-sm" value={form.deliverySign || ''} onChange={e => setForm({ ...form, deliverySign: e.target.value })} />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        {/* Action Buttons at bottom */}
        {form.status === 'pending' && (
          <div className="mt-4 text-center no-print">
            <button onClick={() => convertToWO(form)} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black px-6 py-2 rounded-lg font-bold hover:shadow-lg">
              <ArrowRightLeft size={16} className="inline ml-2" />
              تبدیل این درخواست به دستور کار
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RadioField({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="inline-flex items-center gap-1 cursor-pointer text-sm hover:text-amber-700">
      <span className={`inline-block w-4 h-4 rounded-full border-2 border-[var(--border)] ${checked ? 'bg-black' : 'bg-white'}`}>
        {checked && <span className="block w-1.5 h-1.5 bg-white rounded-full m-[3px]" />}
      </span>
      <input type="radio" className="hidden" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function getActionLabel(t?: string) {
  switch (t) {
    case 'emergency': return 'تعمیر اضطراری';
    case 'preventive': return 'پیشگیرانه';
    case 'service': return 'خدمات';
    case 'manufacturing': return 'ساخت';
    default: return '-';
  }
}

function getServiceLabel(t?: string) {
  switch (t) {
    case 'facilities': return 'تاسیسات';
    case 'electrical': return 'برقی';
    case 'hydraulic': return 'هیدرولیکی';
    case 'other': return 'سایر';
    default: return '-';
  }
}
