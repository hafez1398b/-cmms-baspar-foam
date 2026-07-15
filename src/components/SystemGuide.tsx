'use client';
import React from 'react';
import { BookOpen, Wrench, Factory, FileUp, Users, MessageSquare, BarChart3, Sparkles, Hammer, ClipboardList } from 'lucide-react';

export default function SystemGuide() {
  const sections = [
    { icon: Factory, title: 'درخت تجهیزات', desc: 'مدیریت ساختار درختی کارخانه، واحدها، خطوط تولید و دستگاه‌ها. امکان افزودن، ویرایش، حذف و جابجایی تجهیزات. برای هر تجهیز می‌توانید شناسنامه کامل شامل مشخصات فنی، سازنده، مدل، سریال و ... را مشاهده و ویرایش کنید.' },
    { icon: FileUp, title: 'انبار فایل‌های اکسل', desc: 'وارد کردن هوشمند فایل‌های اکسل شناسنامه تجهیزات. سیستم پس از انتخاب محل در درخت تجهیزات، فایل را تحلیل کرده و فیلدها را به صورت هوشمند مپ می‌کند. الگوهای مپینگ ذخیره شده و در دفعات بعدی به صورت خودکار اعمال می‌شوند.' },
    { icon: Wrench, title: 'دستور کارها', desc: 'ثبت و پیگیری دستور کارهای تعمیراتی شامل نوع (پیشگیرانه، اصلاحی، اضطراری)، اولویت، وضعیت، تجهیز مربوطه، تکنسین مسئول، زمان‌بندی و هزینه‌ها. بخش مشاوره مدیر فنی برای ثبت نظرات مشاوره‌ای.' },
    { icon: ClipboardList, title: 'درخواست تعمیرات', desc: 'ثبت درخواست‌های تعمیرات از سوی پرسنل بخش‌های مختلف. امکان تبدیل مستقیم درخواست به دستور کار توسط مدیر فنی با یک کلیک.' },
    { icon: Hammer, title: 'مرکز برنامه‌ریزی', desc: 'نمای تقویمی کارهای برنامه‌ریزی شده. با کلیک روی هر روز می‌توانید جزئیات کارهای آن روز (شامل شرح، تجهیز، مسئول و وضعیت) را مشاهده کنید.' },
    { icon: BarChart3, title: 'برنامه PM', desc: 'تعریف برنامه‌های نگهداری پیشگیرانه برای تجهیزات با تناوب‌های روزانه، هفتگی، ماهانه، فصلی و سالانه. شامل چک‌لیست‌های اختصاصی.' },
    { icon: Users, title: 'پرسنل و تیم', desc: 'مدیریت پرسنل با اطلاعات کامل، ثبت ورود و خروج، مدیریت مرخصی‌ها و گزارشات تردد.' },
    { icon: MessageSquare, title: 'پیام‌رسان داخلی', desc: 'چت خصوصی و گروهی بین کاربران سیستم. نمایش وضعیت خوانده شدن پیام‌ها و اعلان پیام جدید.' },
    { icon: Sparkles, title: 'دستیار هوش مصنوعی', desc: 'دستیار AI برای تحلیل خرابی‌ها، پیشنهاد راه‌حل، تحلیل تصاویر (مثل Google Lens) و کمک به عیب‌یابی تجهیزات.' },
    { icon: BarChart3, title: 'گزارشات', desc: 'گزارشات و نمودارهای تحلیلی شامل MTTR، MTBF، هزینه‌ها، روند خرابی‌ها و شاخص‌های کلیدی عملکرد PM.' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center mx-auto mb-4">
          <BookOpen size={32} className="text-[#0a0a0b]" />
        </div>
        <h2 className="text-2xl font-bold gold-text">راهنمای جامع سامانه CMMS بسپارفوم غرب</h2>
        <p className="text-[var(--foreground-muted)] mt-2">نسخه ۲.۰ - سیستم جامع مدیریت نگهداری و تعمیرات</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="card card-gold">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--background-elevated)] flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-[var(--gold)]" />
                </div>
                <div>
                  <h3 className="font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-6">
        <h3 className="font-bold mb-3">نکات کلیدی استفاده</h3>
        <ul className="space-y-2 text-sm text-[var(--foreground-secondary)] list-disc pr-5">
          <li>تمام بخش‌های سامانه قابل ویرایش هستند و هیچ اطلاعاتی به صورت ثابت نیست.</li>
          <li>برای وارد کردن دسته‌جمعی تجهیزات از «انبار فایل‌های اکسل» استفاده کنید.</li>
          <li>با استفاده از دکمه‌های خروجی در هر بخش می‌توانید از داده‌ها اکسل یا PDF بگیرید.</li>
          <li>در تمام جداول امکان جستجو، فیلتر و مرتب‌سازی وجود دارد.</li>
          <li>با کلیک روی کارت‌های داشبورد مستقیماً به بخش مربوطه منتقل می‌شوید.</li>
          <li>منوی کناری با دکمه بالای آن قابل جمع و باز شدن است.</li>
          <li>تاریخ‌ها در تمام بخش‌ها به صورت شمسی (جلالی) نمایش داده می‌شوند.</li>
        </ul>
      </div>
    </div>
  );
}
