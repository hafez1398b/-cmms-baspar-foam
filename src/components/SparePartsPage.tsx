'use client';
import React, { useState } from 'react';
import { useSparePartStore, useSupplierStore } from '@/lib/store';
import { useUIStore } from '@/lib/store';
import { Plus, Edit2, Trash2, Download, Search, X, Check, Package, AlertTriangle } from 'lucide-react';
import { toPersianDigits, exportToExcel } from '@/lib/utils';

export default function SparePartsPage() {
  const { spareParts, addSparePart, updateSparePart, deleteSparePart } = useSparePartStore();
  const { suppliers } = useSupplierStore();
  const { showNotification } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    partNumber: '', name: '', description: '', category: '', unit: 'عدد',
    currentStock: 0, minStock: 0, maxStock: 100, unitCost: 0, supplierId: undefined as number | undefined, location: '',
  });

  const filtered = spareParts.filter(p =>
    p.name.includes(search) || p.partNumber?.includes(search) || p.category?.includes(search)
  );

  const lowStock = spareParts.filter(p => p.currentStock <= p.minStock);

  const openNew = () => {
    setEditItem(null);
    setForm({ partNumber: '', name: '', description: '', category: '', unit: 'عدد', currentStock: 0, minStock: 0, maxStock: 100, unitCost: 0, supplierId: undefined, location: '' });
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditItem(p);
    setForm({ ...p, supplierId: p.supplierId || undefined });
    setShowModal(true);
  };

  const save = () => {
    if (!form.name.trim()) { showNotification('error', 'نام قطعه الزامی است.'); return; }
    if (editItem) {
      updateSparePart(editItem.id, form);
      showNotification('success', 'قطعه با موفقیت به‌روز شد.');
    } else {
      addSparePart({ id: Date.now(), ...form });
      showNotification('success', 'قطعه جدید ثبت شد.');
    }
    setShowModal(false);
  };

  const remove = (id: number) => {
    if (confirm('آیا از حذف این قطعه اطمینان دارید؟')) {
      deleteSparePart(id);
      showNotification('success', 'قطعه حذف شد.');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="section-title mb-0">انبار قطعات یدکی</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className="input !pr-10 !w-64" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={() => exportToExcel(spareParts, 'spare-parts')}><Download size={16} /> خروجی</button>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> قطعه جدید</button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card mb-4 border-l-4 border-l-[var(--warning)] bg-[rgba(245,158,11,0.05)]">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-[var(--warning)]" />
            <span className="font-bold text-[var(--warning)]">هشدار موجودی کم ({toPersianDigits(lowStock.length)} قطعه)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="badge badge-warning">{p.name} ({toPersianDigits(p.currentStock)})</span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>کد</th>
                <th>نام قطعه</th>
                <th>دسته‌بندی</th>
                <th>موجودی</th>
                <th>حداقل</th>
                <th>واحد</th>
                <th>قیمت (ریال)</th>
                <th>محل</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const low = p.currentStock <= p.minStock;
                return (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.partNumber || '-'}</td>
                    <td className="font-medium">{p.name}</td>
                    <td className="text-sm text-[var(--foreground-muted)]">{p.category || '-'}</td>
                    <td className={low ? 'text-[var(--danger)] font-bold' : ''}>{toPersianDigits(p.currentStock)}</td>
                    <td>{toPersianDigits(p.minStock)}</td>
                    <td>{p.unit}</td>
                    <td>{toPersianDigits((p.unitCost || 0).toLocaleString())}</td>
                    <td className="text-sm text-[var(--foreground-muted)]">{p.location || '-'}</td>
                    <td>
                      <span className={`badge ${low ? 'badge-danger' : 'badge-success'}`}>
                        {low ? 'موجودی کم' : 'مناسب'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost !p-2" onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost !p-2 text-[var(--danger)]" onClick={() => remove(p.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6 max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{editItem ? 'ویرایش قطعه' : 'قطعه جدید'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">کد قطعه</label>
                <input className="input" value={form.partNumber} onChange={e => setForm({ ...form, partNumber: e.target.value })} />
              </div>
              <div>
                <label className="label">نام قطعه *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">دسته‌بندی</label>
                <input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className="label">واحد</label>
                <select className="select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  <option value="عدد">عدد</option>
                  <option value="بسته">بسته</option>
                  <option value="لیتر">لیتر</option>
                  <option value="کیلوگرم">کیلوگرم</option>
                  <option value="متر">متر</option>
                  <option value="بشکه">بشکه</option>
                </select>
              </div>
              <div>
                <label className="label">موجودی فعلی</label>
                <input type="number" className="input" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">حداقل موجودی</label>
                <input type="number" className="input" value={form.minStock} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">حداکثر موجودی</label>
                <input type="number" className="input" value={form.maxStock} onChange={e => setForm({ ...form, maxStock: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">قیمت واحد (ریال)</label>
                <input type="number" className="input" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">تامین‌کننده</label>
                <select className="select" value={form.supplierId || ''} onChange={e => setForm({ ...form, supplierId: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">-- انتخاب کنید --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">محل انبار</label>
                <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">توضیحات</label>
                <textarea className="textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={save}><Check size={16} /> {editItem ? 'ذخیره تغییرات' : 'ثبت قطعه'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
