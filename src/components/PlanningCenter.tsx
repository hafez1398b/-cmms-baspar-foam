'use client';
import React, { useState, useMemo } from 'react';
import { usePMStore, useEquipmentStore, useLogStore, useWOStore, usePersonnelStore, useEquipmentPassportStore } from '@/lib/store';
import { formatJalali, toPersianDigits, getJalaliParts, jalaliToGregorian, frequencyLabels, workOrderStatusMap, priorityMap, daysInJalaliMonth } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, User as UserIcon, Wrench, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function PlanningCenter() {
  const { pmPlans } = usePMStore();
  const { pmPlansFull } = useEquipmentPassportStore();
  const { equipment } = useEquipmentStore();
  const { logs } = useLogStore();
  const { workOrders } = useWOStore();
  const { personnel } = usePersonnelStore();
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const jalali = useMemo(() => getJalaliParts(viewDate), [viewDate]);
  const { jy, jm } = jalali;
  const monthName = getJalaliMonthName(jm);

  const calendarCells = useMemo(() => {
    try {
      const firstDayGreg = jalaliToGregorian(jy, jm, 1);
      // Weekday: 0=Sun, 6=Sat. Persian week starts Saturday -> we want index 0=Sat
      const weekday = (firstDayGreg.getDay() + 1) % 7;
      const dim = daysInJalaliMonth(jy, jm);
      const prevM = jm === 1 ? 12 : jm - 1;
      const prevY = jm === 1 ? jy - 1 : jy;
      const prevDim = daysInJalaliMonth(prevY, prevM);

      const cells: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];

      for (let i = 0; i < weekday; i++) {
        const d = prevDim - weekday + 1 + i;
        cells.push({ day: d, isCurrentMonth: false, date: jalaliToGregorian(prevY, prevM, d) });
      }
      for (let d = 1; d <= dim; d++) {
        cells.push({ day: d, isCurrentMonth: true, date: jalaliToGregorian(jy, jm, d) });
      }
      let nd = 1;
      const nextM = jm === 12 ? 1 : jm + 1;
      const nextY = jm === 12 ? jy + 1 : jy;
      while (cells.length < 42) {
        cells.push({ day: nd, isCurrentMonth: false, date: jalaliToGregorian(nextY, nextM, nd) });
        nd++;
      }
      return cells;
    } catch (err) {
      console.error('Calendar error:', err);
      return [];
    }
  }, [jy, jm]);

  const navigateMonth = (delta: number) => {
    let newJm = jm + delta;
    let newJy = jy;
    if (newJm > 12) { newJm = 1; newJy++; }
    if (newJm < 1) { newJm = 12; newJy--; }
    setViewDate(jalaliToGregorian(newJy, newJm, 1));
    setSelectedDate(null);
  };

  const goToday = () => {
    setViewDate(new Date());
    setSelectedDate(null);
  };

  const getItemsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = logs.filter(l => l.performedDate === dateStr);
    const dayWO = workOrders.filter(w => w.scheduledDate === dateStr || w.dueDate === dateStr);
    const dayPMs = pmPlansFull.filter(p => p.nextDue === dateStr && p.isActive);
    const isToday = dateStr === todayStr;
    // PM های معوق (nextDue گذشته) - فقط امروز نمایش بده
    const overduePMs = isToday ? pmPlansFull.filter(p => p.isActive && p.nextDue && p.nextDue < dateStr) : [];
    return { logs: dayLogs, workOrders: dayWO, pmPlans: dayPMs, overduePMs };
  };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : null;

  const personnelMap = useMemo(() => {
    const m = new Map<number, string>();
    personnel.forEach(p => m.set(p.id, p.fullName));
    return m;
  }, [personnel]);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn btn-secondary !p-2" onClick={() => navigateMonth(-1)}><ChevronRight size={18} /></button>
            <button className="btn btn-secondary !px-4" onClick={goToday}>امروز</button>
            <button className="btn btn-secondary !p-2" onClick={() => navigateMonth(1)}><ChevronLeft size={18} /></button>
            <h2 className="text-lg font-bold mr-4 gold-text">
              {monthName} {toPersianDigits(jy)}
            </h2>
          </div>
          <div className="flex gap-1 p-1 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)]">
            {(['month', 'week', 'day'] as const).map(m => (
              <button key={m} className={`px-3 py-1 rounded text-xs transition-colors ${viewMode === m ? 'bg-[var(--gold)] text-[#0a0a0b] font-bold' : 'text-[var(--foreground-muted)]'}`} onClick={() => setViewMode(m)}>
                {m === 'month' ? 'ماه' : m === 'week' ? 'هفته' : 'روز'}
              </button>
            ))}
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => (
            <div key={d} className="text-center text-xs font-bold text-[var(--gold)] py-2">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        {calendarCells.length > 0 ? (
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const dateStr = cell.date.toISOString().split('T')[0];
              const { logs: dayLogs, workOrders: dayWO, pmPlans: dayPMs, overduePMs } = getItemsForDate(cell.date);
              const totalItems = dayLogs.length + dayWO.length + dayPMs.length + overduePMs.length;
              const hasOverdue = overduePMs.length > 0;
              const isToday = dateStr === todayStr;
              const isSelected = selectedDate && dateStr === selectedDate.toISOString().split('T')[0];
              const isWeekend = (idx % 7) === 6;

              return (
                <div
                  key={idx}
                  className={`min-h-[60px] md:min-h-[90px] p-1 md:p-2 rounded-lg border cursor-pointer transition-all text-xs
                    ${cell.isCurrentMonth ? 'bg-[var(--background-secondary)]' : 'bg-[var(--background)] opacity-50'}
                    ${isToday ? 'border-[var(--gold)] ring-2 ring-[var(--gold)]/20' : 'border-[var(--border)]'}
                    ${isSelected ? 'bg-[rgba(212,165,85,0.1)] border-[var(--gold)]' : 'hover:border-[var(--gold-dark)]'}
                    ${isWeekend ? 'bg-[rgba(239,68,68,0.03)]' : ''}
                  `}
                  onClick={() => setSelectedDate(cell.date)}
                >
                  <div className={`font-bold text-xs md:text-sm mb-0.5 md:mb-1 ${isToday ? 'text-[var(--gold)]' : ''} ${!cell.isCurrentMonth ? 'text-[var(--foreground-muted)]' : ''}`}>
                    {toPersianDigits(cell.day)}
                  </div>
                  <div className={`space-y-1 hidden md:block ${hasOverdue ? 'ring-2 ring-[var(--danger)] ring-offset-1 ring-offset-[var(--background-secondary)] rounded' : ''}`}>
                    {overduePMs.slice(0, 1).map(pm => (
                      <div key={pm.id} className="truncate px-1 py-0.5 rounded text-[10px] bg-[rgba(239,68,68,0.25)] text-[var(--danger)] font-bold" title={`معوق: ${pm.title}`}>
                        ⚠️ {pm.title.slice(0, 12)}
                      </div>
                    ))}
                    {dayPMs.slice(0, 1).map(pm => (
                      <div key={pm.id} className="truncate px-1 py-0.5 rounded text-[10px] bg-[rgba(34,197,94,0.2)] text-[var(--success)]" title={`PM: ${pm.title}`}>
                        ✓ {pm.title.slice(0, 12)}
                      </div>
                    ))}
                    {dayLogs.slice(0, 1).map(log => (
                      <div key={log.id} className="truncate px-1 py-0.5 rounded text-[10px] bg-[rgba(212,165,85,0.2)] text-[var(--gold)]" title={log.title}>
                        {log.activityType === 'pm' ? 'PM' : 'تعمیر'}: {log.title.slice(0, 10)}
                      </div>
                    ))}
                    {dayWO.slice(0, 1).map(wo => (
                      <div key={wo.id} className="truncate px-1 py-0.5 rounded text-[10px] bg-[rgba(59,130,246,0.2)] text-[var(--info)]" title={wo.title}>
                        {wo.title.slice(0, 12)}
                      </div>
                    ))}
                    {totalItems > 4 && (
                      <div className="text-[10px] text-[var(--foreground-muted)]">+{toPersianDigits(totalItems - 4)}</div>
                    )}
                  </div>
                  {totalItems > 0 && (
                    <div className="md:hidden flex gap-0.5 flex-wrap">
                      {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" />}
                      {dayPMs.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />}
                      {dayLogs.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />}
                      {dayWO.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)]" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--foreground-muted)]">خطا در بارگذاری تقویم. لطفاً صفحه را مجدداً بارگذاری کنید.</div>
        )}
      </div>

      {/* Selected day details */}
      {selectedDate && selectedItems && (
        <div className="card fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <CalIcon size={18} className="text-[var(--gold)]" />
              جزئیات کارهای {formatJalali(selectedDate, 'yyyy/MM/dd')}
            </h3>
            <button className="btn btn-ghost !p-2" onClick={() => setSelectedDate(null)}><X size={16} /></button>
          </div>
          {selectedItems.workOrders.length === 0 && selectedItems.logs.length === 0 ? (
            <div className="text-center py-8 text-[var(--foreground-muted)]">
              هیچ کار یا سابقه‌ای برای این روز ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedItems.workOrders.map(wo => {
                const eq = equipment.find(e => e.id === wo.equipmentId);
                return (
                  <div key={wo.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <Wrench size={14} className="text-[var(--info)]" />
                          {wo.woNumber}: {wo.title}
                        </div>
                        {eq && <div className="text-xs text-[var(--foreground-muted)] mt-1">تجهیز: {eq.name}</div>}
                      </div>
                      <span className={`badge ${workOrderStatusMap[wo.status]?.class}`}>{workOrderStatusMap[wo.status]?.label || wo.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--foreground-secondary)]">
                      <span className="flex items-center gap-1"><Clock size={12} /> {wo.scheduledDate ? formatJalali(wo.scheduledDate) : '-'}</span>
                      <span className="flex items-center gap-1"><UserIcon size={12} /> {wo.assignedTo ? personnelMap.get(wo.assignedTo) : 'تخصیص داده نشده'}</span>
                      <span className={`badge ${priorityMap[wo.priority]?.class}`}>{priorityMap[wo.priority]?.label || wo.priority}</span>
                    </div>
                    {wo.description && <p className="text-xs mt-2 text-[var(--foreground-muted)] leading-relaxed">{wo.description}</p>}
                  </div>
                );
              })}
              {selectedItems.logs.map(log => {
                const eq = equipment.find(e => e.id === log.equipmentId);
                return (
                  <div key={log.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {log.outcome === 'successful' ? <CheckCircle2 size={14} className="text-[var(--success)]" /> : <AlertCircle size={14} className="text-[var(--warning)]" />}
                          {log.title}
                        </div>
                        {eq && <div className="text-xs text-[var(--foreground-muted)] mt-1">تجهیز: {eq.name}</div>}
                      </div>
                      <span className={`badge ${log.activityType === 'pm' ? 'badge-gold' : log.activityType === 'repair' ? 'badge-danger' : 'badge-info'}`}>
                        {log.activityType === 'pm' ? 'PM' : log.activityType === 'repair' ? 'تعمیر' : 'بازرسی'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--foreground-secondary)]">
                      <span className="flex items-center gap-1"><UserIcon size={12} /> {log.performedBy || '-'}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {toPersianDigits(log.durationMinutes || 0)} دقیقه</span>
                    </div>
                    {log.notes && <p className="text-xs mt-2 text-[var(--foreground-muted)] leading-relaxed">{log.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getJalaliMonthName(m: number): string {
  const names = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  return names[m - 1] || '';
}
