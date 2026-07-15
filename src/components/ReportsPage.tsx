'use client';
import React, { useMemo, useState } from 'react';
import { useEquipmentStore, useWOStore, useLogStore, usePersonnelStore } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { toPersianDigits, formatJalali, getJalaliParts, exportToExcel } from '@/lib/utils';
import { Download, FileSpreadsheet, TrendingUp, BarChart3, Activity, Clock, AlertTriangle, Wrench, CheckCircle2, Filter } from 'lucide-react';

export default function ReportsPage() {
  const { equipment } = useEquipmentStore();
  const { logs } = useLogStore();
  const { personnel } = usePersonnelStore();
  const [period, setPeriod] = useState<'all' | '3m' | '6m' | '1y'>('all');

  // Filter logs by period
  const filteredLogs = useMemo(() => {
    const now = new Date();
    let cutoff = new Date(2026, 2, 21); // 1405/01/01
    if (period === '3m') cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    if (period === '6m') cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    if (period === '1y') cutoff = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    return logs.filter(l => new Date(l.performedDate) >= cutoff);
  }, [logs, period]);

  // Monthly data
  const monthlyData = useMemo(() => {
    const months: Record<string, { name: string; pm: number; repair: number; inspection: number; cost: number }> = {};
    filteredLogs.forEach(log => {
      const d = new Date(log.performedDate);
      const { jy, jm } = getJalaliParts(d);
      const key = `${jy}-${String(jm).padStart(2, '0')}`;
      if (!months[key]) months[key] = { name: `${jy}/${String(jm).padStart(2, '0')}`, pm: 0, repair: 0, inspection: 0, cost: 0 };
      if (log.activityType === 'pm') months[key].pm++;
      else if (log.activityType === 'repair') months[key].repair++;
      else months[key].inspection++;
      months[key].cost += (log.cost || 0);
    });
    return Object.values(months).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredLogs]);

  // By equipment
  const byEquipment = useMemo(() => {
    const eqMap = new Map<number, { name: string; count: number; repairs: number }>();
    filteredLogs.forEach(log => {
      if (!eqMap.has(log.equipmentId)) {
        const eq = equipment.find(e => e.id === log.equipmentId);
        eqMap.set(log.equipmentId, { name: eq?.name || 'نامشخص', count: 0, repairs: 0 });
      }
      const d = eqMap.get(log.equipmentId)!;
      d.count++;
      if (log.activityType === 'repair') d.repairs++;
    });
    return Array.from(eqMap.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredLogs, equipment]);

  // KPIs
  const totalLogs = filteredLogs.length;
  const totalPM = filteredLogs.filter(l => l.activityType === 'pm').length;
  const totalRepairs = filteredLogs.filter(l => l.activityType === 'repair').length;
  const totalCost = filteredLogs.reduce((sum, l) => sum + (l.cost || 0), 0);
  const avgDuration = totalLogs > 0 ? Math.round(filteredLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0) / totalLogs) : 0;
  const pmRatio = totalLogs > 0 ? Math.round((totalPM / totalLogs) * 100) : 0;

  const activityPie = [
    { name: 'PM', value: totalPM, color: '#D4A555' },
    { name: 'تعمیرات', value: totalRepairs, color: '#ef4444' },
    { name: 'بازرسی', value: totalLogs - totalPM - totalRepairs, color: '#3b82f6' },
  ];

  const exportLogs = () => {
    exportToExcel(filteredLogs.map(l => ({
      ...l,
      equipmentName: equipment.find(e => e.id === l.equipmentId)?.name || '',
    })), 'maintenance-logs', [
      { key: 'title', label: 'عنوان' },
      { key: 'equipmentName', label: 'تجهیز' },
      { key: 'activityType', label: 'نوع' },
      { key: 'performedBy', label: 'انجام‌دهنده' },
      { key: 'performedDate', label: 'تاریخ' },
      { key: 'durationMinutes', label: 'مدت (دقیقه)' },
      { key: 'cost', label: 'هزینه' },
      { key: 'outcome', label: 'نتیجه' },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title mb-0">گزارشات و تحلیل هوشمند</h2>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)]">
            {[
              { id: 'all', label: 'همه' },
              { id: '3m', label: '۳ ماه' },
              { id: '6m', label: '۶ ماه' },
              { id: '1y', label: '۱ سال' },
            ].map(p => (
              <button key={p.id} className={`px-3 py-1 rounded text-xs transition-colors ${period === p.id ? 'bg-[var(--gold)] text-[#0a0a0b] font-bold' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`} onClick={() => setPeriod(p.id as any)}>
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={exportLogs}><Download size={16} /> خروجی اکسل</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KpiCard icon={<Activity size={20} />} label="کل فعالیت‌ها" value={toPersianDigits(totalLogs)} color="#D4A555" />
        <KpiCard icon={<CheckCircle2 size={20} />} label="کل PM" value={toPersianDigits(totalPM)} color="#22c55e" />
        <KpiCard icon={<Wrench size={20} />} label="کل تعمیرات" value={toPersianDigits(totalRepairs)} color="#ef4444" />
        <KpiCard icon={<BarChart3 size={20} />} label="نرخ PM" value={`${toPersianDigits(pmRatio)}٪`} color="#3b82f6" />
        <KpiCard icon={<Clock size={20} />} label="میانگین مدت" value={`${toPersianDigits(avgDuration)} دقیقه`} color="#a855f7" />
        <KpiCard icon={<TrendingUp size={20} />} label="هزینه کل" value={`${toPersianDigits((totalCost / 1000000).toFixed(1))}M`} color="#f97316" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend */}
        <div className="lg:col-span-2 card">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-[var(--gold)]" /> روند ماهانه فعالیت‌ها</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorPM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A555" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#D4A555" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRepair" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--foreground-muted)" fontSize={11} />
              <YAxis stroke="var(--foreground-muted)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="pm" name="PM" stroke="#D4A555" fillOpacity={1} fill="url(#colorPM)" />
              <Area type="monotone" dataKey="repair" name="تعمیرات" stroke="#ef4444" fillOpacity={1} fill="url(#colorRepair)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity type pie */}
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2"><PieChartIcon /> توزیع نوع فعالیت</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={activityPie} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                {activityPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top equipment */}
      <div className="card">
        <h3 className="font-bold mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-[var(--warning)]" /> ۱۰ تجهیز با بیشترین فعالیت</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byEquipment} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--foreground-muted)" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="var(--foreground-muted)" fontSize={11} width={150} />
            <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="repairs" name="تعمیرات" fill="#ef4444" radius={[0, 4, 4, 0]} />
            <Bar dataKey="count" name="کل" fill="#D4A555" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost trend */}
      <div className="card">
        <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-[var(--gold)]" /> روند هزینه‌های نگهداری (ریال)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--foreground-muted)" fontSize={11} />
            <YAxis stroke="var(--foreground-muted)" fontSize={11} tickFormatter={v => `${Math.round(v / 1000000)}M`} />
            <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v: any) => `${Number(v).toLocaleString()} ریال`} />
            <Line type="monotone" dataKey="cost" name="هزینه" stroke="#D4A555" strokeWidth={2} dot={{ fill: '#D4A555', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights */}
      <div className="card card-gold">
        <h3 className="font-bold mb-4 flex items-center gap-2"><SparklesIcon /> تحلیل هوشمند AI</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-[var(--success)] mt-1 shrink-0" />
            <p>شاخص نرخ PM به کل <strong className="text-[var(--gold)]">{toPersianDigits(pmRatio)}٪</strong> است. نسبت مناسب PM به تعمیرات اصلاحی باید حدود ۸۰٪ باشد.</p>
          </div>
          {totalRepairs > totalPM * 0.3 && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-[var(--warning)] mt-1 shrink-0" />
              <p>تعداد تعمیرات اصلاحی نسبت به PM بالاست. توصیه می‌شود تناوب بازدیدها برای تجهیزات پرتعمیر کاهش یابد.</p>
            </div>
          )}
          <div className="flex items-start gap-2">
            <TrendingUp size={16} className="text-[var(--info)] mt-1 shrink-0" />
            <p>بر اساس روند ماهانه، پیش‌بینی می‌شود هزینه نگهداری ماه آینده حدود {toPersianDigits(Math.round((totalCost / Math.max(monthlyData.length, 1)) / 1000000))} میلیون ریال باشد.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: `${color}20` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{label}</div>
    </div>
  );
}

function PieChartIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[var(--gold)]"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>;
}

function SparklesIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[var(--gold)]"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>;
}
