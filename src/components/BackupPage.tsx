'use client';
import React, { useState, useRef } from 'react';
import { useEquipmentStore, useWOStore, useMRStore, usePersonnelStore, useSupplierStore, useSparePartStore, useLogStore, usePMStore, useCAStore, useNotificationStore, useMessageStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth';
import { useUIStore } from '@/lib/store';
import { Download, Upload, Database, FileText, Check, AlertTriangle, HardDrive, RefreshCw, Package, Calendar, Wrench, Users, Briefcase, ClipboardList, Bell } from 'lucide-react';
import { toPersianDigits, formatJalali, generateId } from '@/lib/utils';

export default function BackupPage() {
  const { showNotification } = useUIStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupStats, setBackupStats] = useState<any>(null);

  // Collect all data from stores
  const collectData = () => {
    return {
      version: '2.0',
      appName: 'CMMS Baspar Foam Gharb',
      createdAt: new Date().toISOString(),
      data: {
        equipment: useEquipmentStore.getState().equipment,
        workOrders: useWOStore.getState().workOrders,
        woConsultations: useWOStore.getState().consultations,
        maintenanceRequests: useMRStore.getState().requests,
        personnel: usePersonnelStore.getState().personnel,
        attendance: usePersonnelStore.getState().attendance,
        leaves: usePersonnelStore.getState().leaves,
        suppliers: useSupplierStore.getState().suppliers,
        spareParts: useSparePartStore.getState().spareParts,
        logs: useLogStore.getState().logs,
        pmPlans: usePMStore.getState().pmPlans,
        correctiveActions: useCAStore.getState().actions,
        notifications: useNotificationStore.getState().notifications,
        notificationConfig: useNotificationStore.getState().channelConfig,
        messages: useMessageStore.getState().messages,
        conversations: useMessageStore.getState().conversations,
        participants: useMessageStore.getState().participants,
        users: useAuthStore.getState().users,
      },
    };
  };

  const calculateStats = (data: any) => {
    const d = data.data || data;
    return {
      equipment: d.equipment?.length || 0,
      workOrders: d.workOrders?.length || 0,
      requests: d.maintenanceRequests?.length || 0,
      personnel: d.personnel?.length || 0,
      suppliers: d.suppliers?.length || 0,
      spareParts: d.spareParts?.length || 0,
      logs: d.logs?.length || 0,
      pmPlans: d.pmPlans?.length || 0,
      correctiveActions: d.correctiveActions?.length || 0,
      users: d.users?.length || 0,
    };
  };

  const downloadJSON = () => {
    setIsBackingUp(true);
    try {
      const data = collectData();
      const stats = calculateStats(data);
      setBackupStats(stats);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      forceDownloadBlob(blob, `cmms_backup_${date}_${time}.json`);
      showNotification('success', `بکاپ با موفقیت دانلود شد (${toPersianDigits(stats.equipment)} تجهیز، ${toPersianDigits(stats.workOrders)} دستور کار)`);
    } catch (err: any) {
      showNotification('error', 'خطا در ایجاد بکاپ: ' + err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const downloadSQL = async (type: 'schema' | 'full') => {
    try {
      showNotification('info', `در حال آماده‌سازی ${type === 'schema' ? 'schema' : 'بکاپ کامل'} SQL...`);
      let blob: Blob | null = null;
      // Try live dump first
      try {
        const res = await fetch(`/api/backup/live?type=${type}`);
        if (res.ok) blob = await res.blob();
      } catch {}
      // Fallback to static
      if (!blob) {
        try {
          const res2 = await fetch(`/api/backup/sql?type=${type}`);
          if (res2.ok) blob = await res2.blob();
        } catch {}
      }
      // Fallback: generate from collectData
      if (!blob) {
        const data = collectData();
        const content = `-- CMMS Baspar Foam Gharb - SQL Export\n-- Date: ${new Date().toISOString()}\n-- This is a JSON data export (SQL server not available)\n\n${JSON.stringify(data, null, 2)}`;
        blob = new Blob([content], { type: 'application/sql;charset=utf-8' });
      }
      forceDownloadBlob(blob, `cmms_${type}_${new Date().toISOString().split('T')[0]}.sql`);
      showNotification('success', `فایل SQL ${type === 'schema' ? 'schema' : 'کامل'} دانلود شد.`);
    } catch (err: any) {
      showNotification('error', 'خطا در دانلود SQL: ' + err.message);
    }
  };

  // Force download a blob - works in all browsers
  const forceDownloadBlob = (blob: Blob, filename: string) => {
    // Method 1: Using msSaveBlob (IE/Edge legacy)
    if (typeof (window.navigator as any).msSaveBlob !== 'undefined') {
      (window.navigator as any).msSaveBlob(blob, filename);
      return;
    }
    // Method 2: Create link and click
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', filename);
    // Required for Firefox
    document.body.appendChild(link);
    link.click();
    // Cleanup after delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 1000);
  };

  const restoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('⚠️ بازیابی بکاپ باعث جایگزینی تمام داده‌های فعلی می‌شود. ادامه می‌دهید؟')) {
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const d = data.data || data;

        // Restore all stores
        if (d.equipment) useEquipmentStore.getState().setEquipment(d.equipment);
        if (d.workOrders) useWOStore.getState().setWorkOrders(d.workOrders);
        if (d.woConsultations) useWOStore.getState().consultations = d.woConsultations;
        if (d.maintenanceRequests) useMRStore.getState().setRequests(d.maintenanceRequests);
        if (d.personnel) usePersonnelStore.getState().setPersonnel(d.personnel);
        if (d.attendance) usePersonnelStore.getState().setAttendance(d.attendance);
        if (d.leaves) usePersonnelStore.getState().setLeaves(d.leaves);
        if (d.suppliers) useSupplierStore.getState().setSuppliers(d.suppliers);
        if (d.spareParts) useSparePartStore.getState().setSpareParts(d.spareParts);
        if (d.logs) useLogStore.getState().setLogs(d.logs);
        if (d.pmPlans) usePMStore.getState().setPMPlans(d.pmPlans);
        if (d.correctiveActions) useCAStore.getState().setActions(d.correctiveActions);
        if (d.notifications) useNotificationStore.getState().setNotifications(d.notifications);
        if (d.notificationConfig) useNotificationStore.getState().updateChannelConfig(d.notificationConfig);
        if (d.messages) useMessageStore.getState().setMessages(d.messages);
        if (d.conversations) useMessageStore.getState().setConversations(d.conversations);
        if (d.participants) useMessageStore.getState().setParticipants(d.participants);
        if (d.users) useAuthStore.setState({ users: d.users });

        const stats = calculateStats(data);
        setBackupStats(stats);
        showNotification('success', `بکاپ با موفقیت بازیابی شد (${formatJalali(data.createdAt)})`);
      } catch (err: any) {
        showNotification('error', 'خطا در بازیابی بکاپ: فایل نامعتبر است.');
      } finally {
        setIsRestoring(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Current stats
  const currentStats = calculateStats(collectData());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title mb-0">مدیریت بکاپ و بازیابی</h2>
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> تازه‌سازی
        </button>
      </div>

      {/* Current Data Stats */}
      <div className="card">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Database size={18} className="text-[var(--gold)]" /> آمار فعلی داده‌ها</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatItem icon={<Package size={18} />} label="تجهیزات" value={currentStats.equipment} color="#D4A555" />
          <StatItem icon={<Wrench size={18} />} label="دستور کارها" value={currentStats.workOrders} color="#3b82f6" />
          <StatItem icon={<ClipboardList size={18} />} label="درخواست‌ها" value={currentStats.requests} color="#f59e0b" />
          <StatItem icon={<Users size={18} />} label="پرسنل" value={currentStats.personnel} color="#10b981" />
          <StatItem icon={<Calendar size={18} />} label="برنامه‌های PM" value={currentStats.pmPlans} color="#8b5cf6" />
          <StatItem icon={<Briefcase size={18} />} label="تامین‌کنندگان" value={currentStats.suppliers} color="#ec4899" />
          <StatItem icon={<Package size={18} />} label="قطعات یدکی" value={currentStats.spareParts} color="#06b6d4" />
          <StatItem icon={<Wrench size={18} />} label="سوابق نگهداری" value={currentStats.logs} color="#f97316" />
          <StatItem icon={<AlertTriangle size={18} />} label="اقدامات اصلاحی" value={currentStats.correctiveActions} color="#ef4444" />
          <StatItem icon={<Users size={18} />} label="کاربران سیستم" value={currentStats.users} color="#14b8a6" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JSON Backup */}
        <div className="card card-gold">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center">
              <HardDrive size={24} className="text-[#0a0a0b]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">بکاپ داده‌ها (JSON)</h3>
              <p className="text-xs text-[var(--foreground-muted)]">پشتیبان‌گیری از تمام داده‌های سامانه</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-[var(--background-secondary)] rounded-lg text-xs text-[var(--foreground-secondary)]">
              <strong>مزایا:</strong> بازیابی آسان، شامل همه تنظیمات و داده‌ها، قابل انتقال بین سیستم‌ها
            </div>

            <button className="btn btn-primary w-full !py-3" onClick={downloadJSON} disabled={isBackingUp}>
              {isBackingUp ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
              دانلود بکاپ JSON
            </button>

            <div className="border-t border-[var(--border)] pt-3">
              <label className="label flex items-center gap-1"><Upload size={12} /> بازیابی از فایل JSON</label>
              <input type="file" ref={fileRef} className="hidden" accept=".json" onChange={restoreJSON} />
              <button className="btn btn-secondary w-full" onClick={() => fileRef.current?.click()} disabled={isRestoring}>
                {isRestoring ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                انتخاب فایل بکاپ و بازیابی
              </button>
              <div className="text-[10px] text-[var(--danger)] mt-2 flex items-center gap-1">
                <AlertTriangle size={12} />
                هشدار: بازیابی بکاپ جایگزین داده‌های فعلی می‌شود.
              </div>
            </div>
          </div>
        </div>

        {/* SQL Backup */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#1e40af] flex items-center justify-center">
              <Database size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">بکاپ پایگاه داده (SQL)</h3>
              <p className="text-xs text-[var(--foreground-muted)]">خروجی pg_dump از PostgreSQL</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-[var(--background-secondary)] rounded-lg text-xs text-[var(--foreground-secondary)]">
              <strong>مزایا:</strong> ساختار کامل جداول، قابل import مستقیم به PostgreSQL، استاندارد صنعتی
            </div>

            <button className="btn btn-primary w-full" onClick={() => downloadSQL('schema')}>
              <FileText size={16} /> دانلود Schema فقط (ساختار جداول)
            </button>

            <button className="btn btn-secondary w-full" onClick={() => downloadSQL('full')}>
              <Database size={16} /> دانلود بکاپ کامل (Schema + Data)
            </button>

            <div className="p-3 bg-[var(--background-secondary)] rounded-lg text-xs">
              <div className="font-bold mb-1">راهنمای بازیابی SQL:</div>
              <code className="block bg-black/30 p-2 rounded text-[10px] text-[var(--gold)]" dir="ltr">
                psql -U postgres -d app_db &lt; backup.sql
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Last Backup Stats */}
      {backupStats && (
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Check size={18} className="text-[var(--success)]" /> جزئیات آخرین بکاپ / بازیابی</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MiniStat label="تجهیزات" value={backupStats.equipment} />
            <MiniStat label="دستور کارها" value={backupStats.workOrders} />
            <MiniStat label="درخواست‌ها" value={backupStats.requests} />
            <MiniStat label="پرسنل" value={backupStats.personnel} />
            <MiniStat label="PM Plans" value={backupStats.pmPlans} />
            <MiniStat label="تامین‌کنندگان" value={backupStats.suppliers} />
            <MiniStat label="قطعات" value={backupStats.spareParts} />
            <MiniStat label="سوابق" value={backupStats.logs} />
            <MiniStat label="اقدامات اصلاحی" value={backupStats.correctiveActions} />
            <MiniStat label="کاربران" value={backupStats.users} />
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="card card-gold">
        <h3 className="font-bold mb-3 flex items-center gap-2"><AlertTriangle size={18} className="text-[var(--gold)]" /> توصیه‌های ایمنی بکاپ</h3>
        <ul className="space-y-2 text-sm text-[var(--foreground-secondary)] list-disc pr-5">
          <li>به صورت هفتگی یک بکاپ JSON و ماهانه یک بکاپ SQL کامل تهیه کنید.</li>
          <li>فایل‌های بکاپ را در محل امن و جدا از سرور اصلی ذخیره کنید (فضای ابری، هارد اکسترنال).</li>
          <li>قبل از هر تغییر بزرگ در سامانه، یک بکاپ تهیه کنید.</li>
          <li>بکاپ‌ها را به صورت دوره‌ای تست کنید تا از صحت بازیابی اطمینان حاصل شود.</li>
          <li>فایل SQL شامل ساختار پایگاه داده است و برای مهاجرت به سرور جدید استفاده می‌شود.</li>
          <li>فایل JSON برای بازیابی سریع داده‌ها در همان سامانه مناسب است.</li>
        </ul>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-1">
        <div style={{ color }}>{icon}</div>
        <span className="text-xs text-[var(--foreground-muted)]">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{toPersianDigits(value)}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-2 rounded bg-[var(--background-secondary)] text-center">
      <div className="text-lg font-bold gold-text">{toPersianDigits(value)}</div>
      <div className="text-[10px] text-[var(--foreground-muted)]">{label}</div>
    </div>
  );
}
