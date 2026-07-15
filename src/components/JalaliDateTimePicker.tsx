'use client';
import React, { useMemo } from 'react';
import { jalaliToGregorian, getJalaliParts, toPersianDigits } from '@/lib/utils';

const JALALI_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

function daysInJalaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // اسفند
  const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(jy % 33);
  return isLeap ? 30 : 29;
}

interface Props {
  value?: string; // ISO string or YYYY-MM-DD or YYYY-MM-DDTHH:mm
  onChange: (iso: string) => void;
  showTime?: boolean;
  className?: string;
  placeholder?: string;
}

export default function JalaliDateTimePicker({ value, onChange, showTime = true, className = '', placeholder }: Props) {
  const parsed = useMemo(() => {
    if (!value) return { jy: 1404, jm: 1, jd: 1, hh: 8, mm: 0 };
    // Parse ISO
    const d = new Date(value);
    if (isNaN(d.getTime())) return { jy: 1404, jm: 1, jd: 1, hh: 8, mm: 0 };
    const { jy, jm, jd } = getJalaliParts(d);
    return { jy, jm, jd, hh: d.getHours(), mm: d.getMinutes() };
  }, [value]);

  const years = useMemo(() => {
    const arr = [];
    for (let y = 1395; y <= 1410; y++) arr.push(y);
    return arr;
  }, []);

  const days = useMemo(() => {
    const max = daysInJalaliMonth(parsed.jy, parsed.jm);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [parsed.jy, parsed.jm]);

  const update = (patch: Partial<typeof parsed>) => {
    const next = { ...parsed, ...patch };
    // Clamp day
    const max = daysInJalaliMonth(next.jy, next.jm);
    if (next.jd > max) next.jd = max;
    const greg = jalaliToGregorian(next.jy, next.jm, next.jd);
    greg.setHours(next.hh, next.mm, 0, 0);
    onChange(greg.toISOString());
  };

  return (
    <div className={`flex gap-1 flex-wrap ${className}`}>
      <select
        className="select !w-auto !text-sm !py-1.5"
        value={parsed.jy}
        onChange={e => update({ jy: Number(e.target.value) })}
      >
        {years.map(y => <option key={y} value={y}>{toPersianDigits(y)}</option>)}
      </select>
      <select
        className="select !w-auto !text-sm !py-1.5"
        value={parsed.jm}
        onChange={e => update({ jm: Number(e.target.value) })}
      >
        {JALALI_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
      </select>
      <select
        className="select !w-auto !text-sm !py-1.5"
        value={parsed.jd}
        onChange={e => update({ jd: Number(e.target.value) })}
      >
        {days.map(d => <option key={d} value={d}>{toPersianDigits(d)}</option>)}
      </select>
      {showTime && (
        <>
          <span className="self-center text-[var(--foreground-muted)]">-</span>
          <select
            className="select !w-auto !text-sm !py-1.5"
            value={parsed.hh}
            onChange={e => update({ hh: Number(e.target.value) })}
          >
            {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{toPersianDigits(String(h).padStart(2, '0'))}</option>)}
          </select>
          <span className="self-center text-[var(--foreground-muted)]">:</span>
          <select
            className="select !w-auto !text-sm !py-1.5"
            value={parsed.mm}
            onChange={e => update({ mm: Number(e.target.value) })}
          >
            {Array.from({ length: 60 }, (_, i) => i).filter((_, i) => i % 5 === 0).map(m => <option key={m} value={m}>{toPersianDigits(String(m).padStart(2, '0'))}</option>)}
          </select>
        </>
      )}
    </div>
  );
}
