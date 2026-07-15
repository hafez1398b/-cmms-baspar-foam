'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTechnicalPersonnelStore, useWOStore, useLogStore, useEquipmentStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth';
import type { TechnicalPersonnel } from '@/lib/store';
import { useUIStore } from '@/lib/store';
import { Plus, Edit2, Trash2, Search, X, Check, Download, Printer, User, FileText, Wrench, Calendar, Activity, Eye, Lock, Key } from 'lucide-react';
import { toPersianDigits, formatJalali, exportToExcel, printContent } from '@/lib/utils';
import JalaliDateTimePicker from './JalaliDateTimePicker';

// Initial data from the user's image
export const INITIAL_TECHNICAL_PERSONNEL: TechnicalPersonnel[] = [
  { id: 101, codeNET: '1110', codePersonnel: '401179', firstName: 'چری', lastName: 'جهانمرادی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1365-03-29', placeOfBirth: 'کرد', idNumber: '129201784', address: 'مامونیه', mobile: '09187266931', situation: '1', companyDate: '1396-02-02', netDate: '1396-02-02', createdAt: new Date().toISOString() },
  { id: 102, codeNET: '1111', codePersonnel: '401842', firstName: 'جواد', lastName: 'سجاسول', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1362-06-10', placeOfBirth: 'گرگان', idNumber: '487965487', address: 'مامونیه', mobile: '09386327373', situation: '1', companyDate: '1396-09-11', netDate: '1396-09-11', createdAt: new Date().toISOString() },
  { id: 103, codeNET: '1112', codePersonnel: '401817', firstName: 'روح الله', lastName: 'پیری', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1359-03-02', placeOfBirth: 'کرد', idNumber: '2949124305', mobile: '09191288206', situation: '1', companyDate: '1386-01-01', netDate: '1386-01-01', createdAt: new Date().toISOString() },
  { id: 104, codeNET: '1113', codePersonnel: '401888', firstName: 'حسن', lastName: 'اشاعری', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1368-04-07', placeOfBirth: 'مامونیه', idNumber: '059001985', address: 'مامونیه', mobile: '09351801483', situation: '1', companyDate: '1401-05-15', netDate: '1401-05-15', createdAt: new Date().toISOString() },
  { id: 105, codeNET: '1114', codePersonnel: '401614', firstName: 'جبرائیل', lastName: 'مال پسندانی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1361-03-01', placeOfBirth: 'ترک', idNumber: '1651950903', mobile: '09375997862', situation: '1', companyDate: '1390-12-09', netDate: '1390-12-09', createdAt: new Date().toISOString() },
  { id: 106, codeNET: '1115', codePersonnel: '401140', firstName: 'سعید', lastName: 'خداورد', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1360-03-01', placeOfBirth: 'تهران', idNumber: '045306445', address: 'پرند', mobile: '09912701201', situation: '1', companyDate: '1395-04-05', netDate: '1395-04-05', createdAt: new Date().toISOString() },
  { id: 107, codeNET: '1117', codePersonnel: '401815', firstName: 'حسین', lastName: 'نجفیان', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1360-03-02', placeOfBirth: 'ترک', idNumber: '1600922228', mobile: '09354342212', situation: '1', companyDate: '1393-11-11', netDate: '1393-11-11', createdAt: new Date().toISOString() },
  { id: 108, codeNET: '1118', codePersonnel: '401143', firstName: 'یوسف', lastName: 'اله ورز زاده', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1354-06-01', placeOfBirth: 'ترک', idNumber: '1620119250', mobile: '09358014098', situation: '1', companyDate: '1393-07-01', netDate: '1393-07-01', createdAt: new Date().toISOString() },
  { id: 109, codeNET: '1119', codePersonnel: '401880', firstName: 'رضا', lastName: 'نوری', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1352-09-02', placeOfBirth: 'سراب', idNumber: '1651871833', mobile: '09052051965', situation: '1', companyDate: '1400-07-21', netDate: '1400-07-21', createdAt: new Date().toISOString() },
  { id: 110, codeNET: '1120', codePersonnel: '401886', firstName: 'جلیل', lastName: 'بساحی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1359-01-20', placeOfBirth: 'اسلام آباد غرب', idNumber: '1158', nationalCode: '334070155', address: 'مامونیه', mobile: '09170124147', situation: '1', companyDate: '1401-06-01', netDate: '1401-06-01', createdAt: new Date().toISOString() },
  { id: 111, codeNET: '1121', codePersonnel: '401860', firstName: 'عرفان', lastName: 'بخشیاری', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1379-01-21', placeOfBirth: 'لر', idNumber: '6180063397', mobile: '09100527179', situation: '1', createdAt: new Date().toISOString() },
  { id: 112, codeNET: '1123', codePersonnel: '401621', firstName: 'علی', lastName: 'محمدی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1360-01-15', placeOfBirth: 'لر', idNumber: '1533641986', mobile: '09012124503', situation: '1', createdAt: new Date().toISOString() },
  { id: 113, codeNET: '1124', codePersonnel: '401180', firstName: 'علی', lastName: 'عباسی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1358-03-02', placeOfBirth: 'ترک', idNumber: '4283586471', mobile: '09198249621', situation: '1', createdAt: new Date().toISOString() },
  { id: 114, codeNET: 'B1pm', codePersonnel: '401***', firstName: 'علی', lastName: 'جهان مرادی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1360-05-20', placeOfBirth: 'کرد', zipCode: '113', mobile: '09912701208', situation: '1', createdAt: new Date().toISOString() },
  { id: 115, codeNET: 'B1pm1', codePersonnel: '401154', firstName: 'علی', lastName: 'پیر حیاتی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1367-07-01', placeOfBirth: 'بوسینان', idNumber: '528006670', nationalCode: '528006670', address: 'استان مرکزی', mobile: '09167950773', situation: '1', companyDate: '1397-09-24', netDate: '1398-01-25', createdAt: new Date().toISOString() },
  { id: 116, codeNET: 'B1pm2', codePersonnel: '401116', firstName: 'نجات', lastName: 'بابایی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1358-06-19', placeOfBirth: 'سر پل ذهاب', idNumber: '494890885', nationalCode: '494890885', address: 'ک هران،رباط', mobile: '09120396150', situation: '1', companyDate: '1392-01-18', netDate: '1395-01-25', createdAt: new Date().toISOString() },
  { id: 117, codeNET: 'B1pm3', codePersonnel: '401***', firstName: 'عزت', lastName: 'شاخگینی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1364-05-01', placeOfBirth: 'لر', createdAt: new Date().toISOString() },
  { id: 118, codeNET: 'B3A', codePersonnel: '401804', firstName: 'فرج', lastName: 'صالحی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1347-05-01', placeOfBirth: 'کرد', idNumber: '293836605', address: 'مامونیه', mobile: '09197911362', situation: '1', createdAt: new Date().toISOString() },
  { id: 119, codeNET: 'B3Pm1', codePersonnel: '401822', firstName: 'داوود', lastName: 'انصار', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1368-01-02', placeOfBirth: 'زنجان', idNumber: '0', nationalCode: '436004323', address: 'رباط کریم', mobile: '09388661392', situation: '1', createdAt: new Date().toISOString() },
  { id: 120, codeNET: 'M1', codePersonnel: '401898', firstName: 'حافظ', lastName: 'بابرامان', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1367-12-29', placeOfBirth: 'تهران', idNumber: '101002475', nationalCode: '001002475', address: 'پرند', zipCode: '119', mobile: '09912214983', situation: '1', companyDate: '1402-05-21', netDate: '1402-06-01', createdAt: new Date().toISOString() },
  { id: 121, codeNET: 'M1', codePersonnel: '401141', firstName: 'اسماعیل', lastName: 'قربانی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1364-05-01', placeOfBirth: 'تهاب', idNumber: '6', nationalCode: '294996835', address: 'تهران،بهاسبت', mobile: '09912214985', situation: '1', companyDate: '1395-05-02', netDate: '1398-01-25', createdAt: new Date().toISOString() },
  { id: 122, codeNET: 'M2', codePersonnel: '401170', firstName: 'محمد', lastName: 'آبادمحمد', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1355-01-01', placeOfBirth: 'کارا', idNumber: '2', nationalCode: '571982391', address: 'ک تهران،رباط', mobile: '09106180214', situation: '1', companyDate: '1395-11-01', netDate: '1398-01-25', createdAt: new Date().toISOString() },
  { id: 123, codeNET: 'M3', codePersonnel: '401112', firstName: 'اصغر', lastName: 'رضایی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1366-11-22', placeOfBirth: 'رزن', idNumber: '171', nationalCode: '399255074', address: 'تهران،شهریار', mobile: '09364105854', situation: '1', companyDate: '1402-07-01', netDate: '1398-01-25', createdAt: new Date().toISOString() },
  { id: 124, codeNET: 'M4', codePersonnel: '401915', firstName: 'رضا', lastName: 'حاجی امینی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1363-08-05', placeOfBirth: 'ساوه', idNumber: '55', nationalCode: '060321010', address: 'استان مرکزی', mobile: '09182503418', situation: '1', companyDate: '1403-06-06', netDate: '1403-06-24', createdAt: new Date().toISOString() },
  { id: 125, codeNET: 'M5', codePersonnel: '401244', firstName: 'احمد', lastName: 'کودوسی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1370-05-05', placeOfBirth: 'ساوه', idNumber: '590137182', nationalCode: '590137182', address: 'استان مرکزی', mobile: '09395551003', situation: '1', companyDate: '1402-07-04', netDate: '1402-07-04', createdAt: new Date().toISOString() },
  { id: 126, codeNET: 'M6', codePersonnel: '401***', firstName: 'علی', lastName: 'ایوبی', contractType: 'قراردادی', gender: 'مرد', dateOfBirth: '1362-08-20', placeOfBirth: 'آبادان', idNumber: '123', nationalCode: '065643132', address: 'مامونیه', mobile: '09102123327', situation: '1', companyDate: '1403-02-25', netDate: '1403-02-25', createdAt: new Date().toISOString() },
];

export default function TechnicalPersonnelPage() {
  const { technicalPersonnel, setTechnicalPersonnel, addTechnicalPersonnel, updateTechnicalPersonnel, deleteTechnicalPersonnel } = useTechnicalPersonnelStore();
  const { users, addUser } = useAuthStore();
  const { workOrders } = useWOStore();
  const { logs } = useLogStore();
  const { equipment } = useEquipmentStore();
  const { showNotification } = useUIStore();

  // Initialize with default data
  useEffect(() => {
    if (technicalPersonnel.length === 0) {
      setTechnicalPersonnel(INITIAL_TECHNICAL_PERSONNEL);
    }
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [viewPerson, setViewPerson] = useState<TechnicalPersonnel | null>(null);
  const [editItem, setEditItem] = useState<TechnicalPersonnel | null>(null);
  const [search, setSearch] = useState('');
  const [showCreateAccount, setShowCreateAccount] = useState<number | null>(null);
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const emptyPerson = (): TechnicalPersonnel => ({
    id: Date.now(),
    codeNET: '',
    codePersonnel: '',
    firstName: '',
    lastName: '',
    contractType: 'قراردادی',
    gender: 'مرد',
    createdAt: new Date().toISOString(),
  });

  const [form, setForm] = useState<TechnicalPersonnel>(emptyPerson());

  const filtered = useMemo(() => {
    return technicalPersonnel.filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return p.firstName.includes(search) || p.lastName.includes(search) || p.codeNET.toLowerCase().includes(s) || p.codePersonnel.includes(search) || (p.mobile || '').includes(search) || (p.nationalCode || '').includes(search);
    });
  }, [technicalPersonnel, search]);

  const openNew = () => {
    setEditItem(null);
    setForm(emptyPerson());
    setShowModal(true);
  };

  const openEdit = (p: TechnicalPersonnel) => {
    setEditItem(p);
    setForm({ ...p });
    setShowModal(true);
  };

  const save = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { showNotification('error', 'نام و نام خانوادگی الزامی است.'); return; }
    if (editItem) {
      updateTechnicalPersonnel(editItem.id, form);
      showNotification('success', 'اطلاعات پرسنل به‌روز شد.');
    } else {
      addTechnicalPersonnel(form);
      showNotification('success', 'پرسنل جدید ثبت شد.');
    }
    setShowModal(false);
  };

  const remove = (id: number) => {
    if (confirm('آیا از حذف این پرسنل اطمینان دارید؟')) {
      deleteTechnicalPersonnel(id);
      showNotification('success', 'پرسنل حذف شد.');
    }
  };

  const createAccount = (personId: number) => {
    if (!newAccountUsername.trim() || !newAccountPassword.trim()) {
      showNotification('error', 'نام کاربری و رمز عبور الزامی است.');
      return;
    }
    if (users.find(u => u.username === newAccountUsername)) {
      showNotification('error', 'این نام کاربری قبلاً ثبت شده است.');
      return;
    }
    const person = technicalPersonnel.find(p => p.id === personId);
    if (!person) return;
    const newUserId = Date.now();
    addUser({
      id: newUserId,
      username: newAccountUsername,
      password: newAccountPassword,
      fullName: `${person.firstName} ${person.lastName}`,
      role: 'technician',
      department: 'تعمیرات',
      personnelId: personId,
      isActive: true,
      avatarColor: '#3b82f6',
      createdAt: new Date().toISOString(),
    });
    updateTechnicalPersonnel(personId, { accountId: newUserId });
    showNotification('success', `حساب کاربری ${newAccountUsername} ایجاد شد.`);
    setShowCreateAccount(null);
    setNewAccountUsername('');
    setNewAccountPassword('');
  };

  const getPersonStats = (personId: number) => {
    const person = technicalPersonnel.find(p => p.id === personId);
    if (!person) return { pmCount: 0, repairCount: 0, woCount: 0, equipmentCount: 0 };
    const fullName = `${person.firstName} ${person.lastName}`;
    const pmCount = logs.filter(l => l.performedBy === fullName && l.activityType === 'pm').length;
    const repairCount = logs.filter(l => l.performedBy === fullName && l.activityType === 'repair').length;
    const woCount = workOrders.filter(w => w.assignedTo === person.accountId).length;
    const equipmentCount = equipment.filter(e => e.authorizedPersonnel?.includes(fullName)).length;
    return { pmCount, repairCount, woCount, equipmentCount };
  };

  const exportExcel = () => {
    exportToExcel(technicalPersonnel, 'technical-personnel', [
      { key: 'codeNET', label: 'CodeNET' },
      { key: 'codePersonnel', label: 'کد پرسنلی' },
      { key: 'firstName', label: 'نام' },
      { key: 'lastName', label: 'نام خانوادگی' },
      { key: 'contractType', label: 'نوع قرارداد' },
      { key: 'gender', label: 'جنسیت' },
      { key: 'dateOfBirth', label: 'تاریخ تولد' },
      { key: 'placeOfBirth', label: 'محل تولد' },
      { key: 'nationalCode', label: 'کد ملی' },
      { key: 'mobile', label: 'موبایل' },
      { key: 'email', label: 'ایمیل' },
    ]);
  };

  const handlePrint = () => {
    const html = `
      <h2>لیست پرسنل فنی</h2>
      <table border="1" cellpadding="5">
        <tr><th>کد NET</th><th>کد پرسنلی</th><th>نام</th><th>نام خانوادگی</th><th>قرارداد</th><th>موبایل</th></tr>
        ${filtered.map(p => `<tr><td>${p.codeNET}</td><td>${p.codePersonnel}</td><td>${p.firstName}</td><td>${p.lastName}</td><td>${p.contractType}</td><td>${p.mobile || '-'}</td></tr>`).join('')}
      </table>
    `;
    printContent('لیست پرسنل فنی', html);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, avatarUrl: reader.result as string, txtImageName: file.name }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title mb-0">پرسنل فنی ({toPersianDigits(technicalPersonnel.length)})</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className="input !pr-10 !w-56" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={exportExcel}><Download size={16} /> Excel</button>
          <button className="btn btn-secondary" onClick={handlePrint}><Printer size={16} /> چاپ</button>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> پرسنل جدید</button>
        </div>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(p => {
          const stats = getPersonStats(p.id);
          const hasAccount = !!p.accountId;
          const account = users.find(u => u.id === p.accountId);
          return (
            <div key={p.id} className="card hover:border-[var(--gold)] transition-all">
              <div className="flex items-start gap-3 mb-3">
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-[var(--border)]" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-[#0a0a0b] font-bold text-lg shrink-0">
                    {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{p.firstName} {p.lastName}</div>
                  <div className="text-[10px] text-[var(--foreground-muted)] flex flex-wrap gap-1 mt-0.5">
                    <span className="font-mono">NET: {p.codeNET}</span>
                    <span>•</span>
                    <span className="font-mono">P: {p.codePersonnel}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="badge badge-info">{p.contractType}</span>
                    <span className="badge badge-neutral">{p.gender}</span>
                    {hasAccount && <span className="badge badge-success flex items-center gap-1"><Lock size={8} /> اکانت</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 text-center text-[10px] mb-3 py-2 bg-[var(--background-secondary)] rounded-lg">
                <div><div className="font-bold text-[var(--gold)]">{toPersianDigits(stats.pmCount)}</div><div className="text-[var(--foreground-muted)]">PM</div></div>
                <div><div className="font-bold text-[var(--danger)]">{toPersianDigits(stats.repairCount)}</div><div className="text-[var(--foreground-muted)]">تعمیر</div></div>
                <div><div className="font-bold text-[var(--info)]">{toPersianDigits(stats.woCount)}</div><div className="text-[var(--foreground-muted)]">WO</div></div>
                <div><div className="font-bold text-[var(--success)]">{toPersianDigits(stats.equipmentCount)}</div><div className="text-[var(--foreground-muted)]">تجهیز</div></div>
              </div>

              <div className="space-y-1 text-xs text-[var(--foreground-secondary)] mb-3">
                {p.mobile && <div className="flex items-center gap-1" dir="ltr">📱 {p.mobile}</div>}
                {p.nationalCode && <div>🆔 {p.nationalCode}</div>}
                {p.address && <div className="truncate">📍 {p.address}</div>}
              </div>

              <div className="flex gap-1 flex-wrap">
                <button className="btn btn-ghost !p-1 !text-xs" onClick={() => setViewPerson(p)}><Eye size={12} /> مشاهده</button>
                <button className="btn btn-ghost !p-1 !text-xs" onClick={() => openEdit(p)}><Edit2 size={12} /> ویرایش</button>
                {!hasAccount ? (
                  <button className="btn btn-ghost !p-1 !text-xs text-[var(--gold)]" onClick={() => { setShowCreateAccount(p.id); setNewAccountUsername(p.codeNET.toLowerCase()); setNewAccountPassword('1234'); }}><Key size={12} /> ساخت اکانت</button>
                ) : (
                  <span className="btn btn-ghost !p-1 !text-xs text-[var(--success)]"><Check size={12} /> {account?.username}</span>
                )}
                <button className="btn btn-ghost !p-1 !text-xs text-[var(--danger)]" onClick={() => remove(p.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Modal */}
      {viewPerson && (
        <div className="modal-overlay" onClick={() => setViewPerson(null)}>
          <div className="modal-content p-6 max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">پروفایل پرسنل</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setViewPerson(null)}><X size={18} /></button>
            </div>
            <div className="flex items-start gap-4 mb-4">
              {viewPerson.avatarUrl ? (
                <img src={viewPerson.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-[var(--gold)]" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-[#0a0a0b] font-bold text-2xl">
                  {viewPerson.firstName.charAt(0)}{viewPerson.lastName.charAt(0)}
                </div>
              )}
              <div>
                <h4 className="text-xl font-bold">{viewPerson.firstName} {viewPerson.lastName}</h4>
                <div className="text-sm text-[var(--foreground-muted)]">کد NET: {viewPerson.codeNET} | کد پرسنلی: {viewPerson.codePersonnel}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
              <Info label="نوع قرارداد" value={viewPerson.contractType} />
              <Info label="جنسیت" value={viewPerson.gender} />
              <Info label="تاریخ تولد" value={viewPerson.dateOfBirth ? formatJalali(viewPerson.dateOfBirth) : '-'} />
              <Info label="محل تولد" value={viewPerson.placeOfBirth} />
              <Info label="شماره شناسنامه" value={viewPerson.idNumber} />
              <Info label="کد ملی" value={viewPerson.nationalCode} />
              <Info label="آدرس" value={viewPerson.address} />
              <Info label="کد پستی" value={viewPerson.zipCode} />
              <Info label="تلفن" value={viewPerson.phone} />
              <Info label="موبایل" value={viewPerson.mobile} />
              <Info label="ایمیل" value={viewPerson.email} />
              <Info label="وضعیت" value={viewPerson.situation} />
              <Info label="تاریخ استخدام" value={viewPerson.companyDate ? formatJalali(viewPerson.companyDate) : '-'} />
              <Info label="تاریخ ثبت NET" value={viewPerson.netDate ? formatJalali(viewPerson.netDate) : '-'} />
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <StatBox label="PM انجام شده" value={getPersonStats(viewPerson.id).pmCount} color="#D4A555" />
              <StatBox label="تعمیرات" value={getPersonStats(viewPerson.id).repairCount} color="#ef4444" />
              <StatBox label="دستور کار" value={getPersonStats(viewPerson.id).woCount} color="#3b82f6" />
              <StatBox label="تجهیزات مسئول" value={getPersonStats(viewPerson.id).equipmentCount} color="#22c55e" />
            </div>

            <div className="flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setViewPerson(null)}>بستن</button>
              <button className="btn btn-primary" onClick={() => { setViewPerson(null); openEdit(viewPerson); }}><Edit2 size={14} /> ویرایش</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/New Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6 max-w-3xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{editItem ? 'ویرایش پرسنل' : 'پرسنل جدید'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">CodeNET *</label>
                <input className="input" value={form.codeNET} onChange={e => setForm({ ...form, codeNET: e.target.value })} />
              </div>
              <div>
                <label className="label">کد پرسنلی *</label>
                <input className="input" value={form.codePersonnel} onChange={e => setForm({ ...form, codePersonnel: e.target.value })} />
              </div>
              <div>
                <label className="label">نام *</label>
                <input className="input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className="label">نام خانوادگی *</label>
                <input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div>
                <label className="label">نوع قرارداد</label>
                <select className="select" value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })}>
                  <option value="قراردادی">قراردادی</option>
                  <option value="رسمی">رسمی</option>
                  <option value="پیمانی">پیمانی</option>
                  <option value="ساعتی">ساعتی</option>
                </select>
              </div>
              <div>
                <label className="label">جنسیت</label>
                <select className="select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="مرد">مرد</option>
                  <option value="زن">زن</option>
                </select>
              </div>
              <div>
                <label className="label">تاریخ تولد</label>
                <JalaliDateTimePicker value={form.dateOfBirth || ''} onChange={iso => setForm({ ...form, dateOfBirth: iso.split('T')[0] })} showTime={false} />
              </div>
              <div>
                <label className="label">محل تولد</label>
                <input className="input" value={form.placeOfBirth || ''} onChange={e => setForm({ ...form, placeOfBirth: e.target.value })} />
              </div>
              <div>
                <label className="label">شماره شناسنامه</label>
                <input className="input" value={form.idNumber || ''} onChange={e => setForm({ ...form, idNumber: e.target.value })} />
              </div>
              <div>
                <label className="label">کد ملی</label>
                <input className="input" value={form.nationalCode || ''} onChange={e => setForm({ ...form, nationalCode: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="label">آدرس</label>
                <input className="input" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="label">کد پستی</label>
                <input className="input" value={form.zipCode || ''} onChange={e => setForm({ ...form, zipCode: e.target.value })} />
              </div>
              <div>
                <label className="label">تلفن</label>
                <input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">موبایل</label>
                <input className="input" value={form.mobile || ''} onChange={e => setForm({ ...form, mobile: e.target.value })} />
              </div>
              <div>
                <label className="label">ایمیل</label>
                <input className="input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">وضعیت</label>
                <input className="input" value={form.situation || ''} onChange={e => setForm({ ...form, situation: e.target.value })} />
              </div>
              <div>
                <label className="label">تاریخ استخدام</label>
                <JalaliDateTimePicker value={form.companyDate || ''} onChange={iso => setForm({ ...form, companyDate: iso.split('T')[0] })} showTime={false} />
              </div>
              <div>
                <label className="label">تاریخ ثبت NET</label>
                <JalaliDateTimePicker value={form.netDate || ''} onChange={iso => setForm({ ...form, netDate: iso.split('T')[0] })} showTime={false} />
              </div>
              <div className="md:col-span-2">
                <label className="label">تصویر پرسنل</label>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <button type="button" className="btn btn-secondary w-full" onClick={() => fileRef.current?.click()}>
                  {form.avatarUrl ? `تصویر انتخاب شده: ${form.txtImageName}` : 'انتخاب تصویر'}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={save}><Check size={16} /> ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateAccount !== null && (
        <div className="modal-overlay" onClick={() => setShowCreateAccount(null)}>
          <div className="modal-content p-6 max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2"><Key size={18} className="text-[var(--gold)]" /> ساخت حساب کاربری</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowCreateAccount(null)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">نام کاربری</label>
                <input className="input font-mono" value={newAccountUsername} onChange={e => setNewAccountUsername(e.target.value)} />
              </div>
              <div>
                <label className="label">رمز عبور</label>
                <input type="password" className="input" value={newAccountPassword} onChange={e => setNewAccountPassword(e.target.value)} />
              </div>
              <div className="p-3 bg-[var(--background-secondary)] rounded-lg text-xs text-[var(--foreground-muted)]">
                این حساب با نقش <strong>تکنسین</strong> ایجاد می‌شود و به این پرسنل متصل خواهد شد.
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-secondary" onClick={() => setShowCreateAccount(null)}>انصراف</button>
              <button className="btn btn-primary" onClick={() => createAccount(showCreateAccount)}><Check size={16} /> ایجاد حساب</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[10px] text-[var(--foreground-muted)]">{label}</div>
      <div className="font-medium">{value || '-'}</div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg text-center" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
      <div className="text-2xl font-bold" style={{ color }}>{toPersianDigits(value)}</div>
      <div className="text-[10px] text-[var(--foreground-muted)] mt-1">{label}</div>
    </div>
  );
}
