import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ========== JALALI DATE UTILITIES (jalaali-js) ==========
import * as jalaali from 'jalaali-js';

export function isLeapJalali(jy: number): boolean {
  return jalaali.isLeapJalaaliYear(jy);
}

export function toJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  return jalaali.toJalaali(gy, gm, gd);
}

export function toGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return jalaali.toGregorian(jy, jm, jd);
}

export function getJalaliParts(date: Date): { jy: number; jm: number; jd: number } {
  try {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return { jy: 1404, jm: 1, jd: 1 };
    }
    return toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  } catch {
    return { jy: 1404, jm: 1, jd: 1 };
  }
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

export function formatJalali(date: Date | string | null | undefined, fmt: string = 'yyyy/MM/dd'): string {
  try {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return '';
    const { jy, jm, jd } = getJalaliParts(d);
    return fmt
      .replace('yyyy', String(jy))
      .replace('MM', String(jm).padStart(2, '0'))
      .replace('dd', String(jd).padStart(2, '0'))
      .replace('HH', String(d.getHours()).padStart(2, '0'))
      .replace('mm', String(d.getMinutes()).padStart(2, '0'));
  } catch {
    return '';
  }
}

export function formatJalaliDateTime(date: Date | string | null | undefined): string {
  return formatJalali(date, 'yyyy/MM/dd HH:mm');
}

export function addDaysDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonthsJalali(date: Date, months: number): Date {
  const { jy, jm, jd } = getJalaliParts(date);
  let newJm = jm + months;
  let newJy = jy;
  while (newJm > 12) { newJm -= 12; newJy += 1; }
  while (newJm < 1) { newJm += 12; newJy -= 1; }
  const maxDay = newJm <= 6 ? 31 : (newJm === 12 && !isLeapJalali(newJy) ? 29 : 30);
  return jalaliToGregorian(newJy, newJm, Math.min(jd, maxDay));
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)));
}

export function getCurrentJalaliDate(): string {
  return formatJalali(new Date());
}

export function daysInJalaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalali(jy) ? 30 : 29;
}

