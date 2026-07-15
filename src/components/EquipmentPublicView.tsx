'use client';
import React, { useMemo, useState } from 'react';
import { loadEquipmentFromStorage, loadLogsFromStorage, loadPMPlansFromStorage } from '@/lib/storageSync';
import { formatJalali, toPersianDigits, buildTree, frequencyLabels, equipmentStatusMap } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Wrench, Calendar, Clock, User, Factory, Package, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  equipmentCode: string;
}

export default function EquipmentPublicView({ equipmentCode }: Props) {
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'pm'>('profile');

  // Load from localStorage or use window's stores if available
  const equipment = useMemo(() => loadEquipmentFromStorage(), []);
  const logs = useMemo(() => loadLogsFromStorage(), []);
  const pmPlans = useMemo(() => loadPMPlansFromStorage(), []);

  const eq = useMemo(() => {
    if (!equipmentCode) return null;
    return equipment.find((e: any) =>
      e.feCode === equipmentCode ||
      e.pmCode === equipmentCode ||
      e.serialNumber === equipmentCode ||
      String(e.id) === equipmentCode
    );
  }, [equipment, equipmentCode]);

  const tree = useMemo(() => buildTree(equipment), [equipment]);

  // Find path in tree
  const findPath = (nodes: any[], targetId: number, path: string[] = []): string[] | null => {
    for (const n of nodes) {
      const newPath = [...path, n.name];
      if (n.id === targetId) return newPath;
      if (n.children && n.children.length > 0) {
        const found = findPath(n.children, targetId, newPath);
        if (found) return found;
      }
    }
    return null;
  };

  const path = eq ? findPath(tree, eq.id) : null;

  // Logs for this equipment (and children)
  const equipmentLogs = useMemo(() => {
    if (!eq) return [];
    const childIds = new Set<number>([eq.id]);
    const collect = (id: number) => {
      equipment.filter((e: any) => e.parentId === id).forEach((c: any) => { childIds.add(c.id); collect(c.id); });
    };
    collect(eq.id);
    return logs.filter(l => childIds.has(l.equipmentId)).sort((a, b) => b.performedDate.localeCompare(a.performedDate));
  }, [eq, equipment, logs]);

  const equipmentPMs = useMemo(() => {
    if (!eq) return [];
    return pmPlans.filter(p => p.equipmentId === eq.id);
  }, [eq, pmPlans]);

  if (!eq) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0b] via-[#121214] to-[#1a1a1e]">
        <div className="card max-w-md w-full text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-[var(--danger)]" />
          <h2 className="text-xl font-bold mb-2">تجهیز یافت نشد</h2>
          <p className="text-sm text-[var(--foreground-muted)] mb-4">تجهیز با کد "{equipmentCode}" در سامانه ثبت نشده است.</p>
          <p className="text-xs text-[var(--foreground-muted)]">لطفاً با واحد فنی تماس بگیرید.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] via-[#121214] to-[#1a1a1e] p-3 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header Card */}
        <div className="card card-gold mb-4">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="bg-white p-2 rounded-lg shrink-0">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/eq/${eq.feCode || eq.pmCode || eq.serialNumber || eq.id}`}
                size={100}
                level="M"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-xs text-[var(--gold)] mb-1">بسپارفوم غرب - سامانه CMMS</div>
              <h1 className="text-2xl font-bold gold-text mb-1">{eq.name}</h1>
              {eq.model && <div className="text-sm text-[var(--foreground-secondary)]">مدل: {eq.model}</div>}
              <div className="flex flex-wrap gap-2 mt-2">
                {eq.feCode && <span className="badge badge-gold">شناسنامه: {eq.feCode}</span>}
                {eq.pmCode && <span className="badge badge-info">کد PM: {eq.pmCode}</span>}
                {eq.serialNumber && <span className="badge badge-neutral">سریال: {eq.serialNumber}</span>}
                <span className={`badge ${equipmentStatusMap[eq.status]?.class || 'badge-success'}`}>{equipmentStatusMap[eq.status]?.label || eq.status}</span>
              </div>
              {path && path.length > 1 && (
                <div className="text-xs text-[var(--foreground-muted)] mt-2 flex items-center gap-1 flex-wrap">
                  <MapPin size={12} />
                  {path.slice(0, -1).join(' ← ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs mb-4">
          <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>شناسنامه</button>
          <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>سوابق ({toPersianDigits(equipmentLogs.length)})</button>
          <button className={`tab ${activeTab === 'pm' ? 'active' : ''}`} onClick={() => setActiveTab('pm')}>برنامه PM ({toPersianDigits(equipmentPMs.length)})</button>
        </div>

        {/* Profile */}
        {activeTab === 'profile' && (
          <div className="card">
            <h2 className="font-bold mb-4 text-[var(--gold)]">مشخصات تجهیز</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {eq.manufacturer && <Info label="سازنده" value={eq.manufacturer} />}
              {eq.country && <Info label="کشور سازنده" value={eq.country} />}
              {eq.location && <Info label="محل استفاده" value={eq.location} />}
              {eq.manufactureYear && <Info label="سال ساخت" value={eq.manufactureYear} />}
              {eq.capacity && <Info label="ظرفیت" value={eq.capacity} />}
              {eq.power && <Info label="توان" value={eq.power} />}
              {eq.voltage && <Info label="ولتاژ" value={eq.voltage} />}
              {eq.calibrationPeriod && <Info label="دوره کالیبراسیون" value={eq.calibrationPeriod} />}
              {eq.calibrationType && <Info label="نوع کالیبراسیون" value={eq.calibrationType} />}
              {eq.authorizedPersonnel && <Info label="سمت مجاز به کار" value={eq.authorizedPersonnel} />}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap gap-2">
              {eq.hasPM && <span className="badge badge-success">✓ برنامه PM دارد</span>}
              {eq.pcRequired && <span className="badge badge-info">PC</span>}
              {eq.ncrRequired && <span className="badge badge-warning">NCR</span>}
              {eq.cbuRequired && <span className="badge badge-gold">CBU</span>}
            </div>
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="card">
            <h2 className="font-bold mb-4 text-[var(--gold)] flex items-center gap-2">
              <Clock size={18} /> سوابق تعمیرات و نگهداری
            </h2>
            {equipmentLogs.length === 0 ? (
              <div className="text-center py-8 text-[var(--foreground-muted)]">سابقه‌ای ثبت نشده است.</div>
            ) : (
              <div className="space-y-3">
                {equipmentLogs.map(log => (
                  <div key={log.id} className="p-3 bg-[var(--background-secondary)] rounded-lg border-r-4" style={{ borderRightColor: log.activityType === 'pm' ? '#D4A555' : log.activityType === 'repair' ? '#ef4444' : '#3b82f6' }}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium flex items-center gap-2">
                        {log.outcome === 'successful' ? <CheckCircle2 size={14} className="text-[var(--success)]" /> : <AlertCircle size={14} className="text-[var(--warning)]" />}
                        {log.title}
                      </div>
                      <span className={`badge ${log.activityType === 'pm' ? 'badge-gold' : log.activityType === 'repair' ? 'badge-danger' : 'badge-info'}`}>
                        {log.activityType === 'pm' ? 'PM' : log.activityType === 'repair' ? 'تعمیر' : 'بازرسی'}
                      </span>
                    </div>
                    {log.description && <p className="text-xs text-[var(--foreground-muted)] mb-2">{log.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--foreground-secondary)]">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {formatJalali(log.performedDate)}</span>
                      <span className="flex items-center gap-1"><User size={12} /> {log.performedBy || '-'}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {toPersianDigits(log.durationMinutes || 0)} دقیقه</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PM Plans */}
        {activeTab === 'pm' && (
          <div className="card">
            <h2 className="font-bold mb-4 text-[var(--gold)] flex items-center gap-2">
              <Calendar size={18} /> برنامه‌های نگهداری پیشگیرانه
            </h2>
            {equipmentPMs.length === 0 ? (
              <div className="text-center py-8 text-[var(--foreground-muted)]">برنامه PM تعریف نشده است.</div>
            ) : (
              <div className="space-y-3">
                {equipmentPMs.map(p => (
                  <div key={p.id} className="p-3 bg-[var(--background-secondary)] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{p.title}</div>
                      <span className="badge badge-gold">{frequencyLabels[p.frequency] || p.frequency}</span>
                    </div>
                    {p.checklist && p.checklist.length > 0 && (
                      <ul className="list-disc pr-5 text-xs space-y-0.5 text-[var(--foreground-secondary)]">
                        {p.checklist.map((item: string, i: number) => <li key={i}>{item}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-[var(--foreground-muted)] mt-6 pb-4">
          <div>سامانه مدیریت نگهداری و تعمیرات - بسپارفوم غرب</div>
          <div className="mt-1">نسخه ۲.۰ • {formatJalali(new Date())}</div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 bg-[var(--background-secondary)] rounded-lg">
      <div className="text-[10px] text-[var(--foreground-muted)] mb-0.5">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
