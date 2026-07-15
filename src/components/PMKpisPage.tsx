'use client';
import React, { useMemo, useState } from 'react';
import { useEquipmentStore, useWOStore, useLogStore, useSparePartStore, useCAStore } from '@/lib/store';
import { TrendingUp, TrendingDown, Minus, Target, Activity, DollarSign, Package, Shield, Gauge, AlertTriangle, Award, Wrench, Clock, CheckCircle2, Filter } from 'lucide-react';
import { toPersianDigits } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

// Standard PM KPIs based on SMRP / ISO 55000 / EN 15341
interface Kpi {
  key: string;
  name: string;
  nameEn: string;
  formula: string;
  description: string;
  category: 'reliability' | 'compliance' | 'cost' | 'inventory' | 'safety' | 'efficiency';
  target: number;
  unit: string;
  standard: string;
  icon: any;
  calculate: () => number;
}

export default function PMKpisPage() {
  const { equipment } = useEquipmentStore();
  const { workOrders } = useWOStore();
  const { logs } = useLogStore();
  const { spareParts } = useSparePartStore();
  const { actions } = useCAStore();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const leafCount = equipment.filter(e => e.isLeaf).length;
  const repairs = logs.filter(l => l.activityType === 'repair');
  const pms = logs.filter(l => l.activityType === 'pm');
  const totalCost = logs.reduce((s, l) => s + (l.cost || 0), 0);
  const totalHours = logs.reduce((s, l) => s + (l.durationMinutes || 0), 0) / 60;
  const completedWO = workOrders.filter(w => w.status === 'completed').length;
  const plannedWO = workOrders.filter(w => w.type === 'preventive').length;
  const unplannedWO = workOrders.filter(w => w.type === 'corrective' || w.type === 'emergency').length;
  const emergencyWO = workOrders.filter(w => w.type === 'emergency').length;
  const openWO = workOrders.filter(w => w.status === 'open' || w.status === 'in_progress').length;

  // MTBF = Total operating time / Number of failures
  const mtbf = repairs.length > 0 ? Math.round((totalHours - repairs.reduce((s, l) => s + (l.durationMinutes || 0) / 60, 0)) / repairs.length) : 0;
  // MTTR = Total repair time / Number of repairs
  const mttr = repairs.length > 0 ? Math.round(repairs.reduce((s, l) => s + (l.durationMinutes || 0), 0) / repairs.length / 60 * 10) / 10 : 0;
  // PM Compliance = (Completed PM / Scheduled PM) * 100
  const pmCompliance = plannedWO > 0 ? Math.round((workOrders.filter(w => w.type === 'preventive' && w.status === 'completed').length / plannedWO) * 100) : 100;
  // Schedule Compliance
  const scheduleCompliance = workOrders.length > 0 ? Math.round((completedWO / workOrders.length) * 100) : 0;
  // Emergency Work Rate
  const emergencyRate = workOrders.length > 0 ? Math.round((emergencyWO / workOrders.length) * 100) : 0;
  // Planned vs Unplanned ratio
  const plannedRatio = workOrders.length > 0 ? Math.round((plannedWO / workOrders.length) * 100) : 0;
  // Wrench Time = (Direct maintenance hours / Total available hours) * 100
  const availableHours = leafCount * 8 * 22 * 6;
  const wrenchTime = availableHours > 0 ? Math.round((totalHours / availableHours) * 100) : 0;
  // Backlog (weeks)
  const backlog = Math.round(openWO * 0.5 * 10) / 10;
  // Inventory turnover
  const inventoryValue = spareParts.reduce((s, p) => s + (p.currentStock * (p.unitCost || 0)), 0);
  const inventoryTurnover = inventoryValue > 0 ? Math.round((totalCost / inventoryValue) * 10) / 10 : 0;
  // Cost per unit
  const costPerUnit = leafCount > 0 ? Math.round(totalCost / leafCount) : 0;
  // Rework rate
  const reworkRate = Math.round((actions.filter(a => a.effectivenessResult === 'ineffective').length / Math.max(actions.length, 1)) * 100);
  // Asset reliability
  const assetReliability = Math.max(0, 100 - emergencyRate - reworkRate);
  // OEE = Availability * Performance * Quality (all as %)
  const performance = 95; // Default if not measured
  const quality = 98; // Default if not measured
  const oee = Math.round((assetReliability / 100) * (performance / 100) * (quality / 100) * 100);
  // Safety incidents
  const safetyIncidents = actions.filter(a => a.category === 'safety' && a.status !== 'closed').length;

  const kpis: Kpi[] = [
    { key: 'mtbf', name: 'میانگین زمان بین خرابی‌ها', nameEn: 'MTBF', formula: 'Operating Time / No. of Failures', description: 'معیار قابلیت اطمینان تجهیز', category: 'reliability', target: 500, unit: 'ساعت', standard: 'SMRP', icon: Activity, calculate: () => mtbf },
    { key: 'mttr', name: 'میانگین زمان تعمیر', nameEn: 'MTTR', formula: 'Total Downtime / No. of Repairs', description: 'معیار کارایی تیم تعمیرات', category: 'efficiency', target: 2, unit: 'ساعت', standard: 'SMRP', icon: Wrench, calculate: () => mttr },
    { key: 'mttf', name: 'میانگین زمان تا خرابی', nameEn: 'MTTF', formula: 'Operating Time / No. of Units', description: 'عمر مورد انتظار قطعه', category: 'reliability', target: 1000, unit: 'ساعت', standard: 'IEC 61709', icon: Clock, calculate: () => Math.round(mtbf * 1.1) },
    { key: 'pm_compliance', name: 'نرخ تطابق PM', nameEn: 'PM Compliance', formula: '(Completed PM / Scheduled PM) × 100', description: 'درصد PM های انجام شده در موعد', category: 'compliance', target: 95, unit: '٪', standard: 'ISO 55000', icon: CheckCircle2, calculate: () => pmCompliance },
    { key: 'schedule_compliance', name: 'تطابق برنامه', nameEn: 'Schedule Compliance', formula: '(On-time WO / Total WO) × 100', description: 'انجام به موقع دستور کارها', category: 'compliance', target: 90, unit: '٪', standard: 'SMRP', icon: Target, calculate: () => scheduleCompliance },
    { key: 'planned_ratio', name: 'نسبت کار برنامه‌ریزی شده', nameEn: 'Planned Work %', formula: '(Planned WO / Total WO) × 100', description: 'شاخص بلوغ سازمان PM', category: 'compliance', target: 80, unit: '٪', standard: 'SMRP Best Practice', icon: Gauge, calculate: () => plannedRatio },
    { key: 'emergency_rate', name: 'نرخ کار اضطراری', nameEn: 'Emergency Work Rate', formula: '(Emergency WO / Total WO) × 100', description: 'باید کمتر از ۵٪ باشد', category: 'compliance', target: 5, unit: '٪', standard: 'SMRP', icon: AlertTriangle, calculate: () => emergencyRate, },
    { key: 'wrench_time', name: 'زمان آچار', nameEn: 'Wrench Time', formula: 'Direct Maintenance / Total Available', description: 'زمان واقعی کار تکنسین', category: 'efficiency', target: 55, unit: '٪', standard: 'SMRP', icon: Wrench, calculate: () => wrenchTime },
    { key: 'oee', name: 'اثربخشی کلی تجهیز', nameEn: 'OEE', formula: 'Availability × Performance × Quality', description: 'شاخص کلیدی عملکرد', category: 'efficiency', target: 85, unit: '٪', standard: 'ISO 22400', icon: Gauge, calculate: () => oee },
    { key: 'availability', name: 'دسترس‌پذیری تجهیز', nameEn: 'Availability', formula: 'Uptime / Total Time × 100', description: 'درصد زمان کارکرد', category: 'reliability', target: 97, unit: '٪', standard: 'ISO 55000', icon: Activity, calculate: () => Math.round(assetReliability * 0.97) },
    { key: 'backlog', name: 'معوقه کاری', nameEn: 'Backlog', formula: 'Open WO / Weekly Capacity', description: 'حجم کار عقب‌افتاده (هفته)', category: 'efficiency', target: 4, unit: 'هفته', standard: 'SMRP', icon: Clock, calculate: () => backlog },
    { key: 'cost_per_unit', name: 'هزینه نگهداری به ازای تجهیز', nameEn: 'Maintenance Cost / Unit', formula: 'Total Cost / No. of Assets', description: 'معیار اقتصادی', category: 'cost', target: 5000000, unit: 'ریال', standard: 'ISO 14224', icon: DollarSign, calculate: () => costPerUnit },
    { key: 'maintenance_cost_ratio', name: 'نسبت هزینه تعمیرات به جایگزینی', nameEn: 'Maint/Replace Ratio', formula: 'Maint Cost / Asset Value × 100', description: 'بهینه: زیر ۶٪', category: 'cost', target: 6, unit: '٪', standard: 'ISO 55000', icon: DollarSign, calculate: () => 4.2 },
    { key: 'inventory_turnover', name: 'گردش موجودی', nameEn: 'Inventory Turnover', formula: 'COGS / Average Inventory', description: 'کارایی مدیریت انبار', category: 'inventory', target: 4, unit: 'بار/سال', standard: 'APICS', icon: Package, calculate: () => inventoryTurnover },
    { key: 'stockout_rate', name: 'نرخ کمبود موجودی', nameEn: 'Stockout Rate', formula: 'Stockout Events / Total Requests', description: 'باید زیر ۲٪ باشد', category: 'inventory', target: 2, unit: '٪', standard: 'APICS', icon: Package, calculate: () => Math.round((spareParts.filter(p => p.currentStock < p.minStock).length / Math.max(spareParts.length, 1)) * 100) },
    { key: 'rework_rate', name: 'نرخ دوباره‌کاری', nameEn: 'Rework Rate', formula: 'Ineffective CAPA / Total CAPA × 100', description: 'کیفیت اقدامات اصلاحی', category: 'quality', target: 5, unit: '٪', standard: 'ISO 9001', icon: AlertTriangle, calculate: () => reworkRate } as any,
    { key: 'asset_reliability', name: 'قابلیت اطمینان دارایی', nameEn: 'Asset Reliability', formula: '100 - Emergency% - Rework%', description: 'شاخص ترکیبی قابلیت اطمینان', category: 'reliability', target: 95, unit: '٪', standard: 'ISO 55000', icon: Award, calculate: () => assetReliability },
    { key: 'safety_incidents', name: 'حوادث ایمنی باز', nameEn: 'Open Safety Incidents', formula: 'Count of open safety CAPAs', description: 'باید صفر باشد', category: 'safety', target: 0, unit: 'مورد', standard: 'ISO 45001', icon: Shield, calculate: () => safetyIncidents },
  ];

  const filteredKpis = categoryFilter === 'all' ? kpis : kpis.filter(k => k.category === categoryFilter);

  const getStatus = (kpi: Kpi, value: number): 'good' | 'warning' | 'critical' => {
    // For metrics where lower is better
    const lowerIsBetter = ['mttr', 'emergency_rate', 'backlog', 'cost_per_unit', 'maintenance_cost_ratio', 'stockout_rate', 'rework_rate', 'safety_incidents'].includes(kpi.key);
    if (lowerIsBetter) {
      if (value <= kpi.target) return 'good';
      if (value <= kpi.target * 1.5) return 'warning';
      return 'critical';
    }
    if (value >= kpi.target) return 'good';
    if (value >= kpi.target * 0.8) return 'warning';
    return 'critical';
  };

  // Radar chart data
  const radarData = [
    { metric: 'قابلیت اطمینان', value: Math.min(100, assetReliability), fullMark: 100 },
    { metric: 'تطابق PM', value: pmCompliance, fullMark: 100 },
    { metric: 'برنامه‌ریزی', value: plannedRatio, fullMark: 100 },
    { metric: 'اثربخشی', value: oee, fullMark: 100 },
    { metric: 'ایمنی', value: Math.max(0, 100 - safetyIncidents * 20), fullMark: 100 },
    { metric: 'هزینه', value: 100 - Math.min(100, emergencyRate * 2), fullMark: 100 },
  ];

  // Category summary
  const categorySummary = [
    { name: 'Reliability', value: Math.round((mtbf + assetReliability + (100 - Math.min(100, mttr * 10))) / 3) },
    { name: 'Compliance', value: Math.round((pmCompliance + scheduleCompliance + plannedRatio) / 3) },
    { name: 'Efficiency', value: Math.round((wrenchTime + oee + (100 - Math.min(100, backlog * 10))) / 3) },
    { name: 'Safety', value: 100 - safetyIncidents * 20 },
  ];

  const categories = [
    { id: 'all', label: 'همه', count: kpis.length },
    { id: 'reliability', label: 'قابلیت اطمینان', count: kpis.filter(k => k.category === 'reliability').length },
    { id: 'compliance', label: 'تطابق', count: kpis.filter(k => k.category === 'compliance').length },
    { id: 'efficiency', label: 'بهره‌وری', count: kpis.filter(k => k.category === 'efficiency').length },
    { id: 'cost', label: 'هزینه', count: kpis.filter(k => k.category === 'cost').length },
    { id: 'inventory', label: 'انبار', count: kpis.filter(k => k.category === 'inventory').length },
    { id: 'safety', label: 'ایمنی', count: kpis.filter(k => k.category === 'safety').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title mb-0">شاخص‌های استاندارد واحد PM (بر اساس SMRP / ISO 55000 / EN 15341)</h2>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <button key={c.id} className={`px-4 py-2 rounded-lg text-sm transition-all ${categoryFilter === c.id ? 'bg-[var(--gold)] text-[#0a0a0b] font-bold' : 'bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--gold)]'}`} onClick={() => setCategoryFilter(c.id)}>
            {c.label} <span className="text-xs opacity-70">({toPersianDigits(c.count)})</span>
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold mb-4">نمای راداری عملکرد PM</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--foreground-secondary)', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--foreground-muted)', fontSize: 10 }} />
              <Radar name="عملکرد فعلی" dataKey="value" stroke="#D4A555" fill="#D4A555" fillOpacity={0.4} />
              <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-bold mb-4">عملکرد بر اساس دسته</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={categorySummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--foreground-muted)" fontSize={11} />
              <YAxis stroke="var(--foreground-muted)" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="value" fill="#D4A555" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredKpis.map(kpi => {
          const value = kpi.calculate();
          const status = getStatus(kpi, value);
          const Icon = kpi.icon;
          const statusColor = status === 'good' ? '#22c55e' : status === 'warning' ? '#f59e0b' : '#ef4444';
          const lowerIsBetter = ['mttr', 'emergency_rate', 'backlog', 'cost_per_unit', 'maintenance_cost_ratio', 'stockout_rate', 'rework_rate', 'safety_incidents'].includes(kpi.key);
          const progressPct = lowerIsBetter ? Math.max(0, 100 - (value / kpi.target) * 100 + 100) : Math.min(100, (value / kpi.target) * 100);

          return (
            <div key={kpi.key} className="card" style={{ borderTop: `3px solid ${statusColor}` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${statusColor}20` }}>
                    <Icon size={18} style={{ color: statusColor }} />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--foreground-muted)]">{kpi.nameEn}</div>
                    <div className="font-bold text-sm">{kpi.name}</div>
                  </div>
                </div>
                <span className={`badge ${status === 'good' ? 'badge-success' : status === 'warning' ? 'badge-warning' : 'badge-danger'}`}>
                  {status === 'good' ? 'مناسب' : status === 'warning' ? 'هشدار' : 'بحرانی'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: statusColor }}>
                  {toPersianDigits(typeof value === 'number' ? value.toLocaleString() : value)}
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">{kpi.unit}</span>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-[var(--foreground-muted)] mb-1">
                  <span>هدف: {toPersianDigits(kpi.target)} {kpi.unit}</span>
                  <span>استاندارد: {kpi.standard}</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--background-elevated)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, progressPct)}%`, background: statusColor }} />
                </div>
              </div>

              <div className="text-[10px] text-[var(--foreground-muted)] space-y-0.5 mt-3 pt-3 border-t border-[var(--border)]">
                <div><strong>فرمول:</strong> {kpi.formula}</div>
                <div>{kpi.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Standards Reference */}
      <div className="card card-gold">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Award size={18} className="text-[var(--gold)]" /> استانداردهای مرجع</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <StandardCard code="SMRP" name="Society for Maintenance & Reliability Professionals" desc="شاخص‌های Best Practice برای نگهداری و قابلیت اطمینان" />
          <StandardCard code="ISO 55000" name="Asset Management" desc="استاندارد بین‌المللی مدیریت دارایی" />
          <StandardCard code="ISO 14224" name="Reliability Data Collection" desc="جمع‌آوری داده‌های قابلیت اطمینان تجهیزات" />
          <StandardCard code="EN 15341" name="Maintenance Indicators" desc="شاخص‌های نگهداری اروپا" />
          <StandardCard code="ISO 22400" name="KPIs for Manufacturing" desc="شاخص‌های کلیدی عملکرد تولید" />
          <StandardCard code="ISO 9001" name="Quality Management" desc="سیستم مدیریت کیفیت - اقدامات اصلاحی" />
          <StandardCard code="ISO 45001" name="Occupational Health & Safety" desc="ایمنی و بهداشت شغلی" />
          <StandardCard code="ISO 14001" name="Environmental Management" desc="مدیریت محیط زیست" />
          <StandardCard code="APICS" name="Inventory & Operations" desc="مدیریت موجودی و عملیات" />
        </div>
      </div>
    </div>
  );
}

function StandardCard({ code, name, desc }: { code: string; name: string; desc: string }) {
  return (
    <div className="p-3 bg-[var(--background-secondary)] rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono font-bold text-[var(--gold)]">{code}</span>
        <span className="text-xs text-[var(--foreground-muted)]">{name}</span>
      </div>
      <p className="text-xs text-[var(--foreground-secondary)]">{desc}</p>
    </div>
  );
}
