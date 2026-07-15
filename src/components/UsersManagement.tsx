'use client';
import React, { useState } from 'react';
import { useAuthStore, roleLabels } from '@/lib/auth';
import { useUIStore } from '@/lib/store';
import { Plus, Edit2, Trash2, Search, X, Check, Key, Shield, UserCog } from 'lucide-react';
import { toPersianDigits } from '@/lib/utils';

export default function UsersManagement() {
  const { users, addUser, updateUser, deleteUser, changePassword, currentUser } = useAuthStore();
  const { showNotification } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showPassModal, setShowPassModal] = useState<number | null>(null);
  const [newPass, setNewPass] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    username: '', password: '', fullName: '', role: 'technician' as any, department: '', personnelId: undefined as number | undefined, isActive: true, avatarColor: '#D4A555',
  });

  const filtered = users.filter(u =>
    u.username.includes(search) || u.fullName.includes(search) || (u.department || '').includes(search)
  );

  const openNew = () => {
    setEditItem(null);
    setForm({ username: '', password: '', fullName: '', role: 'technician', department: '', personnelId: undefined, isActive: true, avatarColor: '#D4A555' });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditItem(u);
    setForm({ username: u.username, password: '', fullName: u.fullName, role: u.role, department: u.department || '', personnelId: u.personnelId, isActive: u.isActive, avatarColor: u.avatarColor || '#D4A555' });
    setShowModal(true);
  };

  const save = () => {
    if (!form.username.trim() || !form.fullName.trim()) {
      showNotification('error', 'نام کاربری و نام کامل الزامی است.');
      return;
    }
    if (!editItem && !form.password.trim()) {
      showNotification('error', 'رمز عبور الزامی است.');
      return;
    }
    // Check duplicate username
    const dup = users.find(u => u.username === form.username && u.id !== editItem?.id);
    if (dup) {
      showNotification('error', 'این نام کاربری قبلاً ثبت شده است.');
      return;
    }
    if (editItem) {
      updateUser(editItem.id, {
        username: form.username, fullName: form.fullName, role: form.role,
        department: form.department, personnelId: form.personnelId, isActive: form.isActive, avatarColor: form.avatarColor,
      });
      if (form.password) changePassword(editItem.id, form.password);
      showNotification('success', 'کاربر به‌روز شد.');
    } else {
      addUser({
        id: Date.now(),
        username: form.username, password: form.password, fullName: form.fullName, role: form.role,
        department: form.department, personnelId: form.personnelId, isActive: form.isActive,
        avatarColor: form.avatarColor, createdAt: new Date().toISOString(),
      });
      showNotification('success', 'کاربر جدید ایجاد شد.');
    }
    setShowModal(false);
  };

  const remove = (id: number) => {
    if (id === currentUser?.id) { showNotification('error', 'نمی‌توانید حساب خود را حذف کنید.'); return; }
    if (confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      deleteUser(id);
      showNotification('success', 'کاربر حذف شد.');
    }
  };

  const changePass = () => {
    if (!showPassModal || !newPass.trim()) { showNotification('error', 'رمز جدید الزامی است.'); return; }
    if (newPass.length < 4) { showNotification('error', 'رمز عبور باید حداقل ۴ کاراکتر باشد.'); return; }
    changePassword(showPassModal, newPass);
    showNotification('success', 'رمز عبور تغییر کرد.');
    setShowPassModal(null);
    setNewPass('');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="section-title mb-0">مدیریت کاربران و حساب‌های کاربری</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className="input !pr-10 !w-64" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> کاربر جدید</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>نام کاربری</th>
                <th>نام و نام خانوادگی</th>
                <th>نقش</th>
                <th>واحد</th>
                <th>وضعیت</th>
                <th>آخرین ورود</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => (
                <tr key={u.id}>
                  <td>{toPersianDigits(idx + 1)}</td>
                  <td className="font-mono font-bold">{u.username}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#0a0a0b]" style={{ background: u.avatarColor || '#D4A555' }}>{u.fullName.charAt(0)}</div>
                      <span className="font-medium">{u.fullName}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-gold' : u.role === 'manager' ? 'badge-info' : u.role === 'technician' ? 'badge-success' : 'badge-neutral'}`}>{roleLabels[u.role]}</span></td>
                  <td className="text-sm text-[var(--foreground-muted)]">{u.department || '-'}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-neutral'}`}>{u.isActive ? 'فعال' : 'غیرفعال'}</span></td>
                  <td className="text-xs text-[var(--foreground-muted)]">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('fa-IR') : '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost !p-2" onClick={() => openEdit(u)} title="ویرایش"><Edit2 size={14} /></button>
                      <button className="btn btn-ghost !p-2 text-[var(--warning)]" onClick={() => setShowPassModal(u.id)} title="تغییر رمز"><Key size={14} /></button>
                      <button className="btn btn-ghost !p-2 text-[var(--danger)]" onClick={() => remove(u.id)} title="حذف"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6 max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><UserCog size={20} className="text-[var(--gold)]" /> {editItem ? 'ویرایش کاربر' : 'کاربر جدید'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">نام کاربری *</label>
                <input className="input font-mono" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="مثلاً: tech3" />
              </div>
              <div>
                <label className="label">{editItem ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور *'}</label>
                <input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editItem ? 'برای تغییر پر کنید' : 'رمز عبور'} />
              </div>
              <div className="col-span-2">
                <label className="label">نام و نام خانوادگی *</label>
                <input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <label className="label">نقش</label>
                <select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">واحد / دپارتمان</label>
                <input className="input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label className="label">رنگ آواتار</label>
                <input type="color" className="input !h-10 !p-1" value={form.avatarColor} onChange={e => setForm({ ...form, avatarColor: e.target.value })} />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                  فعال
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={save}><Check size={16} /> {editItem ? 'ذخیره تغییرات' : 'ایجاد کاربر'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPassModal !== null && (
        <div className="modal-overlay" onClick={() => setShowPassModal(null)}>
          <div className="modal-content p-6 max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><Key size={20} className="text-[var(--gold)]" /> تغییر رمز عبور</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowPassModal(null)}><X size={18} /></button>
            </div>
            <div>
              <label className="label">رمز عبور جدید</label>
              <input type="password" className="input" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="حداقل ۴ کاراکتر" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowPassModal(null)}>انصراف</button>
              <button className="btn btn-primary" onClick={changePass}><Check size={16} /> تغییر رمز</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
