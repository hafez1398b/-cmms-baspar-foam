'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useWOStore, useEquipmentStore, usePersonnelStore, useLogStore, useUIStore, useMRStore, useTechnicalPersonnelStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth';
import type { WorkOrder } from '@/lib/store';
import { Plus, Edit2, Trash2, Download, Search, X, Eye, Wrench, Clock, Mic, Camera, Sparkles, CheckCircle2 } from 'lucide-react';
import { toPersianDigits, formatJalali, workOrderStatusMap, priorityMap, generateId, exportToExcel } from '@/lib/utils';
import WOWizard from './WOWizard';

export default function WorkOrdersPage() {
  const { workOrders, addWorkOrder, updateWorkOrder, deleteWorkOrder, pendingWOData, setPendingWOData, openWOId, setOpenWOId } = useWOStore();
  const { equipment } = useEquipmentStore();
  const { personnel: oldPersonnel } = usePersonnelStore();
  const { technicalPersonnel } = useTechnicalPersonnelStore();
  const { users: authUsers } = useAuthStore();

  // Build personnel lookup from technical personnel
  const personnel = useMemo(() => {
    const list: Array<{ id: number; fullName: string; jobTitle?: string }> = [];
    const addedIds = new Set<number>();
    technicalPersonnel.forEach(tp => {
      const uid = tp.accountId || (50000 + tp.id);
      if (!addedIds.has(uid)) {
        list.push({ id: uid, fullName: `${tp.firstName} ${tp.lastName}`, jobTitle: `NET: ${tp.codeNET}` });
        addedIds.add(uid);
      }
    });
    authUsers.forEach(u => {
      if (!addedIds.has(u.id)) {
        list.push({ id: u.id, fullName: u.fullName, jobTitle: u.role === 'admin' ? 'مدیر کل' : u.role === 'manager' ? 'مدیر فنی' : 'کاربر' });
        addedIds.add(u.id);
      }
    });
    return list;
  }, [technicalPersonnel, authUsers]);
  const { addLog } = useLogStore();
  const { updateRequest } = useMRStore();
  const { showNotification } = useUIStore();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardInitial, setWizardInitial] = useState<Partial<WorkOrder> | undefined>(undefined);
  const [wizardExistingId, setWizardExistingId] = useState<number | undefined>(undefined);
  const [viewWO, setViewWO] = useState<WorkOrder | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Respond to pending WO from maintenance requests
  useEffect(() => {
    if (pendingWOData) {
      setWizardInitial(pendingWOData);
      setWizardExistingId(undefined);
      setShowWizard(true);
      setPendingWOData(null);
    }
  }, [pendingWOData]);

  // Respond to openWOId
  useEffect(() => {
    if (openWOId !== null) {
      const wo = workOrders.find(w => w.id === openWOId);
      if (wo) {
        setWizardInitial(wo);
        setWizardExistingId(wo.id);
        setShowWizard(true);
      }
      setOpenWOId(null);
    }
  }, [openWOId, workOrders]);

  const filtered = useMemo(() => {
    return workOrders.filter(w => {
      const matchSearch = !search || w.title.includes(search) || w.woNumber.includes(search) || (w.description || '').includes(search);
      const matchStatus = statusFilter === 'all' || w.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [workOrders, search, statusFilter]);

  const openNew = () => {
    setWizardInitial(undefined);
    setWizardExistingId(undefined);
    setShowWizard(true);
  };

  const openEdit = (w: WorkOrder) => {
    setWizardInitial(w);
    setWizardExistingId(w.id);
    setShowWizard(true);
  };

  const handleSave = (wo: WorkOrder) => {
    const exists = workOrders.find(w => w.id === wo.id);
    if (exists) {
      updateWorkOrder(wo.id, wo);
      showNotification('success', 'دستور کار به‌روز شد.');
    } else {
      addWorkOrder(wo);
      showNotification('success', 'دستور کار جدید ثبت و به مدیر فنی ارسال شد.');
      // If converted from request, mark it
      if (wo.sourceRequestId) {
        updateRequest(wo.sourceRequestId, { status: 'converted', convertedToWoId: wo.id });
      }
    }
    // Add log if completed
    if (wo.status === 'completed' && wo.equipmentId && (!exists || exists.status !== 'completed')) {
      addLog({
        id: Date.now(),
        workOrderId: wo.id,
        equipmentId: wo.equipmentId,
        activityType: wo.type === 'preventive' ? 'pm' : 'repair',
        title: wo.title,
        description: wo.technicianReport || wo.solution || wo.description,
        performedBy: wo.assignedTo ? personnel.find(p => p.id === wo.assignedTo)?.fullName : 'تیم تعمیرات',
        performedDate: new Date().toISOString().split('T')[0],
        durationMinutes: (wo.estimatedHours || 0) * 60,
        outcome: 'successful',
      });
    }
    setShowWizard(false);
  };

  const remove = (id: number) => {
    if (confirm('آیا از حذف این دستور کار اطمینان دارید؟')) {
      deleteWorkOrder(id);
      showNotification('success', 'دستور کار حذف شد.');
    }
  };

  const exportList = () => {
    exportToExcel(filtered, 'work-orders', [
      { key: 'woNumber', label: 'شماره' },
      { key: 'title', label: 'عنوان' },
      { key: 'type', label: 'نوع' },
      { key: 'priority', label: 'اولویت' },
      { key: 'status', label: 'وضعیت' },
      { key: 'scheduledDate', label: 'تاریخ' },
    ]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="section-title mb-0">مدیریت دستور کارها</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className="input !pr-10 !w-56" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select !w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(workOrderStatusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={exportList}><Download size={16} /> خروجی</button>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> دستور کار جدید (فرم مرحله‌ای)</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>شماره</th>
                <th>عنوان</th>
                <th>نوع</th>
                <th>تجهیز</th>
                <th>اولویت</th>
                <th>وضعیت</th>
                <th>تکنسین</th>
                <th>گزارش</th>
                <th>تاریخ برنامه</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => {
                const eq = equipment.find(e => e.id === w.equipmentId);
                const assignee = personnel.find(p => p.id === w.assignedTo);
                const hasReport = !!(w.technicianReport || w.voiceReport);
                const hasAI = (w.aiImageAnalysis || []).length > 0;
                const hasImages = (w.beforeImages || []).length > 0 || (w.afterImages || []).length > 0;
                return (
                  <tr key={w.id}>
                    <td className="font-mono text-xs">{w.woNumber}</td>
                    <td className="font-medium max-w-[220px] truncate">{w.title}</td>
                    <td>
                      <span className={`badge ${w.type === 'preventive' ? 'badge-gold' : w.type === 'emergency' ? 'badge-danger' : 'badge-info'}`}>
                        {w.type === 'preventive' ? 'PM' : w.type === 'corrective' ? 'اصلاحی' : w.type === 'emergency' ? 'اضطراری' : 'پیش‌بینانه'}
                      </span>
                    </td>
                    <td className="text-sm text-[var(--foreground-muted)] max-w-[160px] truncate">{eq?.name || '-'}</td>
                    <td><span className={`badge ${priorityMap[w.priority]?.class}`}>{priorityMap[w.priority]?.label}</span></td>
                    <td><span className={`badge ${workOrderStatusMap[w.status]?.class}`}>{workOrderStatusMap[w.status]?.label}</span></td>
                    <td className="text-sm">{assignee?.fullName || '-'}</td>
                    <td>
                      <div className="flex gap-1">
                        {hasImages && <span title="دارای تصاویر"><Camera size={14} className="text-[var(--gold)]" /></span>}
                        {hasAI && <span title="تحلیل AI"><Sparkles size={14} className="text-[var(--info)]" /></span>}
                        {w.voiceReport && <span title="گزارش صوتی"><Mic size={14} className="text-[var(--success)]" /></span>}
                        {hasReport && <span title="گزارش متنی"><CheckCircle2 size={14} className="text-[var(--success)]" /></span>}
                        {!hasReport && !hasImages && !hasAI && <span className="text-xs text-[var(--foreground-muted)]">-</span>}
                      </div>
                    </td>
                    <td className="text-sm">{w.scheduledDate ? formatJalali(w.scheduledDate) : '-'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost !p-2" onClick={() => setViewWO(w)} title="مشاهده"><Eye size={14} /></button>
                        <button className="btn btn-ghost !p-2" onClick={() => openEdit(w)} title="ویرایش فرم مرحله‌ای"><Edit2 size={14} /></button>
                        <button className="btn btn-ghost !p-2 text-[var(--danger)]" onClick={() => remove(w.id)} title="حذف"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-[var(--foreground-muted)]">دستور کاری ثبت نشده است.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <WOWizard
          initial={wizardInitial}
          existingId={wizardExistingId}
          onClose={() => setShowWizard(false)}
          onSave={handleSave}
        />
      )}

      {/* View Modal (read-only) */}
      {viewWO && (
        <div className="modal-overlay" onClick={() => setViewWO(null)}>
          <div className="modal-content p-6 max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold gold-text">{viewWO.title}</h3>
                <div className="text-xs text-[var(--foreground-muted)]">{viewWO.woNumber}</div>
              </div>
              <button className="btn btn-ghost !p-2" onClick={() => setViewWO(null)}><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
              <Info label="وضعیت" value={workOrderStatusMap[viewWO.status]?.label} />
              <Info label="اولویت" value={priorityMap[viewWO.priority]?.label} />
              <Info label="تجهیز" value={equipment.find(e => e.id === viewWO.equipmentId)?.name || '-'} />
              <Info label="تکنسین" value={personnel.find(p => p.id === viewWO.assignedTo)?.fullName || '-'} />
              <Info label="دریافت" value={viewWO.receivedAt ? formatJalali(viewWO.receivedAt, 'yyyy/MM/dd HH:mm') : '-'} />
              <Info label="پایان" value={viewWO.completedAt ? formatJalali(viewWO.completedAt, 'yyyy/MM/dd HH:mm') : '-'} />
            </div>

            {viewWO.description && (
              <div className="mb-4">
                <div className="text-xs text-[var(--foreground-muted)] mb-1">شرح:</div>
                <div className="p-3 bg-[var(--background-secondary)] rounded-lg text-sm whitespace-pre-wrap">{viewWO.description}</div>
              </div>
            )}

            {/* Images */}
            {((viewWO.beforeImages || []).length > 0 || (viewWO.afterImages || []).length > 0) && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs font-bold mb-2 flex items-center gap-1"><Camera size={12} /> قبل از تعمیر</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(viewWO.beforeImages || []).map((img, i) => <img key={i} src={img} className="w-full h-20 object-cover rounded border border-[var(--border)]" alt="" />)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold mb-2 flex items-center gap-1"><CheckCircle2 size={12} className="text-[var(--success)]" /> بعد از تعمیر</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(viewWO.afterImages || []).map((img, i) => <img key={i} src={img} className="w-full h-20 object-cover rounded border border-[var(--border)]" alt="" />)}
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {(viewWO.aiImageAnalysis || []).length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold mb-2 flex items-center gap-1"><Sparkles size={12} className="text-[var(--gold)]" /> تحلیل AI ({toPersianDigits((viewWO.aiImageAnalysis || []).length)} مورد)</div>
                <div className="space-y-2">
                  {(viewWO.aiImageAnalysis || []).map((a, i) => (
                    <div key={i} className="p-2 rounded bg-[var(--background-secondary)] text-xs flex gap-2">
                      {a.imagePreview && <img src={a.imagePreview} className="w-12 h-12 rounded object-cover" alt="" />}
                      <div className="flex-1">
                        <div className="text-[var(--danger)]">علت: {a.cause}</div>
                        <div className="text-[var(--success)]">راه‌حل: {a.solution}</div>
                        <div className="text-[var(--info)]">پیشگیری: {a.prevention}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report */}
            {viewWO.technicianReport && (
              <div className="mb-4">
                <div className="text-xs font-bold mb-1">گزارش متنی تکنسین:</div>
                <div className="p-3 bg-[var(--background-secondary)] rounded-lg text-sm whitespace-pre-wrap">{viewWO.technicianReport}</div>
              </div>
            )}

            {viewWO.voiceReport && (
              <div className="mb-4">
                <div className="text-xs font-bold mb-1 flex items-center gap-1"><Mic size={12} /> گزارش صوتی:</div>
                <audio src={viewWO.voiceReport} controls className="w-full" />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-secondary" onClick={() => setViewWO(null)}>بستن</button>
              <button className="btn btn-primary" onClick={() => { setViewWO(null); openEdit(viewWO); }}><Edit2 size={14} /> ویرایش فرم مرحله‌ای</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-2 rounded bg-[var(--background-secondary)]">
      <div className="text-[10px] text-[var(--foreground-muted)]">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
