'use client';
import React, { useState, useMemo } from 'react';
import { useEquipmentStore, useLogStore, usePMStore } from '@/lib/store';
import { useUIStore } from '@/lib/store';
import type { Equipment } from '@/lib/store';
import { buildTree, flattenTree, formatJalali, toPersianDigits, exportToExcel, nodeTypeLabels, equipmentStatusMap, frequencyLabels, getDefaultPMPlans } from '@/lib/utils';
import {
  ChevronRight, ChevronDown, Plus, Edit2, Trash2, Download, Search, X, Check,
  Factory, FileText, Calendar, Package, Clock, Wrench, Hammer, Boxes,
  MapPin, User as UserIcon, Settings, History, Copy, Archive, Eye, Filter, QrCode, Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import EquipmentPassport from './EquipmentPassport';

type Tab = 'profile' | 'history' | 'pm' | 'documents' | 'spareparts';

export default function EquipmentTree() {
  const { equipment, addEquipment, updateEquipment, deleteEquipment } = useEquipmentStore();
  const { logs } = useLogStore();
  const { pmPlans, addPMPlan, setPMPlans } = usePMStore();
  const { showNotification } = useUIStore();
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1, 2, 3]));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<Equipment | null>(null);
  const [parentForNew, setParentForNew] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [historyFilter, setHistoryFilter] = useState({ type: 'all', from: '', to: '' });
  const [showList, setShowList] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [showQRList, setShowQRList] = useState(false);
  const [showPassport, setShowPassport] = useState(false);

  const tree = useMemo(() => buildTree(equipment), [equipment]);
  const flatEquipment = useMemo(() => flattenTree(tree), [tree]);
  const selected = equipment.find(e => e.id === selectedId);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const match = (name: string) => name.toLowerCase().includes(search.toLowerCase());
    const filterTree = (nodes: any[]): any[] => {
      return nodes
        .map(n => {
          const children = filterTree(n.children || []);
          if (match(n.name) || n.serialNumber?.toLowerCase().includes(search.toLowerCase()) || n.feCode?.toLowerCase().includes(search.toLowerCase()) || children.length > 0) {
            return { ...n, children, _expanded: true };
          }
          return null;
        })
        .filter(Boolean) as any[];
    };
    return filterTree(tree);
  }, [tree, search]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedLogs = useMemo(() => {
    if (!selectedId) return [];
    // Find all child equipment IDs (including self)
    const childIds = new Set<number>([selectedId]);
    const collectChildren = (parentId: number) => {
      equipment.filter(e => e.parentId === parentId).forEach(c => {
        childIds.add(c.id);
        collectChildren(c.id);
      });
    };
    collectChildren(selectedId);
    return logs.filter(l => childIds.has(l.equipmentId));
  }, [selectedId, logs, equipment]);

  const selectedPMs = useMemo(() => {
    if (!selectedId) return [];
    return pmPlans.filter(p => p.equipmentId === selectedId);
  }, [selectedId, pmPlans]);

  const [form, setForm] = useState({
    name: '', model: '', serialNumber: '', pmCode: '', feCode: '', manufacturer: '', country: '',
    location: '', nodeType: 'machine', parentId: null as number | null, status: 'active',
    level: 0, isLeaf: true, authorizedPersonnel: '', hasPM: true,
    pcRequired: false, ncrRequired: false, cbuRequired: false,
    calibrationPeriod: '', calibrationType: '', capacity: '', power: '', voltage: '', manufactureYear: '',
  });

  const openAdd = (parentId: number | null) => {
    setEditItem(null);
    setParentForNew(parentId);
    const parent = parentId ? equipment.find(e => e.id === parentId) : null;
    setForm({
      name: '', model: '', serialNumber: '', pmCode: '', feCode: '', manufacturer: '', country: '',
      location: parent?.location || '', nodeType: parent ? (parent.nodeType === 'factory' ? 'site' : parent.nodeType === 'site' ? 'unit' : parent.nodeType === 'unit' ? 'line' : parent.nodeType === 'line' ? 'machine' : 'component') : 'factory',
      parentId, status: 'active', level: parent ? parent.level + 1 : 0, isLeaf: true,
      authorizedPersonnel: '', hasPM: true, pcRequired: false, ncrRequired: false, cbuRequired: false,
      calibrationPeriod: '', calibrationType: '', capacity: '', power: '', voltage: '', manufactureYear: '',
    });
    setShowAddModal(true);
  };

  const openEdit = (eq: Equipment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditItem(eq);
    setForm({
      name: eq.name, model: eq.model || '', serialNumber: eq.serialNumber || '', pmCode: eq.pmCode || '', feCode: eq.feCode || '',
      manufacturer: eq.manufacturer || '', country: eq.country || '', location: eq.location || '',
      nodeType: eq.nodeType, parentId: eq.parentId, status: eq.status, level: eq.level, isLeaf: eq.isLeaf,
      authorizedPersonnel: eq.authorizedPersonnel || '', hasPM: eq.hasPM ?? true, pcRequired: eq.pcRequired ?? false,
      ncrRequired: eq.ncrRequired ?? false, cbuRequired: eq.cbuRequired ?? false,
      calibrationPeriod: eq.calibrationPeriod || '', calibrationType: eq.calibrationType || '',
      capacity: eq.capacity || '', power: eq.power || '', voltage: eq.voltage || '', manufactureYear: eq.manufactureYear || '',
    });
    setShowAddModal(true);
  };

  const saveEquipment = () => {
    if (!form.name.trim()) { showNotification('error', 'نام تجهیز الزامی است.'); return; }
    if (editItem) {
      updateEquipment(editItem.id, form);
      showNotification('success', 'تجهیز با موفقیت به‌روز شد.');
    } else {
      const newId = Date.now();
      addEquipment({
        id: newId,
        ...form,
      } as Equipment);
      // Auto-generate PM plans for leaf machines
      if (form.isLeaf && form.hasPM && form.nodeType === 'machine') {
        const defaults = getDefaultPMPlans(form.name);
        defaults.forEach(d => {
          addPMPlan({
            id: Date.now() + Math.random() * 10000,
            equipmentId: newId,
            title: d.title,
            frequency: d.frequency,
            intervalDays: d.intervalDays,
            checklist: d.checklist,
            estimatedDuration: d.intervalDays <= 1 ? 30 : d.intervalDays <= 7 ? 60 : 120,
            isActive: true,
          } as any);
        });
      }
      showNotification('success', `تجهیز «${form.name}» با موفقیت ایجاد شد.`);
    }
    setShowAddModal(false);
  };

  const removeEquipment = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('آیا از حذف این تجهیز و تمام زیرمجموعه‌های آن اطمینان دارید؟')) {
      deleteEquipment(id);
      if (selectedId === id) setSelectedId(null);
      showNotification('success', 'تجهیز و زیرمجموعه‌های آن حذف شدند.');
    }
  };

  const duplicateEquipment = (eq: Equipment, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = Date.now();
    addEquipment({ ...eq, id: newId, name: eq.name + ' (کپی)', serialNumber: eq.serialNumber ? eq.serialNumber + '-COPY' : '', feCode: eq.feCode ? eq.feCode + '-C' : '' } as any);
    showNotification('success', 'تجهیز با موفقیت کپی شد.');
  };

  const exportAll = () => {
    const leaf = equipment.filter(e => e.isLeaf);
    exportToExcel(leaf, 'equipment-list', [
      { key: 'feCode', label: 'شماره شناسنامه' },
      { key: 'name', label: 'نام دستگاه' },
      { key: 'model', label: 'مدل' },
      { key: 'serialNumber', label: 'شماره سریال' },
      { key: 'pmCode', label: 'کد PM' },
      { key: 'manufacturer', label: 'سازنده' },
      { key: 'country', label: 'کشور' },
      { key: 'location', label: 'محل استفاده' },
      { key: 'calibrationPeriod', label: 'دوره کالیبراسیون' },
    ]);
  };

  const exportHistory = () => {
    exportToExcel(selectedLogs.map(l => ({
      ...l,
      eqName: equipment.find(e => e.id === l.equipmentId)?.name,
    })), `equipment-history-${selected?.feCode || selectedId}`, [
      { key: 'title', label: 'عنوان' },
      { key: 'eqName', label: 'تجهیز' },
      { key: 'activityType', label: 'نوع' },
      { key: 'performedBy', label: 'انجام‌دهنده' },
      { key: 'performedDate', label: 'تاریخ' },
      { key: 'durationMinutes', label: 'مدت (دقیقه)' },
    ]);
  };

  const renderNode = (node: any, depth: number = 0): React.ReactNode => {
    const isExpanded = expanded.has(node.id) || node._expanded;
    const isSelected = selectedId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    return (
      <div key={node.id}>
        <div
          className={`tree-node group ${isSelected ? 'selected' : ''}`}
          style={{ paddingRight: `${depth * 16 + 12}px` }}
          onClick={() => setSelectedId(node.id)}
        >
          {hasChildren ? (
            <button className="btn btn-ghost !p-0.5 !min-w-0" onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <span className="text-sm">{node.nodeType === 'factory' ? '🏭' : node.nodeType === 'site' ? '📍' : node.nodeType === 'unit' ? '🏢' : node.nodeType === 'line' ? '⚙️' : node.nodeType === 'component' ? '🔩' : '🔧'}</span>
          <span className="text-sm flex-1 truncate">{node.name}</span>
          {node.isLeaf && node.feCode && <span className="text-[10px] font-mono text-[var(--gold)]">{node.feCode}</span>}
          <div className="hidden group-hover:flex gap-0.5 mr-1">
            <button className="btn btn-ghost !p-1" onClick={(e) => { e.stopPropagation(); openAdd(node.id); }} title="افزودن زیرمجموعه">
              <Plus size={12} />
            </button>
            <button className="btn btn-ghost !p-1" onClick={(e) => openEdit(node, e)} title="ویرایش">
              <Edit2 size={12} />
            </button>
            <button className="btn btn-ghost !p-1" onClick={(e) => duplicateEquipment(node, e)} title="کپی">
              <Copy size={12} />
            </button>
            <button className="btn btn-ghost !p-1 text-[var(--danger)]" onClick={(e) => removeEquipment(node.id, e)} title="حذف">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && node.children.map((child: any) => renderNode(child, depth + 1))}
      </div>
    );
  };

  const nodeIcon: any = { factory: Factory, site: MapPin, unit: Factory, line: Settings, machine: Wrench, component: Package };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2">
          <button className={`btn ${showList ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowList(true)}>
            <Factory size={16} /> درخت تجهیزات
          </button>
          <button className={`btn ${!showList ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowList(false)}>
            <ListIcon size={16} /> لیست همه تجهیزات
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className="input !pr-10 !w-64" placeholder="جستجو در تجهیزات..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {showList && <button className="btn btn-secondary" onClick={exportAll}><Download size={16} /> خروجی اکسل</button>}
          <button className="btn btn-secondary" onClick={() => setShowQRList(true)} title="چاپ QR Code همه تجهیزات"><QrCode size={16} /> QR Code ها</button>
          {showList && <button className="btn btn-primary" onClick={() => openAdd(null)}><Plus size={16} /> افزودن ریشه جدید</button>}
        </div>
      </div>

      <div className={`flex-1 grid gap-4 overflow-hidden ${selected ? 'grid-cols-1 lg:grid-cols-[380px_1fr]' : 'grid-cols-1'}`}>
        {/* Tree / List */}
        <div className={`card overflow-y-auto ${selected ? 'max-h-[300px] lg:max-h-none' : ''}`}>
          {showList ? (
            <div>
              {filteredTree.length > 0 ? filteredTree.map(n => renderNode(n)) : (
                <div className="text-center py-8 text-[var(--foreground-muted)]">تجهیزی یافت نشد.</div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {flatEquipment.filter(e => e.isLeaf).filter(e =>
                !search || e.name.includes(search) || (e.serialNumber || '').includes(search) || (e.feCode || '').includes(search)
              ).map(e => (
                <div key={e.id} className={`tree-node ${selectedId === e.id ? 'selected' : ''}`} onClick={() => setSelectedId(e.id)}>
                  <span className="text-sm">🔧</span>
                  <span className="text-sm flex-1 truncate">{e.name}</span>
                  {e.feCode && <span className="text-[10px] font-mono text-[var(--gold)]">{e.feCode}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details panel */}
        <div className="card overflow-y-auto">
          {selected ? (
            <div>
              {/* Header */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold gold-text">{selected.name}</h2>
                    <span className={`badge ${equipmentStatusMap[selected.status]?.class}`}>{equipmentStatusMap[selected.status]?.label || selected.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--foreground-muted)]">
                    {selected.feCode && <span className="font-mono">شناسنامه: {selected.feCode}</span>}
                    {selected.pmCode && <span className="font-mono">PM: {selected.pmCode}</span>}
                    {selected.model && <span>مدل: {selected.model}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-ghost !p-2" onClick={() => openEdit(selected)} title="ویرایش"><Edit2 size={16} /></button>
                  <button className="btn btn-ghost !p-2" onClick={() => {
                    const html = document.getElementById('eq-profile-print')?.innerHTML || '';
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`<html dir="rtl"><head><title>${selected.name}</title><style>body{font-family:Tahoma;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;text-align:right;}h1{text-align:center;}</style></head><body><h1>شناسنامه تجهیز</h1>${html}</body></html>`);
                      printWindow.document.close();
                      printWindow.print();
                    }
                    }} title="چاپ شناسنامه"><FileText size={16} /></button>
                  <button className="btn btn-ghost !p-2" onClick={() => setShowQR(true)} title="QR Code تجهیز">
                    <QrCode size={16} />
                  </button>
                  <button className="btn btn-primary !px-3 !py-2 !text-xs" onClick={() => setShowPassport(true)} title="پرونده دیجیتال تجهیز">
                    <FileText size={14} /> پرونده دیجیتال
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs mb-6">
                <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><Settings size={14} /> شناسنامه</button>
                <button className={`tab ${activeTab === 'pm' ? 'active' : ''}`} onClick={() => setActiveTab('pm')}><Calendar size={14} /> برنامه PM ({toPersianDigits(selectedPMs.length)})</button>
                <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><History size={14} /> سوابق ({toPersianDigits(selectedLogs.length)})</button>
                <button className={`tab ${activeTab === 'spareparts' ? 'active' : ''}`} onClick={() => setActiveTab('spareparts')}><Boxes size={14} /> قطعات</button>
                <button className={`tab ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}><FileText size={14} /> مدارک</button>
              </div>

              <div id="eq-profile-print">
                {activeTab === 'profile' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <ProfileField label="نوع/گره" value={nodeTypeLabels[selected.nodeType] || selected.nodeType} />
                    <ProfileField label="وضعیت" value={equipmentStatusMap[selected.status]?.label || selected.status} />
                    {selected.model && <ProfileField label="مدل (TYPE)" value={selected.model} />}
                    {selected.serialNumber && <ProfileField label="شماره سریال" value={selected.serialNumber} />}
                    {selected.pmCode && <ProfileField label="کد PM" value={selected.pmCode} />}
                    {selected.feCode && <ProfileField label="شماره شناسنامه (FE)" value={selected.feCode} />}
                    {selected.manufacturer && <ProfileField label="سازنده" value={selected.manufacturer} />}
                    {selected.country && <ProfileField label="کشور سازنده" value={selected.country} />}
                    {selected.location && <ProfileField label="محل استفاده" value={selected.location} />}
                    {selected.capacity && <ProfileField label="ظرفیت" value={selected.capacity} />}
                    {selected.power && <ProfileField label="توان" value={selected.power} />}
                    {selected.voltage && <ProfileField label="ولتاژ" value={selected.voltage} />}
                    {selected.manufactureYear && <ProfileField label="سال ساخت" value={selected.manufactureYear} />}
                    {selected.calibrationPeriod && <ProfileField label="دوره کالیبراسیون" value={selected.calibrationPeriod} />}
                    {selected.calibrationType && <ProfileField label="نوع کالیبراسیون" value={selected.calibrationType} />}
                    {selected.authorizedPersonnel && <ProfileField label="سمت مجاز به کار" value={selected.authorizedPersonnel} />}
                    <div className="flex gap-4 pt-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="checkbox" checked={selected.hasPM ?? false} readOnly /> PM دارد
                      </label>
                      {selected.pcRequired && <span className="badge badge-info">PC</span>}
                      {selected.ncrRequired && <span className="badge badge-warning">NCR</span>}
                      {selected.cbuRequired && <span className="badge badge-gold">CBU</span>}
                    </div>
                  </div>
                )}

                {activeTab === 'pm' && (
                  <div className="space-y-3">
                    {selectedPMs.length === 0 ? (
                      <div className="text-center py-8 text-[var(--foreground-muted)]">برنامه PM برای این تجهیز تعریف نشده است.</div>
                    ) : selectedPMs.map(p => (
                      <div key={p.id} className="p-4 bg-[var(--background-secondary)] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium flex items-center gap-2">
                            <Calendar size={16} className="text-[var(--gold)]" />
                            {p.title}
                          </div>
                          <span className="badge badge-gold">{frequencyLabels[p.frequency]}</span>
                        </div>
                        {p.checklist && p.checklist.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-[var(--foreground-muted)] mb-1">چک‌لیست:</div>
                            <ul className="list-disc pr-5 text-sm space-y-0.5">
                              {p.checklist.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-4 no-print">
                      <select className="select !w-auto" value={historyFilter.type} onChange={e => setHistoryFilter({ ...historyFilter, type: e.target.value })}>
                        <option value="all">همه انواع</option>
                        <option value="pm">PM</option>
                        <option value="repair">تعمیر</option>
                        <option value="inspection">بازرسی</option>
                        <option value="calibration">کالیبراسیون</option>
                      </select>
                      <button className="btn btn-secondary" onClick={exportHistory}><Download size={14} /> خروجی</button>
                    </div>
                    <div className="space-y-2">
                      {selectedLogs.filter(l => historyFilter.type === 'all' || l.activityType === historyFilter.type).map(log => (
                        <div key={log.id} className="p-3 bg-[var(--background-secondary)] rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-sm">{log.title}</div>
                              {log.description && <div className="text-xs text-[var(--foreground-muted)] mt-1">{log.description}</div>}
                            </div>
                            <span className={`badge ${log.activityType === 'pm' ? 'badge-gold' : log.activityType === 'repair' ? 'badge-danger' : 'badge-info'}`}>
                              {log.activityType === 'pm' ? 'PM' : log.activityType === 'repair' ? 'تعمیر' : log.activityType === 'inspection' ? 'بازرسی' : 'کالیبره'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-[var(--foreground-muted)]">
                            <span className="flex items-center gap-1"><Clock size={12} /> {formatJalali(log.performedDate)}</span>
                            <span><UserIcon size={12} className="inline ml-1" />{log.performedBy || '-'}</span>
                            <span>{toPersianDigits(log.durationMinutes || 0)} دقیقه</span>
                          </div>
                        </div>
                      ))}
                      {selectedLogs.filter(l => historyFilter.type === 'all' || l.activityType === historyFilter.type).length === 0 && (
                        <div className="text-center py-8 text-[var(--foreground-muted)]">سابقه‌ای ثبت نشده است.</div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'spareparts' && (
                  <div className="text-center py-8 text-[var(--foreground-muted)]">
                    <Boxes size={40} className="mx-auto mb-3 opacity-30" />
                    از بخش «قطعات یدکی» می‌توانید قطعات این تجهیز را مدیریت کنید.
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="text-center py-8 text-[var(--foreground-muted)]">
                    <FileText size={40} className="mx-auto mb-3 opacity-30" />
                    فایل و مدرک پیوست نشده است. از بخش «انبار فایل‌های اکسل» فایل‌ها را آپلود کنید.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--foreground-muted)]">
              <Wrench size={56} className="mb-4 opacity-20" />
              <p className="text-lg mb-1">یک تجهیز از درخت انتخاب کنید</p>
              <p className="text-sm">شناسنامه، سوابق و برنامه‌های PM تجهیز انتخاب شده در این قسمت نمایش داده می‌شود.</p>
            </div>
          )}
        </div>
      </div>

      {/* Single Equipment QR Modal */}
      {showQR && selected && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal-content p-6 max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2"><QrCode size={20} className="text-[var(--gold)]" /> QR Code تجهیز</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowQR(false)}><X size={18} /></button>
            </div>
            <div id="qr-print-area" className="bg-white p-6 rounded-lg text-center text-black">
              <div className="flex justify-center mb-4">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/eq/${selected.feCode || selected.pmCode || selected.serialNumber || selected.id}`}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="font-bold text-base mb-1">{selected.name}</div>
              {selected.model && <div className="text-sm">مدل: {selected.model}</div>}
              {selected.serialNumber && <div className="text-sm font-mono">سریال: {selected.serialNumber}</div>}
              {selected.feCode && <div className="text-sm font-mono">شناسنامه: {selected.feCode}</div>}
              {selected.pmCode && <div className="text-sm font-mono">کد PM: {selected.pmCode}</div>}
              {selected.location && <div className="text-xs mt-2">محل: {selected.location}</div>}
              <div className="text-[10px] mt-3 text-gray-600">بسپارفوم غرب - سامانه CMMS</div>
            </div>
            <div className="flex justify-end gap-2 mt-4 no-print">
              <button className="btn btn-secondary" onClick={() => setShowQR(false)}>بستن</button>
              <button className="btn btn-primary" onClick={() => {
                const printArea = document.getElementById('qr-print-area');
                if (!printArea) return;
                const w = window.open('', '_blank');
                if (!w) return;
                w.document.write(`
                  <html dir="rtl"><head><title>QR - ${selected.name}</title>
                  <style>body{font-family:Tahoma;padding:20px;text-align:center;} @media print{body{padding:10px;}}</style>
                  </head><body>${printArea.innerHTML}<script>window.onload=function(){window.print();}</script></body></html>
                `);
                w.document.close();
              }}><Printer size={16} /> چاپ برچسب</button>
            </div>
          </div>
        </div>
      )}

      {/* All QR Codes Modal */}
      {showQRList && (
        <div className="modal-overlay" onClick={() => setShowQRList(false)}>
          <div className="modal-content p-6 max-w-5xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2"><QrCode size={20} className="text-[var(--gold)]" /> QR Code همه تجهیزات (برای چاپ برچسب)</h3>
              <div className="flex gap-2">
                <button className="btn btn-secondary" onClick={() => {
                  const printArea = document.getElementById('qr-grid-print');
                  if (!printArea) return;
                  const w = window.open('', '_blank');
                  if (!w) return;
                  w.document.write(`
                    <html dir="rtl"><head><title>QR Codes</title>
                    <style>body{font-family:Tahoma;padding:10px;} .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;} .card{border:1px solid #000;padding:10px;text-align:center;page-break-inside:avoid;} @media print{body{padding:5px;}}</style>
                    </head><body>${printArea.innerHTML}<script>window.onload=function(){window.print();}</script></body></html>
                  `);
                  w.document.close();
                }}><Printer size={16} /> چاپ همه</button>
                <button className="btn btn-ghost !p-2" onClick={() => setShowQRList(false)}><X size={18} /></button>
              </div>
            </div>
            <div id="qr-grid-print" className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {equipment.filter(e => e.isLeaf).map(eq => (
                <div key={eq.id} className="bg-white text-black p-3 rounded-lg text-center border-2 border-black">
                  <div className="flex justify-center mb-2">
                    <QRCodeSVG
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/eq/${eq.feCode || eq.pmCode || eq.serialNumber || eq.id}`}
                      size={120}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <div className="font-bold text-xs mb-0.5">{eq.name}</div>
                  {eq.model && <div className="text-[10px]">{eq.model}</div>}
                  <div className="text-[10px] font-mono mt-1">{eq.feCode || eq.pmCode || eq.serialNumber || `ID-${eq.id}`}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Digital Passport */}
      {showPassport && selected && (
        <EquipmentPassport equipmentId={selected.id} onClose={() => setShowPassport(false)} />
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content p-6 max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{editItem ? 'ویرایش تجهیز' : 'افزودن تجهیز جدید'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">نام تجهیز *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">نوع گره</label>
                <select className="select" value={form.nodeType} onChange={e => {
                  const v = e.target.value;
                  const isLeaf = v === 'machine' || v === 'component';
                  setForm({ ...form, nodeType: v, isLeaf });
                }}>
                  {Object.entries(nodeTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">والد / پدر</label>
                <select className="select" value={form.parentId || ''} onChange={e => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">(ریشه - بدون والد)</option>
                  {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} {eq.feCode ? `(${eq.feCode})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="label">وضعیت</label>
                <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                  <option value="under_repair">در دست تعمیر</option>
                  <option value="decommissioned">از کار افتاده</option>
                </select>
              </div>
              <div>
                <label className="label">مدل (TYPE)</label>
                <input className="input" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
              </div>
              <div>
                <label className="label">شماره سریال</label>
                <input className="input" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} />
              </div>
              <div>
                <label className="label">کد PM</label>
                <input className="input" value={form.pmCode} onChange={e => setForm({ ...form, pmCode: e.target.value })} />
              </div>
              <div>
                <label className="label">شماره شناسنامه (FE)</label>
                <input className="input" value={form.feCode} onChange={e => setForm({ ...form, feCode: e.target.value })} />
              </div>
              <div>
                <label className="label">سازنده</label>
                <input className="input" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
              </div>
              <div>
                <label className="label">کشور سازنده</label>
                <input className="input" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
              </div>
              <div>
                <label className="label">محل استفاده</label>
                <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="label">سال ساخت</label>
                <input className="input" value={form.manufactureYear} onChange={e => setForm({ ...form, manufactureYear: e.target.value })} />
              </div>
              <div>
                <label className="label">ظرفیت</label>
                <input className="input" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
              </div>
              <div>
                <label className="label">توان</label>
                <input className="input" value={form.power} onChange={e => setForm({ ...form, power: e.target.value })} />
              </div>
              <div>
                <label className="label">ولتاژ</label>
                <input className="input" value={form.voltage} onChange={e => setForm({ ...form, voltage: e.target.value })} />
              </div>
              <div>
                <label className="label">دوره کالیبراسیون</label>
                <input className="input" value={form.calibrationPeriod} onChange={e => setForm({ ...form, calibrationPeriod: e.target.value })} />
              </div>
              <div>
                <label className="label">نوع کالیبراسیون</label>
                <input className="input" value={form.calibrationType} onChange={e => setForm({ ...form, calibrationType: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">سمت مجاز به کار</label>
                <input className="input" value={form.authorizedPersonnel} onChange={e => setForm({ ...form, authorizedPersonnel: e.target.value })} />
              </div>
              <div className="col-span-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="checkbox" checked={form.isLeaf} onChange={e => setForm({ ...form, isLeaf: e.target.checked })} />
                  تجهیز برگ (آیتم نهایی)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="checkbox" checked={form.hasPM} onChange={e => setForm({ ...form, hasPM: e.target.checked })} />
                  PM دارد
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="checkbox" checked={form.pcRequired} onChange={e => setForm({ ...form, pcRequired: e.target.checked })} />
                  PC
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="checkbox" checked={form.ncrRequired} onChange={e => setForm({ ...form, ncrRequired: e.target.checked })} />
                  NCR
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="checkbox" checked={form.cbuRequired} onChange={e => setForm({ ...form, cbuRequired: e.target.checked })} />
                  CBU
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={saveEquipment}><Check size={16} /> {editItem ? 'ذخیره تغییرات' : 'ایجاد تجهیز'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-[var(--foreground-muted)] mb-1">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function ListIcon({ size }: { size: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>;
}
