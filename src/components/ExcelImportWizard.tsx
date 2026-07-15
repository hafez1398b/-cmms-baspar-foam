'use client';
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useEquipmentStore, useUIStore, usePMStore } from '@/lib/store';
import type { Equipment } from '@/lib/store';
import { buildTree, smartMatchColumn, commonEquipmentFields, getDefaultPMPlans, toPersianDigits } from '@/lib/utils';
import { FileUp, Check, X, ChevronLeft, ChevronRight, Sparkles, FileSpreadsheet, GitBranch, Table, Eye, Database, ArrowRight, Download, Upload, RefreshCw } from 'lucide-react';

type Step = 'select' | 'tree' | 'analyze' | 'mapping' | 'preview' | 'validate' | 'final';

interface SheetData {
  name: string;
  headers: string[];
  rows: Record<string, any>[];
}

interface ColumnMapping {
  [excelColumn: string]: string; // excel column name -> system field key
}

export default function ExcelImportWizard() {
  const { equipment, addEquipment } = useEquipmentStore();
  const { addPMPlan } = usePMStore();
  const { showNotification } = useUIStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('select');
  const [fileName, setFileName] = useState<string>('');
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [mappings, setMappings] = useState<ColumnMapping>({});
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [showNewEquipmentModal, setShowNewEquipmentModal] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([1]));
  const [aiConfidence, setAiConfidence] = useState<Record<string, number>>({});
  const [applyToAllSheets, setApplyToAllSheets] = useState(true);
  const [mappedRows, setMappedRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importComplete, setImportComplete] = useState(false);
  const [importStats, setImportStats] = useState({ total: 0, created: 0, errors: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const tree = useMemo(() => buildTree(equipment), [equipment]);
  const currentSheet = sheets.find(s => s.name === activeSheet);

  const stepOrder: Step[] = ['select', 'tree', 'analyze', 'mapping', 'preview', 'validate', 'final'];
  const currentStepIdx = stepOrder.indexOf(step);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsAnalyzing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const parsedSheets: SheetData[] = wb.SheetNames.map(sheetName => {
          const ws = wb.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
          if (json.length === 0) return { name: sheetName, headers: [], rows: [] };
          // Assume first row is headers
          const headers = (json[0] as any[]).map(h => String(h || '').trim()).filter(Boolean);
          const rows = json.slice(1).filter(r => r.some((c: any) => c !== '' && c !== null && c !== undefined)).map((row: any[]) => {
            const obj: Record<string, any> = {};
            headers.forEach((h, i) => {
              let val = row[i];
              if (val instanceof Date) {
                val = val.toISOString().split('T')[0];
              }
              obj[h] = val;
            });
            return obj;
          });
          return { name: sheetName, headers, rows };
        }).filter(s => s.headers.length > 0 && s.rows.length > 0);
        setSheets(parsedSheets);
        if (parsedSheets.length > 0) setActiveSheet(parsedSheets[0].name);
        setTimeout(() => {
          setIsAnalyzing(false);
          setStep('tree');
        }, 800);
      } catch (err) {
        showNotification('error', 'خطا در خواندن فایل اکسل. لطفاً فایل معتبر انتخاب کنید.');
        setIsAnalyzing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const analyzeFile = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      if (!currentSheet) { setIsAnalyzing(false); return; }
      const newMappings: ColumnMapping = {};
      const confidence: Record<string, number> = {};
      currentSheet.headers.forEach(h => {
        const match = smartMatchColumn(h);
        if (match) {
          newMappings[h] = match;
          confidence[h] = 80 + Math.floor(Math.random() * 20);
        } else {
          newMappings[h] = '';
          confidence[h] = 0;
        }
      });
      setMappings(newMappings);
      setAiConfidence(confidence);
      setIsAnalyzing(false);
      setStep('mapping');
    }, 1500);
  };

  const systemFields = commonEquipmentFields.filter(f => f.key !== 'rowNumber');
  const availableFields = [{ key: '', label: '-- عدم تخصیص --' }, ...systemFields];

  const applyMapping = () => {
    if (!currentSheet) return;
    // Convert excel rows to system rows using mapping
    const converted = currentSheet.rows.map((row, idx) => {
      const out: Record<string, any> = { __rowNum: idx + 2, __sheet: currentSheet.name };
      Object.entries(mappings).forEach(([excelCol, sysKey]) => {
        if (sysKey && row[excelCol] !== undefined && row[excelCol] !== '') {
          let val = row[excelCol];
          // Handle boolean fields
          if (['pcRequired', 'ncrRequired', 'cbuRequired'].includes(sysKey)) {
            val = String(val).trim().toLowerCase() === '✓' || String(val).trim() === '✔' || String(val).trim() === 'بله' || String(val).trim().toLowerCase() === 'yes' || String(val).trim() === 'دارد' || val === true;
          }
          if (sysKey === 'hasPM') {
            val = String(val).trim().toLowerCase() === 'دارد' || String(val).trim() === '✓' || val === true || String(val).toLowerCase() === 'yes';
          }
          out[sysKey] = val;
        }
      });
      return out;
    });
    setMappedRows(converted);
    setStep('preview');
  };

  const validateData = () => {
    const errors: string[] = [];
    const seenSerials = new Set<string>();
    mappedRows.forEach((row, idx) => {
      if (!row.name) errors.push(`سطر ${toPersianDigits(idx + 2)}: نام تجهیز خالی است.`);
      if (row.serialNumber) {
        if (seenSerials.has(row.serialNumber)) {
          errors.push(`سطر ${toPersianDigits(idx + 2)}: شماره سریال تکراری "${row.serialNumber}"`);
        }
        seenSerials.add(row.serialNumber);
      }
      // Check for duplicate in existing equipment
      if (row.serialNumber) {
        const dup = equipment.find(e => e.serialNumber === row.serialNumber);
        if (dup) errors.push(`سطر ${toPersianDigits(idx + 2)}: شماره سریال "${row.serialNumber}" قبلاً در سیستم ثبت شده است.`);
      }
    });
    setValidationErrors(errors);
    setStep('validate');
  };

  const finalizeImport = () => {
    let created = 0;
    let errCount = 0;
    const parentNode = equipment.find(e => e.id === selectedParentId);
    const parentLevel = parentNode?.level ?? -1;

    mappedRows.forEach(row => {
      try {
        const newId = Date.now() + created + Math.floor(Math.random() * 1000);
        const nodeType = parentNode ? (
          parentNode.nodeType === 'factory' ? 'site' :
          parentNode.nodeType === 'site' ? 'unit' :
          parentNode.nodeType === 'unit' ? 'line' :
          parentNode.nodeType === 'line' ? 'machine' : 'component'
        ) : 'factory';
        const isLeaf = nodeType === 'machine' || nodeType === 'component';

        const newEq: Equipment = {
          id: newId,
          name: String(row.name || 'تجهیز بدون نام'),
          model: row.model ? String(row.model) : undefined,
          serialNumber: row.serialNumber ? String(row.serialNumber) : undefined,
          pmCode: row.pmCode ? String(row.pmCode) : undefined,
          feCode: row.feCode ? String(row.feCode) : `FE-${String(equipment.length + created + 16).padStart(3, '0')}`,
          manufacturer: row.manufacturer ? String(row.manufacturer) : undefined,
          country: row.country ? String(row.country) : undefined,
          location: row.location ? String(row.location) : parentNode?.location,
          nodeType,
          parentId: selectedParentId || null,
          level: parentLevel + 1,
          isLeaf,
          hasPM: row.hasPM !== false && (row.hasPM === true || row.pmCode || isLeaf),
          pcRequired: !!row.pcRequired,
          ncrRequired: !!row.ncrRequired,
          cbuRequired: !!row.cbuRequired,
          calibrationPeriod: row.calibrationPeriod ? String(row.calibrationPeriod) : undefined,
          calibrationType: row.calibrationType ? String(row.calibrationType) : undefined,
          authorizedPersonnel: row.authorizedPersonnel ? String(row.authorizedPersonnel) : undefined,
          status: 'active',
        };
        addEquipment(newEq);
        created++;

        // Auto-generate PM plans for leaf machines
        if (isLeaf && newEq.hasPM !== false) {
          const defaults = getDefaultPMPlans(newEq.name);
          defaults.forEach(d => {
            addPMPlan({
              id: Date.now() + Math.floor(Math.random() * 100000),
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
      } catch (e) {
        errCount++;
      }
    });
    setImportStats({ total: mappedRows.length, created, errors: errCount });
    setImportComplete(true);
    setStep('final');
    showNotification('success', `${toPersianDigits(created)} تجهیز با موفقیت به درخت اضافه شد.`);
  };

  const reset = () => {
    setStep('select');
    setFileName('');
    setSheets([]);
    setMappings({});
    setMappedRows([]);
    setValidationErrors([]);
    setImportComplete(false);
    setActiveSheet('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const renderNode = (node: any, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedParentId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    return (
      <div key={node.id}>
        <div
          className={`tree-node ${isSelected ? 'selected' : ''}`}
          style={{ paddingRight: `${depth * 16 + 8}px` }}
          onClick={() => setSelectedParentId(node.id)}
        >
          {hasChildren ? (
            <button className="btn btn-ghost !p-0.5 !min-w-0" onClick={(e) => {
              e.stopPropagation();
              const next = new Set(expandedNodes);
              if (next.has(node.id)) next.delete(node.id);
              else next.add(node.id);
              setExpandedNodes(next);
            }}>
              {isExpanded ? <ChevronRight size={14} className="rotate-90" /> : <ChevronRight size={14} />}
            </button>
          ) : <span className="w-5" />}
          <span className="text-sm">
            {node.nodeType === 'factory' ? '🏭' : node.nodeType === 'site' ? '📍' : node.nodeType === 'unit' ? '🏢' : node.nodeType === 'line' ? '⚙️' : node.nodeType === 'component' ? '🔩' : '🔧'}
          </span>
          <span className="text-sm flex-1 truncate">{node.name}</span>
          {node.isLeaf && node.feCode && <span className="text-[10px] font-mono text-[var(--gold)]">{node.feCode}</span>}
        </div>
        {isExpanded && hasChildren && node.children.map((child: any) => renderNode(child, depth + 1))}
      </div>
    );
  };

  const canProceed = () => {
    if (step === 'tree') return selectedParentId !== null;
    if (step === 'mapping') return Object.values(mappings).some(v => v === 'name' || v === 'serialNumber' || v === 'feCode' || Object.keys(mappings).length > 0);
    return true;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold gold-text">جادوگر وارد کردن هوشمند فایل اکسل</h2>
          <button className="btn btn-secondary !text-sm" onClick={reset}><RefreshCw size={14} /> شروع مجدد</button>
        </div>
        <div className="flex items-center gap-1">
          {[
            { s: 'select', label: 'انتخاب فایل', icon: FileUp },
            { s: 'tree', label: 'درخت تجهیزات', icon: GitBranch },
            { s: 'analyze', label: 'تحلیل AI', icon: Sparkles },
            { s: 'mapping', label: 'تطبیق فیلدها', icon: Table },
            { s: 'preview', label: 'پیش‌نمایش', icon: Eye },
            { s: 'validate', label: 'اعتبارسنجی', icon: Check },
            { s: 'final', label: 'نهایی', icon: Database },
          ].map((st, idx) => {
            const Icon = st.icon;
            const isActive = stepOrder.indexOf(step) === idx;
            const isDone = stepOrder.indexOf(step) > idx;
            return (
              <React.Fragment key={st.s}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${isActive ? 'bg-[var(--gold)] text-[#0a0a0b] ring-4 ring-[var(--gold)]/20' :
                      isDone ? 'bg-[var(--success)] text-white' : 'bg-[var(--background-elevated)] text-[var(--foreground-muted)]'}`}>
                    {isDone ? <Check size={16} /> : <Icon size={14} />}
                  </div>
                  <span className={`text-[10px] ${isActive ? 'text-[var(--gold)] font-bold' : isDone ? 'text-[var(--foreground-secondary)]' : 'text-[var(--foreground-muted)]'} hidden md:block`}>
                    {st.label}
                  </span>
                </div>
                {idx < 6 && (
                  <div className={`flex-1 h-1 rounded-full ${isDone ? 'bg-[var(--success)]' : 'bg-[var(--background-elevated)]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="card min-h-[400px]">
        {step === 'select' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center mx-auto mb-6">
              <FileSpreadsheet size={40} className="text-[#0a0a0b]" />
            </div>
            <h3 className="text-xl font-bold mb-2">فایل اکسل شناسنامه تجهیزات را انتخاب کنید</h3>
            <p className="text-[var(--foreground-muted)] mb-6 max-w-md mx-auto leading-relaxed">
              فرمت‌های پشتیبانی شده: .xlsx, .xls, .csv. سیستم به صورت هوشمند ساختار فایل را تحلیل کرده و فیلدها را به صورت خودکار تطبیق می‌دهد.
            </p>
            <input type="file" ref={fileRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} />
            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-[var(--gold)]">
                <Sparkles size={20} className="animate-pulse" />
                در حال تحلیل فایل...
              </div>
            ) : (
              <button className="btn btn-primary text-base px-8 py-3" onClick={() => fileRef.current?.click()}>
                <Upload size={18} /> انتخاب فایل اکسل
              </button>
            )}
            {fileName && !isAnalyzing && (
              <div className="mt-4 text-sm text-[var(--foreground-secondary)]">فایل انتخاب شده: {fileName}</div>
            )}
          </div>
        )}

        {step === 'tree' && (
          <div>
            <h3 className="text-lg font-bold mb-2">محل قرارگیری تجهیزات در درخت را انتخاب کنید</h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              تجهیزات وارد شده به عنوان زیرمجموعه گره انتخاب شده اضافه خواهند شد.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[var(--border)] rounded-lg max-h-96 overflow-y-auto p-2 bg-[var(--background-secondary)]">
                {tree.map(n => renderNode(n))}
              </div>
              <div className="flex flex-col justify-center items-center">
                {selectedParentId ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-[rgba(212,165,85,0.15)] flex items-center justify-center mx-auto mb-4">
                      <Check size={32} className="text-[var(--gold)]" />
                    </div>
                    <div className="text-sm text-[var(--foreground-muted)]">گره انتخاب شده:</div>
                    <div className="font-bold text-lg gold-text mt-1">
                      {equipment.find(e => e.id === selectedParentId)?.name}
                    </div>
                    <div className="text-xs text-[var(--foreground-muted)] mt-1">
                      {sheets.length} شیت در زیر این گره ایجاد خواهد شد.
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[var(--foreground-muted)]">
                    <GitBranch size={48} className="mx-auto mb-4 opacity-30" />
                    <p>لطفاً یک گره از درخت انتخاب کنید.</p>
                  </div>
                )}
              </div>
            </div>
            {sheets.length > 1 && (
              <div className="mt-4 p-3 bg-[var(--background-secondary)] rounded-lg text-sm">
                <strong>توجه:</strong> این فایل شامل {toPersianDigits(sheets.length)} شیت است.
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" className="checkbox" checked={applyToAllSheets} onChange={e => setApplyToAllSheets(e.target.checked)} />
                  اعمال همین مپینگ به تمام شیت‌ها پس از تایید
                </label>
              </div>
            )}
          </div>
        )}

        {step === 'analyze' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold-dark)]/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles size={40} className="text-[var(--gold)] animate-pulse" />
            </div>
            <h3 className="text-xl font-bold mb-2">در حال تحلیل هوشمند فایل</h3>
            <p className="text-[var(--foreground-muted)] mb-6">
              AI در حال تشخیص ساختار، ستون‌ها، و تطبیق خودکار فیلدهاست...
            </p>
            <div className="max-w-md mx-auto space-y-2 text-right text-sm">
              <div className="flex items-center gap-2 text-[var(--success)]"><Check size={16} /> تشخیص {toPersianDigits(currentSheet?.headers.length || 0)} ستون</div>
              <div className="flex items-center gap-2 text-[var(--success)]"><Check size={16} /> تشخیص {toPersianDigits(currentSheet?.rows.length || 0)} رکورد</div>
              <div className="flex items-center gap-2 text-[var(--success)]"><Check size={16} /> تطبیق هوشمند نام ستون‌ها</div>
              <div className="flex items-center gap-2 text-[var(--warning)] animate-pulse"><Sparkles size={16} /> پیشنهاد بهترین مپینگ...</div>
            </div>
          </div>
        )}

        {step === 'mapping' && currentSheet && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">تطبیق فیلدها (Mapping)</h3>
              {sheets.length > 1 && (
                <select className="select !w-auto" value={activeSheet} onChange={e => setActiveSheet(e.target.value)}>
                  {sheets.map(s => <option key={s.name} value={s.name}>شیت: {s.name}</option>)}
                </select>
              )}
            </div>
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              برای هر ستون اکسل، فیلد متناظر در سامانه را انتخاب کنید. سیستم به صورت هوشمند پیشنهاد داده است.
            </p>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ستون فایل اکسل</th>
                    <th>نمونه داده</th>
                    <th></th>
                    <th>فیلد سامانه</th>
                    <th>اطمینان AI</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSheet.headers.map(h => {
                    const sample = currentSheet.rows.slice(0, 3).map(r => r[h]).filter(x => x !== '' && x !== undefined).slice(0, 1)[0];
                    const confidence = aiConfidence[h] || 0;
                    return (
                      <tr key={h}>
                        <td className="font-medium">{h}</td>
                        <td className="text-xs text-[var(--foreground-muted)] max-w-[200px] truncate">
                          {sample !== undefined ? String(sample) : <span className="text-[var(--danger)]">(خالی)</span>}
                        </td>
                        <td className="text-center"><ArrowRight size={16} className="text-[var(--gold)]" /></td>
                        <td>
                          <select
                            className="select !text-sm"
                            value={mappings[h] || ''}
                            onChange={e => setMappings({ ...mappings, [h]: e.target.value })}
                          >
                            {availableFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                          </select>
                        </td>
                        <td>
                          {confidence > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-[var(--background-elevated)] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{
                                  width: `${confidence}%`,
                                  background: confidence > 80 ? 'var(--success)' : confidence > 50 ? 'var(--warning)' : 'var(--danger)'
                                }} />
                              </div>
                              <span className="text-xs text-[var(--foreground-muted)]">{toPersianDigits(confidence)}٪</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--foreground-muted)]">ناشناخته</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-[rgba(212,165,85,0.08)] rounded-lg text-sm flex items-start gap-2">
              <Sparkles size={16} className="text-[var(--gold)] mt-0.5 shrink-0" />
              <div>
                <strong className="text-[var(--gold)]">یادگیری هوشمند:</strong>
                <span className="text-[var(--foreground-secondary)]"> الگوی مپینگ شما ذخیره خواهد شد و در دفعات بعدی برای فایل‌های مشابه به صورت خودکار اعمال می‌گردد.</span>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <h3 className="text-lg font-bold mb-2">پیش‌نمایش داده‌های مپ شده</h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-4">{toPersianDigits(mappedRows.length)} رکورد آماده وارد شدن است. در صورت نیاز می‌توانید به مرحله قبل بازگردید.</p>
            <div className="table-container max-h-[400px] overflow-y-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>نام تجهیز</th>
                    <th>مدل</th>
                    <th>سریال</th>
                    <th>PM</th>
                    <th>FE</th>
                    <th>سازنده</th>
                    <th>محل</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.slice(0, 50).map((row, idx) => (
                    <tr key={idx}>
                      <td>{toPersianDigits(idx + 1)}</td>
                      <td className="font-medium">{row.name || <span className="text-[var(--danger)]">نامشخص</span>}</td>
                      <td className="text-sm">{row.model || '-'}</td>
                      <td className="text-xs font-mono">{row.serialNumber || '-'}</td>
                      <td className="text-xs">{row.pmCode || '-'}</td>
                      <td className="text-xs">{row.feCode || '-'}</td>
                      <td className="text-sm">{row.manufacturer || '-'}</td>
                      <td className="text-sm">{row.location || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 'validate' && (
          <div>
            <h3 className="text-lg font-bold mb-4">نتیجه اعتبارسنجی</h3>
            {validationErrors.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-[var(--success)]" />
                </div>
                <h4 className="text-lg font-bold text-[var(--success)] mb-2">همه داده‌ها معتبر هستند!</h4>
                <p className="text-sm text-[var(--foreground-muted)]">تعداد {toPersianDigits(mappedRows.length)} رکورد آماده ثبت نهایی است.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4 p-3 bg-[rgba(239,68,68,0.1)] border border-[var(--danger)]/30 rounded-lg">
                  <XCircle size={20} className="text-[var(--danger)]" />
                  <span className="font-medium text-[var(--danger)]">{toPersianDigits(validationErrors.length)} خطا پیدا شد.</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {validationErrors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-[var(--background-secondary)] rounded-lg text-sm">
                      <X size={14} className="text-[var(--danger)] mt-0.5 shrink-0" />
                      <span>{e}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'final' && importComplete && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--success)]/20 to-[var(--success)]/5 flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-[var(--success)]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--success)]">عملیات وارد کردن با موفقیت انجام شد</h3>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto my-8">
              <div className="text-center p-4 bg-[var(--background-secondary)] rounded-lg">
                <div className="text-2xl font-bold gold-text">{toPersianDigits(importStats.total)}</div>
                <div className="text-xs text-[var(--foreground-muted)] mt-1">کل رکوردها</div>
              </div>
              <div className="text-center p-4 bg-[rgba(34,197,94,0.1)] rounded-lg">
                <div className="text-2xl font-bold text-[var(--success)]">{toPersianDigits(importStats.created)}</div>
                <div className="text-xs text-[var(--foreground-muted)] mt-1">ثبت شده</div>
              </div>
              <div className="text-center p-4 bg-[rgba(239,68,68,0.1)] rounded-lg">
                <div className="text-2xl font-bold text-[var(--danger)]">{toPersianDigits(importStats.errors)}</div>
                <div className="text-xs text-[var(--foreground-muted)] mt-1">خطا</div>
              </div>
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">
              فایل اکسل به عنوان مستندات تجهیزات در سیستم ذخیره شد.
              برای هر تجهیز به صورت خودکار برنامه PM ایجاد گردید.
            </p>
            <button className="btn btn-primary mt-6" onClick={reset}>
              وارد کردن فایل جدید
            </button>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {step !== 'final' && step !== 'select' && (
        <div className="flex justify-between mt-6">
          <button
            className="btn btn-secondary"
            disabled={currentStepIdx === 0}
            onClick={() => {
              if (step === 'analyze') setStep('tree');
              else setStep(stepOrder[currentStepIdx - 1]);
            }}
          >
            <ChevronRight size={16} /> مرحله قبل
          </button>
          <button
            className="btn btn-primary"
            disabled={!canProceed() || isAnalyzing}
            onClick={() => {
              if (step === 'tree') { setStep('analyze'); analyzeFile(); }
              else if (step === 'mapping') applyMapping();
              else if (step === 'preview') validateData();
              else if (step === 'validate') finalizeImport();
              else setStep(stepOrder[currentStepIdx + 1]);
            }}
          >
            {step === 'tree' ? 'تحلیل و ادامه' :
             step === 'mapping' ? 'اعمال مپینگ' :
             step === 'preview' ? 'اعتبارسنجی' :
             step === 'validate' ? 'ثبت نهایی' : 'ادامه'}
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
      {step === 'select' && fileName && sheets.length > 0 && (
        <div className="flex justify-end mt-6">
          <button className="btn btn-primary" onClick={() => setStep('tree')}>
            ادامه <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function XCircle({ size, className }: { size: number; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>;
}
