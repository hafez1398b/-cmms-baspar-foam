'use client';
import React, { useState, useMemo } from 'react';
import { usePersonnelStore } from '@/lib/store';
import { useUIStore } from '@/lib/store';
import { Plus, Edit2, Trash2, Download, Search, X, Check, Clock, LogIn, LogOut, Calendar as CalIcon, FileText, Users } from 'lucide-react';
import { toPersianDigits, formatJalali, exportToExcel, leaveStatusMap, attendanceStatusMap } from '@/lib/utils';

type Tab = 'list' | 'attendance' | 'leaves';

export default function PersonnelPage() {
  const { personnel, attendance, leaves, addPersonnel, updatePersonnel, deletePersonnel,
    addAttendance, addLeave, updateLeave, setAttendance, setLeaves } = usePersonnelStore();
  const { showNotification } = useUIStore();
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editPerson, setEditPerson] = useState<any>(null);
  const [search, setSearch] = useState('');

  const [personForm, setPersonForm] = useState({
    fullName: '', personnelCode: '', nationalId: '', jobTitle: '', department: '',
    shift: 'morning', phone: '', email: '', hireDate: '', isActive: true, skills: '', notes: '',
  });
  const [attendanceForm, setAttendanceForm] = useState({
    personnelId: 0, attendanceDate: '', checkIn: '', checkOut: '', status: 'present', notes: '',
  });
  const [leaveForm, setLeaveForm] = useState({
    personnelId: 0, leaveType: 'annual', fromDate: '', toDate: '', days: 1, reason: '', status: 'pending', notes: '',
  });

  const filteredPersonnel = personnel.filter(p =>
    p.fullName.includes(search) || p.jobTitle?.includes(search) || p.department?.includes(search)
  );

  const openNewPerson = () => {
    setEditPerson(null);
    setPersonForm({ fullName: '', personnelCode: '', nationalId: '', jobTitle: '', department: '', shift: 'morning', phone: '', email: '', hireDate: '', isActive: true, skills: '', notes: '' });
    setShowPersonModal(true);
  };
  const openEditPerson = (p: any) => {
    setEditPerson(p);
    setPersonForm({ ...p, skills: (p.skills || []).join(', ') });
    setShowPersonModal(true);
  };
  const savePerson = () => {
    if (!personForm.fullName.trim()) { showNotification('error', 'نام و نام خانوادگی الزامی است.'); return; }
    const data = { ...personForm, skills: personForm.skills.split(',').map(s => s.trim()).filter(Boolean) };
    if (editPerson) {
      updatePersonnel(editPerson.id, data);
      showNotification('success', 'اطلاعات پرسنل به‌روز شد.');
    } else {
      const avatarColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#D4A555', '#ef4444'];
      addPersonnel({ id: Date.now(), ...data, avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)] });
      showNotification('success', 'پرسنل جدید ثبت شد.');
    }
    setShowPersonModal(false);
  };
  const removePerson = (id: number) => {
    if (confirm('آیا از حذف این پرسنل اطمینان دارید؟')) {
      deletePersonnel(id);
      showNotification('success', 'پرسنل حذف شد.');
    }
  };

  const saveAttendance = () => {
    if (!attendanceForm.personnelId || !attendanceForm.attendanceDate) {
      showNotification('error', 'انتخاب پرسنل و تاریخ الزامی است.'); return;
    }
    let workMinutes = 0;
    if (attendanceForm.checkIn && attendanceForm.checkOut) {
      const [inH, inM] = attendanceForm.checkIn.split(':').map(Number);
      const [outH, outM] = attendanceForm.checkOut.split(':').map(Number);
      workMinutes = (outH * 60 + outM) - (inH * 60 + inM);
      if (workMinutes < 0) workMinutes += 24 * 60;
    }
    addAttendance({
      id: Date.now(),
      personnelId: attendanceForm.personnelId,
      attendanceDate: attendanceForm.attendanceDate,
      checkIn: attendanceForm.checkIn ? `${attendanceForm.attendanceDate}T${attendanceForm.checkIn}` : undefined,
      checkOut: attendanceForm.checkOut ? `${attendanceForm.attendanceDate}T${attendanceForm.checkOut}` : undefined,
      status: attendanceForm.status,
      workMinutes,
      notes: attendanceForm.notes,
    });
    showNotification('success', 'سابقه تردد ثبت شد.');
    setShowAttendanceModal(false);
  };

  const saveLeave = () => {
    if (!leaveForm.personnelId || !leaveForm.fromDate || !leaveForm.toDate) {
      showNotification('error', 'تکمیل فیلدهای الزامی.'); return;
    }
    addLeave({
      id: Date.now(),
      personnelId: leaveForm.personnelId,
      leaveType: leaveForm.leaveType,
      fromDate: leaveForm.fromDate,
      toDate: leaveForm.toDate,
      days: leaveForm.days,
      reason: leaveForm.reason,
      status: leaveForm.status,
      notes: leaveForm.notes,
    });
    showNotification('success', 'درخواست مرخصی ثبت شد.');
    setShowLeaveModal(false);
  };

  const approveLeave = (id: number) => {
    updateLeave(id, { status: 'approved', approvedBy: 'مدیر سیستم' });
    showNotification('success', 'مرخصی تایید شد.');
  };

  const personMap = useMemo(() => {
    const m = new Map<number, string>();
    personnel.forEach(p => m.set(p.id, p.fullName));
    return m;
  }, [personnel]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="tabs">
          <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}><Users size={14} /> لیست پرسنل</button>
          <button className={`tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}><Clock size={14} /> ورود و خروج</button>
          <button className={`tab ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}><CalIcon size={14} /> مرخصی‌ها</button>
        </div>
        <div className="flex gap-2">
          {activeTab === 'list' && <button className="btn btn-primary" onClick={openNewPerson}><Plus size={16} /> پرسنل جدید</button>}
          {activeTab === 'attendance' && <button className="btn btn-primary" onClick={() => setShowAttendanceModal(true)}><Plus size={16} /> ثبت تردد</button>}
          {activeTab === 'leaves' && <button className="btn btn-primary" onClick={() => setShowLeaveModal(true)}><Plus size={16} /> درخواست مرخصی</button>}
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="card">
          <div className="relative mb-4 max-w-md">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className="input !pr-10" placeholder="جستجو در پرسنل..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>نام و نام خانوادگی</th>
                  <th>کد پرسنلی</th>
                  <th>شغل</th>
                  <th>واحد</th>
                  <th>شیفت</th>
                  <th>تماس</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersonnel.map((p, idx) => (
                  <tr key={p.id}>
                    <td>{toPersianDigits(idx + 1)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#0a0a0b]" style={{ background: p.avatarColor || '#D4A555' }}>{p.fullName.charAt(0)}</div>
                        <span className="font-medium">{p.fullName}</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{p.personnelCode || '-'}</td>
                    <td className="text-sm">{p.jobTitle || '-'}</td>
                    <td className="text-sm text-[var(--foreground-muted)]">{p.department || '-'}</td>
                    <td><span className="badge badge-neutral">{p.shift === 'morning' ? 'صبحکار' : p.shift === 'evening' ? 'عصرکار' : p.shift === 'night' ? 'شب‌کار' : 'چرخشی'}</span></td>
                    <td className="text-xs ltr text-left" dir="ltr">{p.phone ? toPersianDigits(p.phone) : '-'}</td>
                    <td><span className={`badge ${p.isActive ? 'badge-success' : 'badge-neutral'}`}>{p.isActive ? 'فعال' : 'غیرفعال'}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost !p-2" onClick={() => openEditPerson(p)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost !p-2 text-[var(--danger)]" onClick={() => removePerson(p.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>پرسنل</th>
                  <th>تاریخ</th>
                  <th>ورود</th>
                  <th>خروج</th>
                  <th>کارکرد (دقیقه)</th>
                  <th>وضعیت</th>
                  <th>توضیحات</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice().sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate)).map((a, idx) => (
                  <tr key={a.id}>
                    <td>{toPersianDigits(idx + 1)}</td>
                    <td>{personMap.get(a.personnelId) || '-'}</td>
                    <td>{formatJalali(a.attendanceDate)}</td>
                    <td>{a.checkIn ? formatJalali(a.checkIn, 'HH:mm') : '-'}</td>
                    <td>{a.checkOut ? formatJalali(a.checkOut, 'HH:mm') : '-'}</td>
                    <td>{toPersianDigits(a.workMinutes || 0)}</td>
                    <td><span className={`badge ${attendanceStatusMap[a.status]?.class}`}>{attendanceStatusMap[a.status]?.label || a.status}</span></td>
                    <td className="text-xs text-[var(--foreground-muted)]">{a.notes || '-'}</td>
                  </tr>
                ))}
                {attendance.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-[var(--foreground-muted)]">هنوز سابقه ترددی ثبت نشده است.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>پرسنل</th>
                  <th>نوع مرخصی</th>
                  <th>از تاریخ</th>
                  <th>تا تاریخ</th>
                  <th>تعداد روز</th>
                  <th>دلیل</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {leaves.slice().sort((a, b) => b.fromDate.localeCompare(a.fromDate)).map((l, idx) => (
                  <tr key={l.id}>
                    <td>{toPersianDigits(idx + 1)}</td>
                    <td>{personMap.get(l.personnelId) || '-'}</td>
                    <td><span className="badge badge-info">{l.leaveType === 'annual' ? 'استحقاقی' : l.leaveType === 'sick' ? 'استعلاجی' : l.leaveType === 'unpaid' ? 'بدون حقوق' : l.leaveType}</span></td>
                    <td>{formatJalali(l.fromDate)}</td>
                    <td>{formatJalali(l.toDate)}</td>
                    <td>{toPersianDigits(l.days)}</td>
                    <td className="text-xs text-[var(--foreground-muted)] max-w-[200px] truncate">{l.reason || '-'}</td>
                    <td><span className={`badge ${leaveStatusMap[l.status]?.class}`}>{leaveStatusMap[l.status]?.label || l.status}</span></td>
                    <td>
                      {l.status === 'pending' && (
                        <button className="btn btn-success !py-1 !px-2 text-xs" onClick={() => approveLeave(l.id)}><Check size={14} /> تایید</button>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-[var(--foreground-muted)]">درخواست مرخصی ثبت نشده است.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Person Modal */}
      {showPersonModal && (
        <div className="modal-overlay" onClick={() => setShowPersonModal(false)}>
          <div className="modal-content p-6 max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{editPerson ? 'ویرایش پرسنل' : 'پرسنل جدید'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowPersonModal(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">نام و نام خانوادگی *</label>
                <input className="input" value={personForm.fullName} onChange={e => setPersonForm({ ...personForm, fullName: e.target.value })} />
              </div>
              <div>
                <label className="label">کد پرسنلی</label>
                <input className="input" value={personForm.personnelCode} onChange={e => setPersonForm({ ...personForm, personnelCode: e.target.value })} />
              </div>
              <div>
                <label className="label">کد ملی</label>
                <input className="input" value={personForm.nationalId} onChange={e => setPersonForm({ ...personForm, nationalId: e.target.value })} />
              </div>
              <div>
                <label className="label">شغل</label>
                <input className="input" value={personForm.jobTitle} onChange={e => setPersonForm({ ...personForm, jobTitle: e.target.value })} />
              </div>
              <div>
                <label className="label">واحد</label>
                <input className="input" value={personForm.department} onChange={e => setPersonForm({ ...personForm, department: e.target.value })} />
              </div>
              <div>
                <label className="label">شیفت</label>
                <select className="select" value={personForm.shift} onChange={e => setPersonForm({ ...personForm, shift: e.target.value })}>
                  <option value="morning">صبحکار</option>
                  <option value="evening">عصرکار</option>
                  <option value="night">شب‌کار</option>
                  <option value="rotational">چرخشی</option>
                </select>
              </div>
              <div>
                <label className="label">تلفن</label>
                <input className="input" value={personForm.phone} onChange={e => setPersonForm({ ...personForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">ایمیل</label>
                <input className="input" value={personForm.email} onChange={e => setPersonForm({ ...personForm, email: e.target.value })} />
              </div>
              <div>
                <label className="label">تاریخ استخدام</label>
                <input type="date" className="input" value={personForm.hireDate} onChange={e => setPersonForm({ ...personForm, hireDate: e.target.value })} />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="checkbox" checked={personForm.isActive} onChange={e => setPersonForm({ ...personForm, isActive: e.target.checked })} />
                  فعال
                </label>
              </div>
              <div className="col-span-2">
                <label className="label">مهارت‌ها (با ویرگول جدا کنید)</label>
                <input className="input" value={personForm.skills} onChange={e => setPersonForm({ ...personForm, skills: e.target.value })} placeholder="مکانیک, برق, جوشکاری, ..." />
              </div>
              <div className="col-span-2">
                <label className="label">توضیحات</label>
                <textarea className="textarea" value={personForm.notes} onChange={e => setPersonForm({ ...personForm, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowPersonModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={savePerson}><Check size={16} /> {editPerson ? 'ذخیره تغییرات' : 'ثبت پرسنل'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
          <div className="modal-content p-6 max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">ثبت ورود و خروج</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowAttendanceModal(false)}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">پرسنل</label>
                <select className="select" value={attendanceForm.personnelId} onChange={e => setAttendanceForm({ ...attendanceForm, personnelId: Number(e.target.value) })}>
                  <option value={0}>-- انتخاب کنید --</option>
                  {personnel.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">تاریخ</label>
                <input type="date" className="input" value={attendanceForm.attendanceDate} onChange={e => setAttendanceForm({ ...attendanceForm, attendanceDate: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">ساعت ورود</label>
                  <input type="time" className="input" value={attendanceForm.checkIn} onChange={e => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })} />
                </div>
                <div>
                  <label className="label">ساعت خروج</label>
                  <input type="time" className="input" value={attendanceForm.checkOut} onChange={e => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">وضعیت</label>
                <select className="select" value={attendanceForm.status} onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value })}>
                  <option value="present">حاضر</option>
                  <option value="absent">غایب</option>
                  <option value="leave">مرخصی</option>
                  <option value="half_day">نیم روز</option>
                </select>
              </div>
              <div>
                <label className="label">توضیحات</label>
                <textarea className="textarea" value={attendanceForm.notes} onChange={e => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowAttendanceModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={saveAttendance}><Check size={16} /> ثبت</button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-content p-6 max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">درخواست مرخصی</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowLeaveModal(false)}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">پرسنل</label>
                <select className="select" value={leaveForm.personnelId} onChange={e => setLeaveForm({ ...leaveForm, personnelId: Number(e.target.value) })}>
                  <option value={0}>-- انتخاب کنید --</option>
                  {personnel.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">نوع مرخصی</label>
                <select className="select" value={leaveForm.leaveType} onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}>
                  <option value="annual">استحقاقی</option>
                  <option value="sick">استعلاجی</option>
                  <option value="casual">ساعتی</option>
                  <option value="unpaid">بدون حقوق</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">از تاریخ</label>
                  <input type="date" className="input" value={leaveForm.fromDate} onChange={e => setLeaveForm({ ...leaveForm, fromDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">تا تاریخ</label>
                  <input type="date" className="input" value={leaveForm.toDate} onChange={e => setLeaveForm({ ...leaveForm, toDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">تعداد روز</label>
                <input type="number" className="input" value={leaveForm.days} onChange={e => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">دلیل</label>
                <textarea className="textarea" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={saveLeave}><Check size={16} /> ثبت درخواست</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
