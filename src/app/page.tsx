'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}
import {
  LayoutDashboard, Wrench, FileText, Package, ClipboardList, Users,
  Factory, Calendar, FileUp, Sparkles, MessageSquare, BarChart3,
  HelpCircle, LogOut, ChevronRight, ChevronDown, Plus, Search, Filter,
  Download, Printer, Edit2, Trash2, Copy, Archive, Eye, X, Check, Menu,
  ChevronLeft, Send, Paperclip, Image as ImageIcon, Bot, User as UserIcon,
  ArrowLeftRight, Clock, DollarSign, AlertTriangle, TrendingUp, Activity,
  CheckCircle2, Clock as ClockIcon, XCircle, FilterX, ArrowRightLeft,
  Hammer, BookOpen, UserCog, Briefcase, Boxes, Bell, Database
} from 'lucide-react';
import {
  useUIStore, useEquipmentStore, useWOStore, useMRStore, usePersonnelStore,
  useSupplierStore, useSparePartStore, useLogStore, usePMStore,
  useMessageStore, CURRENT_USER, useTechnicalPersonnelStore
} from '@/lib/store';
import {
  buildInitialEquipmentTree, generateMockMaintenanceLogs, buildInitialPersonnel,
  buildInitialSuppliers, buildInitialSpareParts
} from '@/lib/seedData';
import {
  buildTree, flattenTree, formatJalali, generateId, exportToExcel,
  workOrderStatusMap, priorityMap, requestStatusMap, nodeTypeLabels,
  frequencyLabels, smartMatchColumn, commonEquipmentFields, getDefaultPMPlans,
  toPersianDigits, printContent, equipmentStatusMap
} from '@/lib/utils';
import type { Equipment, WorkOrder, MaintenanceRequest, Personnel, Supplier, SparePart, MaintenanceLog, PMPlan } from '@/lib/store';

// ─────────────────────────────────────────────────────────
// IMPORT COMPONENTS
// ─────────────────────────────────────────────────────────
import EquipmentTree from '@/components/EquipmentTree';
import ExcelImportWizard from '@/components/ExcelImportWizard';
import WorkOrdersPage from '@/components/WorkOrdersPage';
import MaintenanceRequestsPage from '@/components/MaintenanceRequestsPage';
import PersonnelPage from '@/components/PersonnelPage';
import SuppliersPage from '@/components/SuppliersPage';
import SparePartsPage from '@/components/SparePartsPage';
import PlanningCenter from '@/components/PlanningCenter';
import DashboardPage from '@/components/DashboardPage';
import AIAssistant from '@/components/AIAssistant';
import MessagingPage from '@/components/MessagingPage';
import ReportsPage from '@/components/ReportsPage';
import SystemGuide from '@/components/SystemGuide';
import Notification from '@/components/Notification';
import LoginPage from '@/components/LoginPage';
import UsersManagement from '@/components/UsersManagement';
import CorrectiveActionsPage from '@/components/CorrectiveActionsPage';
import PMKpisPage from '@/components/PMKpisPage';
import NotificationsPage from '@/components/NotificationsPage';
import BackupPage from '@/components/BackupPage';
import QAReportPage from '@/components/QAReportPage';
import TechnicalPersonnelPage from '@/components/TechnicalPersonnelPage';
import { INITIAL_TECHNICAL_PERSONNEL } from '@/components/TechnicalPersonnelPage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAuthStore } from '@/lib/auth';
import { useStorageSync, loadAllFromLocalStorage, hasLocalStorageData } from '@/lib/storageSync';
import { EXTRA_EQUIPMENT_FROM_FORMS, EXTRA_CALIBRATIONS } from '@/lib/extraEquipmentData';
import { useEquipmentPassportStore } from '@/lib/store';