// ========== IDS & FORMATTING ==========
export function generateId(prefix: string = 'WO'): string {
  const now = new Date();
  const { jy, jm } = getJalaliParts(now);
  const year = String(jy).slice(-2);
  const month = String(jm).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${year}${month}${rand}`;
}

export const toPersianDigits = (input: string | number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// ========== EXPORT ==========
export async function exportToExcel(data: any[], filename: string, columns?: { key: string; label: string }[]) {
  const XLSX = await import('xlsx');
  let exportData = data;
  if (columns && columns.length > 0) {
    exportData = data.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach(col => {
        const val = row[col.key];
        obj[col.label] = typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
      });
      return obj;
    });
  }
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function printContent(title: string, htmlContent: string) {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Tahoma, sans-serif; padding: 20px; font-size: 12pt; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #999; padding: 8px; text-align: right; }
            th { background: #eee; }
            h1, h2 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${htmlContent}
          <script>window.onload=function(){window.print();}</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}

// ========== STATUS MAPS ==========
export const workOrderStatusMap: Record<string, { label: string; class: string }> = {
  open: { label: 'باز', class: 'badge-info' },
  in_progress: { label: 'در حال انجام', class: 'badge-warning' },
  on_hold: { label: 'در انتظار', class: 'badge-neutral' },
  completed: { label: 'تکمیل شده', class: 'badge-success' },
  cancelled: { label: 'لغو شده', class: 'badge-danger' },
};

export const priorityMap: Record<string, { label: string; class: string }> = {
  low: { label: 'کم', class: 'badge-neutral' },
  medium: { label: 'متوسط', class: 'badge-info' },
  high: { label: 'زیاد', class: 'badge-warning' },
  critical: { label: 'بحرانی', class: 'badge-danger' },
};

export const requestStatusMap: Record<string, { label: string; class: string }> = {
  pending: { label: 'در انتظار بررسی', class: 'badge-warning' },
  reviewed: { label: 'بررسی شده', class: 'badge-info' },
  approved: { label: 'تایید شده', class: 'badge-success' },
  converted: { label: 'تبدیل به دستورکار', class: 'badge-gold' },
  rejected: { label: 'رد شده', class: 'badge-danger' },
};

export const leaveStatusMap: Record<string, { label: string; class: string }> = {
  pending: { label: 'در انتظار', class: 'badge-warning' },
  approved: { label: 'تایید شده', class: 'badge-success' },
  rejected: { label: 'رد شده', class: 'badge-danger' },
};

export const attendanceStatusMap: Record<string, { label: string; class: string }> = {
  present: { label: 'حاضر', class: 'badge-success' },
  absent: { label: 'غایب', class: 'badge-danger' },
  leave: { label: 'مرخصی', class: 'badge-warning' },
  half_day: { label: 'نیم روز', class: 'badge-info' },
  holiday: { label: 'تعطیل', class: 'badge-neutral' },
};

export const equipmentStatusMap: Record<string, { label: string; class: string }> = {
  active: { label: 'فعال', class: 'badge-success' },
  inactive: { label: 'غیرفعال', class: 'badge-neutral' },
  under_repair: { label: 'در دست تعمیر', class: 'badge-warning' },
  decommissioned: { label: 'از کار افتاده', class: 'badge-danger' },
};

export const nodeTypeLabels: Record<string, string> = {
  factory: 'کارخانه',
  site: 'سایت',
  unit: 'واحد',
  line: 'خط تولید',
  machine: 'دستگاه',
  component: 'زیرتجهیز',
};

// ========== TREE HELPERS ==========
export interface TreeNode {
  id: number;
  name: string;
  parentId: number | null;
  children?: TreeNode[];
  [key: string]: any;
}

export function buildTree<T extends TreeNode>(items: T[]): (T & { children: T[] })[] {
  const itemMap = new Map<number, any>();
  const roots: any[] = [];
  items.forEach(item => { itemMap.set(item.id, { ...item, children: [] }); });
  itemMap.forEach(item => {
    if (item.parentId && itemMap.has(item.parentId)) {
      itemMap.get(item.parentId).children.push(item);
    } else {
      roots.push(item);
    }
  });
  return roots;
}

export function flattenTree<T extends TreeNode>(nodes: (T & { children: T[] })[], result: T[] = []): T[] {
  nodes.forEach(node => {
    result.push(node);
    if (node.children?.length) flattenTree(node.children as any, result);
  });
  return result;
}

// ========== FREQUENCY ==========
export const frequencyLabels: Record<string, string> = {
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
  quarterly: 'فصلی',
  yearly: 'سالانه',
};

// ========== SMART FIELD MAPPING ==========
export interface FieldMapping {
  key: string;
  label: string;
  aliases: string[];
}

export const commonEquipmentFields: FieldMapping[] = [
  { key: 'rowNumber', label: 'ردیف', aliases: ['ردیف', '#', 'no', 'number', 'رديف'] },
  { key: 'name', label: 'نام دستگاه', aliases: ['نام دستگاه', 'نام تجهیز', 'نام', 'نام تجهيز', 'نام دستگاه', 'device', 'equipment', 'name'] },
  { key: 'model', label: 'مدل', aliases: ['مدل', 'model', 'type', 'نوع', '(type)', 'type)'] },
  { key: 'serialNumber', label: 'شماره سریال', aliases: ['شماره سریال', 'سریال', 'serial', 'serial number', 'شماره سری'] },
  { key: 'pmCode', label: 'کد PM', aliases: ['کد pm', 'کد pm / کد تجهیز', 'pm code', 'کد تعمیرات', 'کد تجهیز'] },
  { key: 'feCode', label: 'شماره شناسنامه', aliases: ['شماره شناسنامه', 'شناسنامه', 'fe code', 'کد شناسایی'] },
  { key: 'manufacturer', label: 'سازنده', aliases: ['سازنده', 'manufacturer', 'برند', 'brand', 'سازنده'] },
  { key: 'country', label: 'کشور سازنده', aliases: ['کشور', 'کشور سازنده', 'country', 'origin', 'ساخت'] },
  { key: 'location', label: 'محل استفاده', aliases: ['محل استفاده', 'محل', 'محل نصب', 'location', 'محل استقرار'] },
  { key: 'authorizedPersonnel', label: 'سمت مجاز به کار', aliases: ['سمت مجاز', 'سمت مجاز به کار', 'اپراتور', 'متصدي', 'سمت مجاز'] },
  { key: 'calibrationPeriod', label: 'دوره کالیبراسیون', aliases: ['دوره کالیبراسیون', 'کالیبراسیون', 'calibration', 'دوره کاليبراسيون'] },
  { key: 'calibrationType', label: 'نوع کالیبراسیون', aliases: ['نوع کالیبراسیون', 'نوع کاليبراسيون'] },
  { key: 'hasPM', label: 'PM', aliases: ['pm', 'PM', 'وضعیت pm'] },
  { key: 'pcRequired', label: 'PC', aliases: ['pc', 'PC'] },
  { key: 'ncrRequired', label: 'NCR', aliases: ['ncr', 'NCR'] },
  { key: 'cbuRequired', label: 'CBU', aliases: ['cbu', 'CBU'] },
  { key: 'capacity', label: 'ظرفیت', aliases: ['ظرفیت', 'capacity'] },
  { key: 'power', label: 'توان', aliases: ['توان', 'power'] },
];

export function smartMatchColumn(columnName: string, fields: FieldMapping[] = commonEquipmentFields): string | null {
  const normalized = String(columnName).toLowerCase().trim();
  for (const field of fields) {
    for (const alias of field.aliases) {
      if (normalized === alias.toLowerCase().trim() ||
          normalized.includes(alias.toLowerCase().trim()) ||
          alias.toLowerCase().trim().includes(normalized)) {
        return field.key;
      }
    }
  }
  return null;
}

// ========== DEFAULT PM PLANS (ISO 55000 compliant) ==========
export function getDefaultPMPlans(equipmentName: string, model: string = '') {
  const name = (equipmentName + ' ' + model).toLowerCase();
  const plans: Array<{ frequency: string; title: string; intervalDays: number; checklist: string[]; estimatedDuration: number; standard: string }> = [];

  // Conveyor / Belt
  if (name.includes('کانوایر') || name.includes('نوار نقاله') || name.includes('conveyor') || name.includes('کلاوم')) {
    plans.push(
      { frequency: 'daily', title: 'بازرسی روزانه نوار نقاله', intervalDays: 1, estimatedDuration: 15, standard: 'ISO 55000', checklist: ['بازرسی بصری نوار نقاله', 'کنترل تراز و هم‌راستایی', 'بررسی صدای غیرعادی', 'کنترل دمای یاتاقان‌ها'] },
      { frequency: 'weekly', title: 'سرویس هفتگی', intervalDays: 7, estimatedDuration: 30, standard: 'ISO 55000', checklist: ['روغن‌کاری یاتاقان‌ها', 'تنظیم کشش نوار', 'بررسی غلتک‌ها', 'تمیزکاری نوار'] },
      { frequency: 'monthly', title: 'بازرسی ماهانه', intervalDays: 30, estimatedDuration: 60, standard: 'ISO 55000', checklist: ['بررسی سایش نوار', 'کنترل اتصالات موتور', 'بازرسی گیربکس', 'تنظیم سنسورها'] },
      { frequency: 'quarterly', title: 'سرویس فصلی', intervalDays: 90, estimatedDuration: 120, standard: 'ISO 55000', checklist: ['تعویض روغن گیربکس', 'بازرسی کامل غلتک‌ها', 'کنترل الکتروموتور', 'تست سیستم ایمنی'] },
      { frequency: 'yearly', title: 'اورهال سالانه', intervalDays: 365, estimatedDuration: 480, standard: 'ISO 55000', checklist: ['تعویض نوار نقاله در صورت نیاز', 'بازرسی کامل گیربکس', 'تعویض یاتاقان‌ها', 'کالیبراسیون سنسورها'] }
    );
  }
  // Cooler
  else if (name.includes('کولر') || name.includes('cooler')) {
    plans.push(
      { frequency: 'daily', title: 'بازرسی روزانه کولر', intervalDays: 1, estimatedDuration: 10, standard: 'ISO 55000', checklist: ['کنترل سطح آب', 'بررسی پد سلولزی', 'کنترل پمپ آب'] },
      { frequency: 'weekly', title: 'سرویس هفتگی', intervalDays: 7, estimatedDuration: 30, standard: 'ISO 55000', checklist: ['تمیزکاری پد', 'بررسی تسمه فن', 'کنترل شناور'] },
      { frequency: 'monthly', title: 'بازرسی ماهانه', intervalDays: 30, estimatedDuration: 60, standard: 'ISO 55000', checklist: ['شستشوی پد سلولزی', 'روغن‌کاری یاتاقان', 'بررسی موتور فن'] },
      { frequency: 'quarterly', title: 'سرویس فصلی', intervalDays: 90, estimatedDuration: 120, standard: 'ISO 55000', checklist: ['تعویض پد در صورت نیاز', 'بازرسی پمپ', 'تمیزکاری مخزن'] },
      { frequency: 'yearly', title: 'اورهال سالانه', intervalDays: 365, estimatedDuration: 240, standard: 'ISO 55000', checklist: ['تعویض پد', 'بازرسی کامل موتور', 'تعویض تسمه', 'ضدعفونی سیستم'] }
    );
  }
  // Forklift
  else if (name.includes('لیفتراک') || name.includes('forklift')) {
    plans.push(
      { frequency: 'daily', title: 'چک لیست روزانه اپراتور', intervalDays: 1, estimatedDuration: 15, standard: 'ISO 3691', checklist: ['کنترل سطح روغن و آب', 'بررسی ترمزها', 'کنترل چراغ‌ها و بوق', 'بازرسی شاخک‌ها'] },
      { frequency: 'weekly', title: 'سرویس هفتگی', intervalDays: 7, estimatedDuration: 45, standard: 'ISO 3691', checklist: ['روغن‌کاری نقاط گریس‌خور', 'کنترل باد لاستیک‌ها', 'بررسی زنجیرها'] },
      { frequency: 'monthly', title: 'بازرسی ماهانه', intervalDays: 30, estimatedDuration: 90, standard: 'ISO 3691', checklist: ['تعویض روغن موتور', 'تعویض فیلترها', 'کنترل سیستم هیدرولیک'] },
      { frequency: 'quarterly', title: 'سرویس فصلی', intervalDays: 90, estimatedDuration: 180, standard: 'ISO 3691', checklist: ['بازرسی گیربکس', 'کنترل سیستم ترمز', 'تست باربری'] },
      { frequency: 'yearly', title: 'اورهال سالانه', intervalDays: 365, estimatedDuration: 480, standard: 'ISO 3691', checklist: ['بازرسی کامل موتور', 'تعویض روغن گیربکس', 'تست ایمنی کامل', 'کالیبراسیون سیستم‌ها'] }
    );
  }
  // Compressor
  else if (name.includes('کمپرسور') || name.includes('compressor')) {
    plans.push(
      { frequency: 'daily', title: 'بازرسی روزانه', intervalDays: 1, estimatedDuration: 15, standard: 'ISO 55000', checklist: ['کنترل فشار', 'بررسی دما', 'تخلیه آب مخزن', 'کنترل نشتی'] },
      { frequency: 'weekly', title: 'سرویس هفتگی', intervalDays: 7, estimatedDuration: 30, standard: 'ISO 55000', checklist: ['تمیزکاری فیلتر هوا', 'کنترل تسمه', 'بررسی اتصالات'] },
      { frequency: 'monthly', title: 'بازرسی ماهانه', intervalDays: 30, estimatedDuration: 60, standard: 'ISO 55000', checklist: ['تعویض فیلتر روغن', 'کنترل سطح روغن', 'بازرسی شیر اطمینان'] },
      { frequency: 'quarterly', title: 'سرویس فصلی', intervalDays: 90, estimatedDuration: 120, standard: 'ISO 55000', checklist: ['تعویض روغن', 'تعویض فیلترها', 'بازرسی پیستون‌ها'] },
      { frequency: 'yearly', title: 'اورهال سالانه', intervalDays: 365, estimatedDuration: 480, standard: 'ISO 55000', checklist: ['بازرسی کامل موتور', 'تعویض قطعات سایشی', 'تست فشار', 'کالیبراسیون'] }
    );
  }
  // Boiler
  else if (name.includes('دیگ بخار') || name.includes('boiler')) {
    plans.push(
      { frequency: 'daily', title: 'بازرسی روزانه', intervalDays: 1, estimatedDuration: 30, standard: 'ASME BPVC', checklist: ['کنترل سطح آب', 'بررسی فشار', 'کنترل مشعل', 'تست شیر اطمینان'] },
      { frequency: 'weekly', title: 'سرویس هفتگی', intervalDays: 7, estimatedDuration: 60, standard: 'ASME BPVC', checklist: ['بازرسی مشعل', 'کنترل سیستم تغذیه آب', 'تمیزکاری چشمی UV'] },
      { frequency: 'monthly', title: 'بازرسی ماهانه', intervalDays: 30, estimatedDuration: 120, standard: 'ASME BPVC', checklist: ['تعویض فیلتر سوخت', 'کنترل پمپ‌ها', 'بازرسی شیرها'] },
      { frequency: 'quarterly', title: 'سرویس فصلی', intervalDays: 90, estimatedDuration: 240, standard: 'ASME BPVC', checklist: ['تمیزکاری لوله‌ها', 'بازرسی عایق‌ها', 'تست سیستم ایمنی'] },
      { frequency: 'yearly', title: 'اورهال سالانه', intervalDays: 365, estimatedDuration: 720, standard: 'ASME BPVC', checklist: ['بازرسی داخلی دیگ', 'تست هیدرواستاتیک', 'تعویض قطعات فرسوده', 'کالیبراسیون سنسورها'] }
    );
  }
  // Chiller
  else if (name.includes('چیلر') || name.includes('chiller')) {
    plans.push(
      { frequency: 'daily', title: 'بازرسی روزانه', intervalDays: 1, estimatedDuration: 20, standard: 'ISO 55000', checklist: ['کنترل دمای ورودی/خروجی', 'بررسی فشار', 'کنترل جریان آب'] },
      { frequency: 'weekly', title: 'سرویس هفتگی', intervalDays: 7, estimatedDuration: 45, standard: 'ISO 55000', checklist: ['تمیزکاری کندانسور', 'بررسی کمپرسور', 'کنترل شارژ گاز'] },
      { frequency: 'monthly', title: 'بازرسی ماهانه', intervalDays: 30, estimatedDuration: 90, standard: 'ISO 55000', checklist: ['تعویض فیلترها', 'کنترل روغن کمپرسور', 'بازرسی پمپ‌ها'] },
      { frequency: 'quarterly', title: 'سرویس فصلی', intervalDays: 90, estimatedDuration: 180, standard: 'ISO 55000', checklist: ['تعویض روغن', 'بازرسی کامل کندانسور', 'تست عملکرد'] },
      { frequency: 'yearly', title: 'اورهال سالانه', intervalDays: 365, estimatedDuration: 480, standard: 'ISO 55000', checklist: ['بازرسی کمپرسور', 'تعویض قطعات سایشی', 'تست فشار', 'کالیبراسیون'] }
    );
  }
  // Injection machine / Robot
  else if (name.includes('تزریق') || name.includes('ربات') || name.includes('injection') || name.includes('robot')) {
    plans.push(
      { frequency: 'daily', title: 'بازرسی روزانه', intervalDays: 1, estimatedDuration: 20, standard: 'ISO 55000', checklist: ['کنترل فشار هیدرولیک', 'بررسی دما', 'کنترل نشتی', 'بازرسی سنسورها'] },
      { frequency: 'weekly', title: 'سرویس هفتگی', intervalDays: 7, estimatedDuration: 45, standard: 'ISO 55000', checklist: ['روغن‌کاری نقاط متحرک', 'تمیزکاری قالب', 'بررسی سیستم خنک‌کننده'] },
      { frequency: 'monthly', title: 'بازرسی ماهانه', intervalDays: 30, estimatedDuration: 90, standard: 'ISO 55000', checklist: ['تعویض روغن هیدرولیک', 'تعویض فیلترها', 'بازرسی سیستم کنترل'] },
      { frequency: 'quarterly', title: 'سرویس فصلی', intervalDays: 90, estimatedDuration: 180, standard: 'ISO 55000', checklist: ['بازرسی کامل هیدرولیک', 'کالیبراسیون سنسورها', 'تست عملکرد'] },
      { frequency: 'yearly', title: 'اورهال سالانه', intervalDays: 365, estimatedDuration: 480, standard: 'ISO 55000', checklist: ['بازرسی کامل سیستم', 'تعویض قطعات سایشی', 'کالیبراسیون کامل', 'تست ایمنی'] }
    );
  }
  // Lab equipment (calibration-focused)
  else if (name.includes('آزمایشگاه') || name.includes('ترازو') || name.includes('کولیس') || name.includes('دماسنج') || name.includes('آون') || name.includes('هات پلیت') || name.includes('شوف بالن') || name.includes('تست کشش') || name.includes('عبور هوا') || name.includes('ارتجاعی') || name.includes('ترمومتر')) {
    plans.push(
      { frequency: 'daily', title: 'بازرسی روزانه', intervalDays: 1, estimatedDuration: 10, standard: 'ISO 17025', checklist: ['کنترل ظاهری', 'بررسی تمیزی', 'کنترل کالیبراسیون'] },
      { frequency: 'weekly', title: 'سرویس هفتگی', intervalDays: 7, estimatedDuration: 20, standard: 'ISO 17025', checklist: ['تمیزکاری', 'کنترل عملکرد', 'بررسی دقت'] },
      { frequency: 'monthly', title: 'بازرسی ماهانه', intervalDays: 30, estimatedDuration: 30, standard: 'ISO 17025', checklist: ['کالیبراسیون داخلی', 'کنترل استانداردها', 'ثبت داده‌ها'] },
      { frequency: 'quarterly', title: 'سرویس فصلی', intervalDays: 90, estimatedDuration: 60, standard: 'ISO 17025', checklist: ['بازرسی کامل', 'تعویض قطعات مصرفی', 'تست عملکرد'] },
      { frequency: 'yearly', title: 'کالیبراسیون سالانه', intervalDays: 365, estimatedDuration: 120, standard: 'ISO 17025', checklist: ['کالیبراسیون توسط آزمایشگاه معتبر', 'دریافت گواهی', 'ثبت سوابق'] }
    );
  }
  // Generator
  else if (name.includes('ژنراتور') || name.includes('generator') || name.includes('دیزل')) {
    plans.push(
      { frequency: 'daily', title: 'بازرسی روزانه', intervalDays: 1, estimatedDuration: 15, standard: 'ISO 8528', checklist: ['کنترل سطح سوخت', 'بررسی روغن', 'کنترل آب رادیاتور', 'تست باتری'] },
      { frequency: 'weekly', title: 'سرویس هفتگی', intervalDays: 7, estimatedDuration: 30, standard: 'ISO 8528', checklist: ['تمیزکاری فیلتر هوا', 'بررسی تسمه‌ها', 'کنترل اتصالات'] },
      { frequency: 'monthly', title: 'بازرسی ماهانه', intervalDays: 30, estimatedDuration: 60, standard: 'ISO 8528', checklist: ['تعویض روغن', 'تعویض فیلترها', 'تست بار'] },
      { frequency: 'quarterly', title: 'سرویس فصلی', intervalDays: 90, estimatedDuration: 120, standard: 'ISO 8528', checklist: ['بازرسی کامل موتور', 'کنترل سیستم سوخت', 'تست عملکرد'] },
      { frequency: 'yearly', title: 'اورهال سالانه', intervalDays: 365, estimatedDuration: 480, standard: 'ISO 8528', checklist: ['بازرسی کامل', 'تعویض قطعات سایشی', 'کالیبراسیون', 'تست بار کامل'] }
    );
  }
  // Default
  else {
    plans.push(
      { frequency: 'daily', title: 'بازرسی روزانه', intervalDays: 1, estimatedDuration: 15, standard: 'ISO 55000', checklist: ['بازرسی بصری', 'کنترل صدا و لرزش', 'بررسی دما'] },
      { frequency: 'weekly', title: 'سرویس هفتگی', intervalDays: 7, estimatedDuration: 30, standard: 'ISO 55000', checklist: ['تمیزکاری', 'روغن‌کاری', 'بررسی اتصالات'] },
      { frequency: 'monthly', title: 'بازرسی ماهانه', intervalDays: 30, estimatedDuration: 60, standard: 'ISO 55000', checklist: ['تعویض فیلترها', 'کنترل سنسورها', 'ثبت پارامترها'] },
      { frequency: 'quarterly', title: 'سرویس فصلی', intervalDays: 90, estimatedDuration: 120, standard: 'ISO 55000', checklist: ['آنالیز روغن', 'تعویض قطعات فرسوده', 'تست عملکرد'] },
      { frequency: 'yearly', title: 'اورهال سالانه', intervalDays: 365, estimatedDuration: 480, standard: 'ISO 55000', checklist: ['بازرسی کامل', 'تعویض قطعات', 'کالیبراسیون', 'تست نهایی'] }
    );
  }

  return plans;
}

// ========== MOCK DATA GENERATOR ==========
export const MEMORY_FOAM_FACTORY_EQUIPMENT = [
  // Conveyors (13 items)
  ...Array.from({ length: 7 }, (_, i) => ({
    name: 'کانوایر',
    model: i === 0 ? '9 متری' : i === 6 ? '12 متری' : '6 متری',
    serialNumber: `CV${i === 0 ? '09' : i === 6 ? '12' : '06'}-240${String(i + 1).padStart(2, '0')}`,
    pmCode: `B2P${String(i + 1).padStart(2, '0')}`,
    feCode: `FE-${String(16 + i).padStart(3, '0')}`,
    manufacturer: 'ایران',
    country: 'ایران',
    location: i < 7 ? 'چیدمان فوم' : 'انبار فوم',
    calibrationPeriod: 'نیاز ندارد',
    calibrationType: '—',
    hasPM: true,
    authorizedPersonnel: i < 7 ? 'سرپرست تولید / مسئول تعمیر و نگهداری' : 'انباردار / مسئول تعمیر و نگهداری',
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    name: 'کانوایر',
    model: i === 0 ? '3 متری' : '6 متری',
    serialNumber: `CV${i === 0 ? '03' : '06'}-240${String(i + 8).padStart(2, '0')}`,
    pmCode: `B2P${String(i + 8).padStart(2, '0')}`,
    feCode: `FE-${String(23 + i).padStart(3, '0')}`,
    manufacturer: 'ایران',
    country: 'ایران',
    location: 'انبار فوم',
    calibrationPeriod: 'نیاز ندارد',
    calibrationType: '—',
    hasPM: true,
    authorizedPersonnel: 'انباردار / مسئول تعمیر و نگهداری',
  })),
  // Coolers (3 items)
  ...Array.from({ length: 4 }, (_, i) => ({
    name: 'کولر آبی',
    model: '13000',
    serialNumber: `CL13-2400${i + 1}`,
    pmCode: `B2P${String(i + 14).padStart(2, '0')}`,
    feCode: `FE-${String(29 + i).padStart(3, '0')}`,
    manufacturer: 'ایران',
    country: 'ایران',
    location: 'چیدمان فوم',
    calibrationPeriod: 'نیاز ندارد',
    calibrationType: '—',
    hasPM: true,
    authorizedPersonnel: 'پرسنل تولید / مسئول تعمیر و نگهداری',
  })),
];

export const LAB_EQUIPMENT = [
  { name: 'دستگاه تست کشش (Tensile Testing Machine)', model: 'Universal Tensile Tester', serialNumber: 'TTM-24001', pmCode: 'SC-119', feCode: 'FE-061', manufacturer: 'چین', country: 'چین', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'خارجی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه / مدیر کنترل کیفیت' },
  { name: 'ترازوی آزمایشگاهی', model: 'AND GF-400', serialNumber: 'GF400-24001', pmCode: 'SC-120', feCode: 'FE-062', manufacturer: 'ژاپن', country: 'ژاپن', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'خارجی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه' },
  { name: 'شوف بالن', model: 'Heating Mantle', serialNumber: 'HM-24001', pmCode: 'SC-122', feCode: 'FE-063', manufacturer: 'آلمان', country: 'آلمان', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'خارجی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه' },
  { name: 'هات پلیت همزن‌دار', model: 'MR HEI-TEC', serialNumber: 'MRHT-24001', pmCode: 'SC-123', feCode: 'FE-064', manufacturer: 'آلمان', country: 'آلمان', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'خارجی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه' },
  { name: 'هات پلیت همزن‌دار', model: 'MR HEI-TEC', serialNumber: 'MRHT-24002', pmCode: 'SC-124', feCode: 'FE-065', manufacturer: 'آلمان', country: 'آلمان', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'خارجی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه' },
  { name: 'آون آزمایشگاهی', model: 'Laboratory Oven', serialNumber: 'OV-24001', pmCode: 'SC-118', feCode: 'FE-066', manufacturer: 'آلمان', country: 'آلمان', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'خارجی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه' },
  { name: 'ترمومتر پراب‌دار', model: 'TESTO 925', serialNumber: 'TS925-24001', pmCode: 'SC-117', feCode: 'FE-067', manufacturer: 'آلمان', country: 'آلمان', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'خارجی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه' },
  { name: 'کولیس دیجیتال', model: 'Guanglu 0–300 mm', serialNumber: 'GL300-24001', pmCode: 'SC-125', feCode: 'FE-068', manufacturer: 'چین', country: 'چین', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'داخلی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه' },
  { name: 'دماسنج لیزری', model: 'TD360', serialNumber: 'TD360-24001', pmCode: 'SC-126', feCode: 'FE-069', manufacturer: 'چین', country: 'چین', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'خارجی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه' },
  { name: 'دستگاه عبور هوا شماره 1', model: 'Air Permeability Tester', serialNumber: 'APT-24001', pmCode: 'SC-127', feCode: 'FE-070', manufacturer: 'ایران', country: 'ایران', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'داخلی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه' },
  { name: 'دستگاه عبور هوا شماره 2', model: 'Air Permeability Tester', serialNumber: 'APT-24002', pmCode: 'SC-128', feCode: 'FE-071', manufacturer: 'ایران', country: 'ایران', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'داخلی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه' },
  { name: 'دستگاه تست خاصیت ارتجاعی', model: 'Ball Rebound Tester', serialNumber: 'BRT-24001', pmCode: 'SC-129', feCode: 'FE-072', manufacturer: 'ایران', country: 'ایران', location: 'آزمایشگاه', pcRequired: true, calibrationPeriod: '1 ساله', calibrationType: 'داخلی', hasPM: true, authorizedPersonnel: 'کارشناس آزمایشگاه / مدیر کنترل کیفیت' },
];
