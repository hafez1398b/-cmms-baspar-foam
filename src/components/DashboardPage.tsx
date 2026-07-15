'use client';
import React from 'react';
import { useUIStore, useEquipmentStore, useWOStore, useMRStore, useLogStore } from '@/lib/store';
import { Wrench, AlertTriangle, CheckCircle2, Clock as ClockIcon, TrendingUp, Package, Users, Activity, Factory, FileText, Hammer, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { toPersianDigits, formatJalali, getJalaliParts } from '@/lib/utils';

export default function DashboardPage() {
  const { setCurrentPage, setPageTitle } = useUIStore();
  const { equipment } = useEquipmentStore();
  const { workOrders } = useWOStore();
  const { requests } = useMRStore();
  const { logs } = useLogStore();

  const leafCount = equipment.filter(e => e.isLeaf).length;
  const activeWO = workOrders.filter(w => w.status === 'in_progress').length;
  const openWO = workOrders.filter(w => w.status === 'open').length;
  const completedWO = workOrders.filter(w => w.status === 'completed').length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;

  const goTo = (page: string, title: string) => {
    setCurrentPage(page);
    setPageTitle(title);
  };

  // Monthly trend data for last 6 months (mock based on logs)
  const trendData = React.useMemo(() => {
    const months: Record<string, { name: string; pm: number; repair: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const { jy, jm } = getJalaliParts(d);
      const key = `${jy}-${String(jm).padStart(2, '0')}`;
      months[key] = { name: `${jy}/${String(jm).padStart(2, '0')}`, pm: 0, repair: 0 };
    }
    logs.forEach(log => {
      const d = new Date(log.performedDate);
      const { jy, jm } = getJalaliParts(d);
      const key = `${jy}-${String(jm).padStart(2, '0')}`;
      if (months[key]) {
        if (log.activityType === 'pm') months[key].pm++;
        else if (log.activityType === 'repair') months[key].repair++;
      }
    });
    return Object.values(months);
  }, [logs]);

  // Status breakdown
  const statusData = [
    { name: 'باز', value: openWO, color: '#3b82f6' },
    { name: 'در حال انجام', value: activeWO, color: '#f59e0b' },
    { name: 'تکمیل شده', value: completedWO, color: '#22c55e' },
  ];

  const stats = [
    { label: 'کل تجهیزات', value: toPersianDigits(leafCount), icon: Factory, page: 'equipment', title: 'درخت تجهیزات', color: 'from-blue-500/20 to-blue-600/5', iconColor: '#3b82f6' },
    { label: 'دستور کارهای باز', value: toPersianDigits(openWO), icon: Wrench, page: 'workorders', title: 'دستور کارها', color: 'from-amber-500/20 to-amber-600/5', iconColor: '#f59e0b' },
    { label: 'در حال انجام', value: toPersianDigits(activeWO), icon: Activity, page: 'workorders', title: 'دستور کارها', color: 'from-orange-500/20 to-orange-600/5', iconColor: '#f97316' },
    { label: 'تکمیل شده', value: toPersianDigits(completedWO), icon: CheckCircle2, page: 'workorders', title: 'دستور کارها', color: 'from-green-500/20 to-green-600/5', iconColor: '#22c55e' },
    { label: 'درخواست‌های در انتظار', value: toPersianDigits(pendingRequests), icon: FileText, page: 'requests', title: 'درخواست تعمیرات', color: 'from-red-500/20 to-red-600/5', iconColor: '#ef4444' },
    { label: 'سوابق ثبت شده', value: toPersianDigits(logs.length), icon: BarChart3, page: 'reports', title: 'گزارشات', color: 'from-purple-500/20 to-purple-600/5', iconColor: '#a855f7' },
  ];

  // Equipment by status
  const statusByEq = [
    { name: 'فعال', value: equipment.filter(e => e.status === 'active' && e.isLeaf).length, color: '#22c55e' },
    { name: 'در دست تعمیر', value: equipment.filter(e => e.status === 'under_repair').length, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="stat-card" onClick={() => goTo(s.page, s.title)}>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <Icon size={20} style={{ color: s.iconColor }} />
              </div>
              <div className="text-2xl font-bold gold-text">{s.value}</div>
              <div className="text-xs text-[var(--foreground-muted)] mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="lg:col-span-2 card">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-[var(--gold)]" /> روند فعالیت‌های نگهداری (۶ ماه اخیر)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--foreground-muted)" fontSize={12} />
              <YAxis stroke="var(--foreground-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="pm" name="PM" fill="#D4A555" radius={[4, 4, 0, 0]} />
              <Bar dataKey="repair" name="تعمیرات" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* WO Status pie */}
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2"><PieChartIcon /> وضعیت دستور کارها</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <h3 className="font-bold mb-4 flex items-center gap-2"><ClockIcon size={18} className="text-[var(--gold)]" /> آخرین سوابق نگهداری</h3>
        <div className="space-y-2">
          {logs.slice(-8).reverse().map(log => {
            const eq = equipment.find(e => e.id === log.equipmentId);
            return (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-secondary)]">
                <div className={`w-2 h-2 rounded-full ${log.activityType === 'pm' ? 'bg-[var(--gold)]' : 'bg-[var(--danger)]'}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{log.title}</div>
                  <div className="text-xs text-[var(--foreground-muted)]">{eq?.name} - {eq?.location || ''}</div>
                </div>
                <div className="text-xs text-[var(--foreground-muted)]">{formatJalali(log.performedDate)}</div>
                <span className={`badge ${log.activityType === 'pm' ? 'badge-gold' : 'badge-danger'}`}>
                  {log.activityType === 'pm' ? 'PM' : 'تعمیر'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PieChartIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[var(--gold)]"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>;
}