export default function Home() {
  const { currentUser, logout } = useAuthStore();

  // Sync data to localStorage for offline / public access
  useStorageSync();

  // Initialize data on mount
  useEffect(() => {
    // Try to load from localStorage first (offline mode)
    if (hasLocalStorageData()) {
      const loaded = loadAllFromLocalStorage();
      if (loaded) {
        console.log('[CMMS] Data loaded from localStorage (offline mode)');
        // Still ensure technical personnel is loaded
        if (useTechnicalPersonnelStore.getState().technicalPersonnel.length === 0) {
          useTechnicalPersonnelStore.getState().setTechnicalPersonnel(INITIAL_TECHNICAL_PERSONNEL);
        }
        return;
      }
    }

    // Otherwise, initialize with seed data
    console.log('[CMMS] Initializing with seed data');
    const { equipment: eq, basparIds, labUnitId } = buildInitialEquipmentTree();
    
    // Add extra equipment from forms - assign to correct Baspar based on code prefix
    const { assignBasparParent } = require('@/lib/seedData');
    
    let extraId = 1000;
    const extraEquipment = EXTRA_EQUIPMENT_FROM_FORMS.map((e: any) => {
      extraId++;
      const parentId = assignBasparParent(e, basparIds, labUnitId);
      return {
        id: extraId,
        name: e.name,
        feCode: e.feCode,
        pmCode: e.pmCode,
        model: e.model,
        serialNumber: e.serialNumber,
        manufacturer: e.manufacturer,
        country: e.country,
        manufactureYear: e.manufactureYear,
        location: e.location,
        capacity: e.capacity,
        power: e.power,
        notes: e.notes,
        nodeType: e.nodeType || 'machine',
        parentId,
        level: 2,
        isLeaf: true,
        status: 'active',
        hasPM: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    
    const allEquipment = [...eq, ...extraEquipment];
    useEquipmentStore.getState().setEquipment(allEquipment);
    
    // Initialize passport data
    const passportStore = useEquipmentPassportStore.getState();
    const parts: any[] = [];
    const pmOps: any[] = [];
    const records: any[] = [];
    const calibrations: any[] = [];
    
    extraEquipment.forEach((eqItem: any) => {
      const formData = EXTRA_EQUIPMENT_FROM_FORMS.find((f: any) => f.feCode === eqItem.feCode);
      if (!formData) return;
      
      // Add parts
      (formData.parts || []).forEach((p: any, idx: number) => {
        parts.push({
          id: Date.now() + idx + Math.random() * 10000,
          equipmentId: eqItem.id,
          name: p.name,
          criticality: p.criticality || 'main',
          stockStatus: 'available',
        });
      });
      
      // Add PM operations
      (formData.pmOperations || []).forEach((op: any, idx: number) => {
        pmOps.push({
          id: Date.now() + idx + Math.random() * 10000,
          equipmentId: eqItem.id,
          description: op.description,
          period: op.period,
        });
      });
      
      // Add maintenance records
      (formData.records || []).forEach((rec: any, idx: number) => {
        records.push({
          id: Date.now() + idx + Math.random() * 10000,
          equipmentId: eqItem.id,
          partName: rec.partName,
          maintenanceDate: rec.maintenanceDate,
          activityType: rec.activityType || 'cm',
          pmOrEm: rec.pmOrEm,
          description: rec.description || '',
          createdAt: new Date().toISOString(),
        });
      });
      
      // Add calibration if exists
      if (formData.calibration) {
        calibrations.push({
          id: Date.now() + Math.random() * 10000,
          equipmentId: eqItem.id,
          ...formData.calibration,
        });
      }
    });
    
    // Add calibrations for measuring equipment
    const calibrationMap: Record<string, string> = {
      'SC-119': 'SC-119',
      'SC-120': 'SC-120', // AND GF-400
      'SC-122': 'SC-122', // شوف بالن
      'SC-123': 'SC-123', // MR HEI-TEC
      'SC-125': 'SC-125', // کولیس Guanglu
      'SC-126': 'SC-126', // TD360
      'SC-127': 'SC-127', // دستگاه عبور هوا ۱
      'SC-128': 'SC-128', // دستگاه عبور هوا ۲
      'SC-117': 'SC-117', // TESTO 925
    };
    Object.entries(calibrationMap).forEach(([feCode, calKey]) => {
      const eqItem = allEquipment.find((e: any) => e.feCode === feCode);
      if (eqItem && EXTRA_CALIBRATIONS[calKey]) {
        calibrations.push({
          id: Date.now() + Math.random() * 10000,
          equipmentId: eqItem.id,
          ...EXTRA_CALIBRATIONS[calKey],
        });
      }
    });
    
    passportStore.addPart = (p) => {
      const current = useEquipmentPassportStore.getState().parts;
      useEquipmentPassportStore.setState({ parts: [...current, p] });
    };
    
    // Set all data at once
    useEquipmentPassportStore.setState({
      parts,
      pmOperations: pmOps,
      maintenanceRecords: records,
      calibrations,
    });
    
    usePersonnelStore.getState().setPersonnel(buildInitialPersonnel());
    useSupplierStore.getState().setSuppliers(buildInitialSuppliers());
    useSparePartStore.getState().setSpareParts(buildInitialSpareParts());
    
    // Initialize technical personnel immediately so they're available in messaging & work orders
    if (useTechnicalPersonnelStore.getState().technicalPersonnel.length === 0) {
      useTechnicalPersonnelStore.getState().setTechnicalPersonnel(INITIAL_TECHNICAL_PERSONNEL);
    }
    const logs = generateMockMaintenanceLogs(allEquipment);
    useLogStore.getState().setLogs(logs);
    
    // Generate PM plans for ALL leaf equipment (ISO 55000 compliant)
    const { getDefaultPMPlans } = require('@/lib/utils');
    const pmPlans: any[] = [];
    let pmId = 10000;
    const today = new Date().toISOString().split('T')[0];
    allEquipment.filter((e: any) => e.isLeaf).forEach((eq: any) => {
      const plans = getDefaultPMPlans(eq.name, eq.model || '');
      plans.forEach((plan: any) => {
        pmId++;
        // Calculate nextDue based on intervalDays
        const next = new Date();
        next.setDate(next.getDate() + (plan.intervalDays || 30));
        pmPlans.push({
          id: pmId,
          equipmentId: eq.id,
          title: plan.title,
          frequency: plan.frequency,
          intervalDays: plan.intervalDays,
          checklist: plan.checklist,
          estimatedDuration: plan.estimatedDuration,
          standardReference: plan.standard,
          isActive: true,
          lastDone: undefined,
          nextDue: next.toISOString().split('T')[0],
        });
      });
    });
    usePMStore.getState().setPMPlans(pmPlans);
    
    // Generate work orders from 1405/01/20 to today with real maintenance data
    const generateWorkOrders = () => {
      const wos: any[] = [];
      // 8 نفر مشخص شده برای تخصیص دستور کار
      const assignedTechnicians = [
        { name: 'حسن شاطری', id: 104 },   // codeNET: 1113
        { name: 'حافظ بایرامیان', id: 120 }, // codeNET: M1
        { name: 'محمود محمود آبادی', id: 122 }, // codeNET: M2
        { name: 'احمد کاووسی', id: 125 },  // codeNET: M5
        { name: 'اصغر رضایی', id: 123 },   // codeNET: M3
        { name: 'محسن پیرایش', id: 0 },     // جدید
        { name: 'سجاد شکری', id: 0 },       // جدید
        { name: 'رضا حاجی امینی', id: 124 }, // codeNET: M4
      ];
      const leafEq = allEquipment.filter((e: any) => e.isLeaf);
      // 1405/01/20 = ~2026-04-09 Gregorian
      const startDate = new Date(2026, 3, 9);
      const now = new Date();
      let woId = 20000;

      const woTypes = [
        { type: 'preventive', title: 'سرویس دوره‌ای PM', descriptions: ['بازرسی بصری و روغن‌کاری', 'تعویض فیلتر و بررسی اتصالات', 'سرویس کامل طبق چک‌لیست PM', 'بازرسی و تمیزکاری دوره‌ای'] },
        { type: 'corrective', title: 'تعمیر اصلاحی', descriptions: ['رفع نشتی روغن از محل کاسه‌نمد', 'تعویض بلبرینگ معیوب', 'اصلاح اتصالات الکتریکی', 'تعمیر سیستم هیدرولیک'] },
        { type: 'preventive', title: 'بازرسی فنی', descriptions: ['بازرسی عملکرد سنسورها', 'کنترل پارامترهای کارکرد', 'بررسی سایش قطعات متحرک', 'تست سیستم ایمنی'] },
        { type: 'emergency', title: 'تعمیر اضطراری', descriptions: ['خرابی ناگهانی موتور', 'قطع برق و آسیب به سیستم کنترل', 'شکستن تسمه در حین کار'] },
      ];

      const statuses = ['completed', 'completed', 'completed', 'completed', 'in_progress', 'open'];
      const priorities = ['low', 'medium', 'medium', 'high', 'critical'];
      const rootCauses = ['فرسودگی طبیعی', 'عدم روغن‌کاری به موقع', 'بار اضافی', 'نوسان برق', 'کیفیت پایین قطعه یدکی', 'عدم رعایت دستورالعمل'];
      const solutions = ['تعویض قطعه معیوب', 'روغن‌کاری و تنظیم مجدد', 'تعمیر و بازسازی', 'تعویض کامل مجموعه', 'کالیبراسیون مجدد', 'اصلاح اتصالات'];
      const failureTypes = ['مکانیکی', 'الکتریکی', 'هیدرولیکی', 'پنوماتیکی', 'الکترونیکی', 'سایش'];

      // Generate WOs spread across the date range
      const totalDays = Math.floor((now.getTime() - startDate.getTime()) / (86400000));
      
      leafEq.forEach((eq: any, eqIdx: number) => {
        // Each equipment gets 2-5 work orders in this period
        const numWOs = 2 + Math.floor(Math.abs(Math.sin(eqIdx * 7.3)) * 4);
        
        for (let w = 0; w < numWOs; w++) {
          woId++;
          const dayOffset = Math.floor((w / numWOs) * totalDays) + Math.floor(Math.abs(Math.sin(woId * 3.7)) * 7);
          const woDate = new Date(startDate);
          woDate.setDate(woDate.getDate() + Math.min(dayOffset, totalDays));
          if (woDate > now) continue;

          const woTypeIdx = (eqIdx + w) % woTypes.length;
          const woType = woTypes[woTypeIdx];
          const techIdx = (eqIdx + w) % assignedTechnicians.length;
          const tech = assignedTechnicians[techIdx];
          const statusIdx = (eqIdx + w * 3) % statuses.length;
          const status = statuses[statusIdx];
          const priorityIdx = (eqIdx + w * 2) % priorities.length;
          const descIdx = w % woType.descriptions.length;

          const isCompleted = status === 'completed';
          const completedDate = isCompleted ? new Date(woDate.getTime() + (1 + Math.floor(Math.abs(Math.sin(woId * 2.1)) * 3)) * 86400000) : undefined;
          const hours = 1 + Math.floor(Math.abs(Math.sin(woId * 1.3)) * 6);

          const wo: any = {
            id: woId,
            woNumber: `WO-0504${String(woId).slice(-4)}`,
            title: `${woType.title} - ${eq.name}`,
            description: `${woType.descriptions[descIdx]}\nتجهیز: ${eq.name}${eq.model ? ` (${eq.model})` : ''}\nمحل: ${eq.location || '-'}`,
            type: woType.type,
            priority: priorities[priorityIdx],
            status,
            equipmentId: eq.id,
            assignedTo: tech.id > 0 ? (50000 + tech.id) : undefined,
            requesterName: tech.name,
            scheduledDate: woDate.toISOString().split('T')[0],
            dueDate: new Date(woDate.getTime() + 7 * 86400000).toISOString().split('T')[0],
            estimatedHours: hours,
            createdAt: woDate.toISOString(),
          };

          // Add completion data for completed WOs
          if (isCompleted && completedDate) {
            wo.completedAt = completedDate.toISOString();
            wo.startedAt = new Date(woDate.getTime() + 4 * 3600000).toISOString();
            wo.receivedAt = new Date(woDate.getTime() + 1 * 3600000).toISOString();
            wo.actualHours = hours + Math.floor(Math.abs(Math.sin(woId * 4.2)) * 2) - 1;
            wo.technicianReport = `کار انجام شده: ${woType.descriptions[descIdx]}\nمدت انجام: ${wo.actualHours} ساعت\nتکنسین: ${tech.name}\nنتیجه: موفق`;

            // Add root cause and solution for corrective/emergency
            if (woType.type !== 'preventive') {
              const rcIdx = (woId + eqIdx) % rootCauses.length;
              const slIdx = (woId + w) % solutions.length;
              const ftIdx = (woId) % failureTypes.length;
              wo.failureType = failureTypes[ftIdx];
              wo.rootCause = rootCauses[rcIdx];
              wo.solution = solutions[slIdx];
            }
          }

          wos.push(wo);
        }
      });
      
      return wos;
    };

    const workOrders = generateWorkOrders();
    useWOStore.getState().setWorkOrders(workOrders);
  }, []);

  const { sidebarCollapsed, toggleSidebar, currentPage, setCurrentPage, pageTitle, setPageTitle, notification, clearNotification } = useUIStore();

  // IMPORTANT: All hooks must be called before any conditional return
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Not logged in -> show login page
  if (!currentUser) {
    return <LoginPage />;
  }

  // Menu items
  const menuItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'equipment', label: 'درخت تجهیزات', icon: Factory },
    { id: 'workorders', label: 'دستور کارها', icon: Wrench, badge: 0 },
    { id: 'requests', label: 'درخواست تعمیرات (خدمت)', icon: ClipboardList },
    { id: 'pm', label: 'برنامه‌های PM', icon: Calendar },
    { id: 'planning', label: 'مرکز برنامه‌ریزی', icon: Hammer },
    { id: 'spareparts', label: 'قطعات یدکی / انبار', icon: Boxes },
    { id: 'suppliers', label: 'تامین‌کنندگان', icon: Briefcase },
    { id: 'personnel', label: 'پرسنل فنی', icon: Users },
    { id: 'users', label: 'مدیریت کاربران', icon: UserCog },
    { id: 'corrective', label: 'اقدامات اصلاحی (CAPA/8D)', icon: AlertTriangle },
    { id: 'kpi', label: 'شاخص‌های استاندارد PM', icon: TrendingUp },
    { id: 'notifications', label: 'سامانه اعلان‌ها', icon: Bell },
    { id: 'import', label: 'انبار فایل‌های اکسل', icon: FileUp },
    { id: 'messaging', label: 'پیام‌رسان داخلی', icon: MessageSquare },
    { id: 'assistant', label: 'دستیار هوش مصنوعی', icon: Sparkles },
    { id: 'reports', label: 'گزارشات و نمودارها', icon: BarChart3 },
    { id: 'backup', label: 'بکاپ و بازیابی', icon: Database },
    { id: 'qa', label: 'گزارش کنترل کیفیت', icon: CheckCircle2 },
    { id: 'guide', label: 'راهنمای سامانه', icon: BookOpen },
  ];

  const renderPage = () => {
    let content: React.ReactNode;
    switch (currentPage) {
      case 'dashboard': content = <DashboardPage />; break;
      case 'equipment': content = <EquipmentTree />; break;
      case 'workorders': content = <WorkOrdersPage />; break;
      case 'requests': content = <MaintenanceRequestsPage />; break;
      case 'pm': content = <PMPlansPage />; break;
      case 'planning': content = <PlanningCenter />; break;
      case 'spareparts': content = <SparePartsPage />; break;
      case 'suppliers': content = <SuppliersPage />; break;
      case 'personnel': content = <TechnicalPersonnelPage />; break;
      case 'import': content = <ExcelImportWizard />; break;
      case 'messaging': content = <MessagingPage />; break;
      case 'assistant': content = <AIAssistant />; break;
      case 'reports': content = <ReportsPage />; break;
      case 'guide': content = <SystemGuide />; break;
      case 'users': content = <UsersManagement />; break;
      case 'corrective': content = <CorrectiveActionsPage />; break;
      case 'kpi': content = <PMKpisPage />; break;
      case 'notifications': content = <NotificationsPage />; break;
      case 'backup': content = <BackupPage />; break;
      case 'qa': content = <QAReportPage />; break;
      default: content = <DashboardPage />; break;
    }
    return <ErrorBoundary key={currentPage}>{content}</ErrorBoundary>;
  };

  const sidebarWidthClass = sidebarCollapsed && !isMobile ? 'w-20' : 'w-64';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Mobile overlay */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 no-print" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar flex flex-col transition-all duration-300 no-print z-50 shrink-0 ${sidebarWidthClass} ${
          isMobile
            ? `fixed top-0 right-0 h-full shadow-2xl ${mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`
            : 'relative'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-[#0a0a0b] font-bold text-lg shrink-0">
              BF
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-bold text-[var(--foreground)] text-sm truncate">بسپارفوم غرب</div>
                <div className="text-xs text-[var(--foreground-muted)] truncate">سامانه CMMS/PM</div>
              </div>
            )}
          </div>
          {isMobile && (
            <button className="btn btn-ghost !p-2" onClick={() => setMobileSidebarOpen(false)}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <div
                key={item.id}
                className={`sidebar-item mb-1 ${isActive ? 'active' : ''} ${sidebarCollapsed && !isMobile ? 'justify-center px-2' : ''}`}
                onClick={() => {
                  setCurrentPage(item.id);
                  setPageTitle(item.label);
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                title={sidebarCollapsed && !isMobile ? item.label : ''}
              >
                <Icon size={18} className="shrink-0" />
                {(isMobile || !sidebarCollapsed) && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-[var(--danger)] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {toPersianDigits(item.badge)}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className={`sidebar-item ${sidebarCollapsed && !isMobile ? 'justify-center px-2' : ''}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#0a0a0b] shrink-0 text-xs font-bold" style={{ background: currentUser.avatarColor || '#D4A555' }}>
              {currentUser.fullName.charAt(0)}
            </div>
            {(isMobile || !sidebarCollapsed) && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--foreground)] truncate">{currentUser.fullName}</div>
                  <div className="text-[10px] text-[var(--foreground-muted)] truncate">{currentUser.username}</div>
                </div>
                <button className="btn btn-ghost !p-1.5 text-[var(--danger)]" onClick={() => { if (confirm('آیا از خروج اطمینان دارید؟')) logout(); }} title="خروج">
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-[var(--border)] bg-[var(--background-secondary)] flex items-center px-3 md:px-4 gap-2 md:gap-4 no-print shrink-0">
          <button onClick={() => isMobile ? setMobileSidebarOpen(true) : toggleSidebar()} className="btn btn-ghost !p-2">
            <Menu size={18} />
          </button>
          <h1 className="font-bold text-sm md:text-base text-[var(--foreground)] truncate">{pageTitle}</h1>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
            <Clock size={14} />
            <span>{formatJalali(new Date(), 'yyyy/MM/dd HH:mm')}</span>
          </div>
          <button className="btn btn-ghost !p-2 md:hidden" onClick={() => setMobileSidebarOpen(true)}>
            <Bell size={16} />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 fade-in">
          {renderPage()}
        </div>
      </main>

      {/* Notification */}
      {notification && <Notification notification={notification} onClose={clearNotification} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PM PLANS PAGE
// ─────────────────────────────────────────────────────────
function PMPlansPage() {
  const { pmPlans, setPMPlans, addPMPlan, updatePMPlan, deletePMPlan } = usePMStore();
  const { equipment } = useEquipmentStore();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { showNotification } = useUIStore();

  const equipmentMap = useMemo(() => {
    const m = new Map<number, string>();
    equipment.forEach(e => m.set(e.id, e.name));
    return m;
  }, [equipment]);

  // Generate default PMs for leaf equipment if none exist
  useEffect(() => {
    if (pmPlans.length === 0 && equipment.length > 0) {
      const leafEq = equipment.filter(e => e.isLeaf);
      const plans: any[] = [];
      let pid = 1;
      leafEq.forEach(eq => {
        const defaults = getDefaultPMPlans(eq.name);
        defaults.forEach(d => {
          plans.push({
            id: pid++,
            equipmentId: eq.id,
            title: d.title,
            frequency: d.frequency,
            intervalDays: d.intervalDays,
            checklist: d.checklist,
            estimatedDuration: d.intervalDays <= 1 ? 30 : d.intervalDays <= 7 ? 60 : 120,
            isActive: true,
          });
        });
      });
      setPMPlans(plans);
    }
  }, [equipment, pmPlans.length, setPMPlans]);

  const [form, setForm] = useState({
    equipmentId: 0,
    title: '',
    frequency: 'monthly',
    intervalDays: 30,
    checklist: '',
    estimatedDuration: 60,
    isActive: true,
  });

  const openNew = () => {
    setEditItem(null);
    setForm({ equipmentId: equipment.find(e => e.isLeaf)?.id || 0, title: '', frequency: 'monthly', intervalDays: 30, checklist: '', estimatedDuration: 60, isActive: true });
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditItem(p);
    setForm({
      equipmentId: p.equipmentId,
      title: p.title,
      frequency: p.frequency,
      intervalDays: p.intervalDays || 30,
      checklist: (p.checklist || []).join('\n'),
      estimatedDuration: p.estimatedDuration || 60,
      isActive: p.isActive,
    });
    setShowModal(true);
  };

  const save = () => {
    const checklist = form.checklist.split('\n').filter(Boolean);
    if (editItem) {
      updatePMPlan(editItem.id, { ...form, checklist });
      showNotification('success', 'برنامه PM با موفقیت به‌روز شد.');
    } else {
      addPMPlan({
        id: Date.now(),
        ...form,
        checklist,
      });
      showNotification('success', 'برنامه PM جدید ایجاد شد.');
    }
    setShowModal(false);
  };

  const remove = (id: number) => {
    if (confirm('آیا از حذف این برنامه PM اطمینان دارید؟')) {
      deletePMPlan(id);
      showNotification('success', 'برنامه PM حذف شد.');
    }
  };

  const exportList = () => {
    exportToExcel(pmPlans, 'pm-plans', [
      { key: 'title', label: 'عنوان' },
      { key: 'frequency', label: 'تناوب' },
      { key: 'equipmentId', label: 'تجهیز' },
      { key: 'estimatedDuration', label: 'مدت (دقیقه)' },
    ]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title mb-0">برنامه‌های نگهداری پیشگیرانه (PM)</h2>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={exportList}><Download size={16} /> خروجی اکسل</button>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> افزودن PM جدید</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>عنوان برنامه</th>
                <th>تجهیز</th>
                <th>تناوب</th>
                <th>فاصله (روز)</th>
                <th>مدت تخمینی (دقیقه)</th>
                <th>تعداد آیتم چک‌لیست</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {pmPlans.map((p, idx) => (
                <tr key={p.id}>
                  <td>{toPersianDigits(idx + 1)}</td>
                  <td className="font-medium">{p.title}</td>
                  <td className="text-[var(--foreground-secondary)]">{equipmentMap.get(p.equipmentId) || '-'}</td>
                  <td><span className="badge badge-gold">{frequencyLabels[p.frequency] || p.frequency}</span></td>
                  <td>{toPersianDigits(p.intervalDays || 0)}</td>
                  <td>{toPersianDigits(p.estimatedDuration || 0)}</td>
                  <td>{toPersianDigits((p.checklist || []).length)}</td>
                  <td>
                    <span className={`badge ${p.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {p.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost !p-2" onClick={() => openEdit(p)} title="ویرایش"><Edit2 size={14} /></button>
                      <button className="btn btn-ghost !p-2 text-[var(--danger)]" onClick={() => remove(p.id)} title="حذف"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {pmPlans.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-[var(--foreground-muted)]">در حال بارگذاری برنامه‌های PM...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{editItem ? 'ویرایش برنامه PM' : 'افزودن برنامه PM جدید'}</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">تجهیز</label>
                <select className="select" value={form.equipmentId} onChange={e => setForm({ ...form, equipmentId: Number(e.target.value) })}>
                  {equipment.filter(e => e.isLeaf).map(e => <option key={e.id} value={e.id}>{e.name} {e.model ? `(${e.model})` : ''}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">عنوان برنامه</label>
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثلاً: سرویس ماهانه" />
              </div>
              <div>
                <label className="label">تناوب</label>
                <select className="select" value={form.frequency} onChange={e => {
                  const days = { daily: 1, weekly: 7, monthly: 30, quarterly: 90, yearly: 365 };
                  setForm({ ...form, frequency: e.target.value, intervalDays: days[e.target.value as keyof typeof days] });
                }}>
                  {Object.entries(frequencyLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">فاصله (روز)</label>
                <input type="number" className="input" value={form.intervalDays} onChange={e => setForm({ ...form, intervalDays: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">مدت تخمینی (دقیقه)</label>
                <input type="number" className="input" value={form.estimatedDuration} onChange={e => setForm({ ...form, estimatedDuration: Number(e.target.value) })} />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                  فعال
                </label>
              </div>
              <div className="col-span-2">
                <label className="label">آیتم‌های چک‌لیست (هر مورد در یک خط)</label>
                <textarea className="textarea" rows={6} value={form.checklist} onChange={e => setForm({ ...form, checklist: e.target.value })} placeholder="مورد ۱&#10;مورد ۲&#10;..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>انصراف</button>
              <button className="btn btn-primary" onClick={save}><Check size={16} /> {editItem ? 'ذخیره تغییرات' : 'ایجاد برنامه'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
