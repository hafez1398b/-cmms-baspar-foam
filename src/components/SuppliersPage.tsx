'use client';
import React, { useState } from 'react';
import { useSupplierStore } from '@/lib/store';
import { useUIStore } from '@/lib/store';
import { Plus, Edit2, Trash2, Download, Search, X, Check, Phone, Mail, MapPin, Star } from 'lucide-react';
import { toPersianDigits, exportToExcel } from '@/lib/utils';

export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSupplierStore();
  const { showNotification } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', contactPerson: '', phone: '', email: '', address: '', category: '', rating: 5, isActive: true, notes: '',
  });

  const filtered = suppliers.filter(s =>
    s.name.includes(search) || s.contactPerson?.includes(search) || s.category?.includes(search)
  );

  const openNew = () => {
    setEditItem(null);
    setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', category: '', rating: 5, isActive: true, notes: '' });
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditItem(s);
    setForm({ ...s });
    setShowModal(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      showNotification('error', 'نام تامین‌کننده الزامی است.');
      return;
    }
    if (editItem) {
      updateSupplier(editItem.id, form);
      showNotification('success', 'تامین‌کننده با موفقیت به‌روز شد.');
    } else {
      addSupplier({ id: Date.now(), ...form });
      showNotification('success', 'تامین‌کننده جدید ثبت شد.');
    }
    setShowModal(false);
  };

  const remove = (id: number) => {
    if (confirm('آیا از حذف این تامین‌کننده اطمینان دارید؟')) {
      deleteSupplier(id);
      showNotification('success', 'تامین‌کننده حذف شد.');
    }
  };

  const exportAll = () => {
    exportToExcel(suppliers, 'suppliers', [
      { key: 'name', label: 'نام شرکت' },
      { key: 'contactPerson', label: 'شخص تماس' },
      { key: 'phone', label: 'تلفن' },
      { key: 'email', label: 'ایمیل' },
      { key: 'category', label: 'دسته‌بندی' },
      { key: 'rating', label: 'امتیاز' },
    ]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="section-title mb-0">مدیریت تامین‌کنندگان</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className="input !pr-10 !w-64" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={exportAll}><Download size={16} /> خروجی</button>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> تامین‌کننده جدید</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold">{s.name}</h3>
                {s.category && <span className="badge badge-gold mt-1 inline-block">{s.category}</span>}
              </div>
              <div className="flex gap-1">
                <button className="btn btn-ghost !p-2" onClick={() => openEdit(s)}><Edit2 size={14} /></button>
                <button className="btn btn-ghost !p-2 text-[var(--danger)]" onClick={() => remove(s.id)}><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="space-y-2 text-sm text-[var(--foreground-secondary)]">
              {s.contactPerson && <div className="flex items-center gap-2"><UserIcon size={14} /> {s.contactPerson}</div>}
              {s.phone && <div className="flex items-center gap-2"><Phone size={14} /> {toPersianDigits(s.phone)}</div>}
              {s.email && <div className="flex items-center gap-2" dir="ltr"><Mail size={14} /> <span className="text-left">{s.email}</span></div>}
              {s.address && <div className="flex items-start gap-2"><MapPin size={14} className="mt-0.5" /> <span className="text-xs leading-relaxed">{s.address}</span></div>}
              <div className="flex items-center gap-1 pt-2 border-t border-[var(--border)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(s.rating || 0) ? 'fill-[var(--gold)] text-[var(--gold)]' : 'text-[var(--border-light)]'} />
                ))}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-8 text-[var(--foreground-muted)]">تامین‌کننده‌ای یافت نشد.</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6 max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{editItem ? 'ویرایش تامین‌کننده' : 'تامین‌کننده جدید'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">نام شرکت *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">شخص تماس</label>
                <input className="input" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
              <div>
                <label className="label">دسته‌بندی</label>
                <input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="قطعات، خدمات، ..." />
              </div>
              <div>
                <label className="label">تلفن</label>
                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">ایمیل</label>
                <input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">امتیاز (۱-۵)</label>
                <input type="number" min={1} max={5} className="input" value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                  فعال
                </label>
              </div>
              <div className="col-span-2">
                <label className="label">آدرس</label>
                <textarea className="textarea" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">توضیحات</label>
                <textarea className="textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={save}><Check size={16} /> {editItem ? 'ذخیره تغییرات' : 'ثبت تامین‌کننده'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserIcon({ size, className }: { size: number; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
