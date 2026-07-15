'use client';
import { create } from 'zustand';

// UI Store for sidebar, modals, etc.
interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (val: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  pageTitle: string;
  setPageTitle: (title: string) => void;
  notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string } | null;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  pageTitle: 'داشبورد',
  setPageTitle: (title) => set({ pageTitle: title }),
  notification: null,
  showNotification: (type, message) => {
    set({ notification: { type, message } });
    setTimeout(() => set({ notification: null }), 4000);
  },
  clearNotification: () => set({ notification: null }),
}));

// Equipment store
export interface Equipment {
  id: number;
  equipmentCode?: string;
  pmCode?: string;
  feCode?: string;
  name: string;
  model?: string;
  serialNumber?: string;
  manufacturer?: string;
  country?: string;
  location?: string;
  installationDate?: string;
  manufactureYear?: string;
  capacity?: string;
  power?: string;
  voltage?: string;
  parentId: number | null;
  level: number;
  nodeType: string;
  authorizedPersonnel?: string;
  hasPM?: boolean;
  pcRequired?: boolean;
  ncrRequired?: boolean;
  cbuRequired?: boolean;
  calibrationPeriod?: string;
  calibrationType?: string;
  status: string;
  isLeaf: boolean;
  customFields?: Record<string, any>;
  notes?: string;
}

interface EquipmentState {
  equipment: Equipment[];
  setEquipment: (e: Equipment[]) => void;
  addEquipment: (e: Equipment) => void;
  updateEquipment: (id: number, data: Partial<Equipment>) => void;
  deleteEquipment: (id: number) => void;
  selectedEquipmentId: number | null;
  setSelectedEquipmentId: (id: number | null) => void;
}

export const useEquipmentStore = create<EquipmentState>((set) => ({
  equipment: [],
  setEquipment: (e) => set({ equipment: e }),
  addEquipment: (e) => set((s) => ({ equipment: [...s.equipment, e] })),
  updateEquipment: (id, data) => set((s) => ({
    equipment: s.equipment.map((item) => item.id === id ? { ...item, ...data } : item)
  })),
  deleteEquipment: (id) => set((s) => {
    const toDelete = new Set<number>();
    const collectIds = (parentId: number) => {
      s.equipment.filter(e => e.parentId === parentId).forEach(child => {
        toDelete.add(child.id);
        collectIds(child.id);
      });
    };
    toDelete.add(id);
    collectIds(id);
    return { equipment: s.equipment.filter(e => !toDelete.has(e.id)) };
  }),
  selectedEquipmentId: null,
  setSelectedEquipmentId: (id) => set({ selectedEquipmentId: id }),
}));

// Work Orders
export interface WorkOrder {
  id: number;
  woNumber: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  equipmentId?: number;
  assignedTo?: number;
  requesterName?: string;
  scheduledDate?: string;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  failureType?: string;
  rootCause?: string;
  solution?: string;
  aiAnalysis?: string;
  sourceRequestId?: number;
  imageUrls?: string[];
  attachments?: any[];
  createdAt: string;
  // === فیلدهای جدید فرم تکنسین ===
  beforeImages?: string[];
  afterImages?: string[];
  receivedAt?: string;
  technicianReport?: string;
  voiceReport?: string;
  voiceReportDuration?: number;
  aiImageAnalysis?: { cause: string; solution: string; prevention: string; confidence: number; imagePreview?: string }[];
  managerFeedback?: string;
}

export interface WOConsultation {
  id: number;
  workOrderId: number;
  consultantName: string;
  consultationDate: string;
  content: string;
  createdAt: string;
}

interface WOState {
  workOrders: WorkOrder[];
  consultations: WOConsultation[];
  setWorkOrders: (w: WorkOrder[]) => void;
  addWorkOrder: (w: WorkOrder) => void;
  updateWorkOrder: (id: number, data: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: number) => void;
  addConsultation: (c: WOConsultation) => void;
  pendingWOData: Partial<WorkOrder> | null;
  setPendingWOData: (d: Partial<WorkOrder> | null) => void;
  openWOId: number | null;
  setOpenWOId: (id: number | null) => void;
}

export const useWOStore = create<WOState>((set) => ({
  workOrders: [],
  consultations: [],
  setWorkOrders: (w) => set({ workOrders: w }),
  addWorkOrder: (w) => set((s) => ({ workOrders: [...s.workOrders, w] })),
  updateWorkOrder: (id, data) => set((s) => ({
    workOrders: s.workOrders.map(w => w.id === id ? { ...w, ...data } : w)
  })),
  deleteWorkOrder: (id) => set((s) => ({ workOrders: s.workOrders.filter(w => w.id !== id) })),
  addConsultation: (c) => set((s) => ({ consultations: [...s.consultations, c] })),
  pendingWOData: null,
  setPendingWOData: (d) => set({ pendingWOData: d }),
  openWOId: null,
  setOpenWOId: (id) => set({ openWOId: id }),
}));

// Maintenance Requests - Form BFG-FR-27-72
export interface MaintenanceRequestItem {
  item: string;
  hoursOrCount: string;
  cost: string;
  notes: string;
}

export interface MaintenanceRequest {
  id: number;
  mrNumber: string;
  requesterFullName: string;
  department?: string;
  phone?: string;
  title: string;
  description: string;
  equipmentId?: number;
  location?: string;
  priority: string;
  status: string;
  requestedDate: string;
  convertedToWoId?: number;
  reviewNotes?: string;
  // === فرم BFG-FR-27-72 ===
  docCode?: string; // BFG-FR-27-72
  revisionDate?: string; // 1405/03/02
  receiptNumber?: string; // شماره رسید
  actionType?: 'emergency' | 'preventive' | 'service' | 'manufacturing' | ''; // نوع اقدام
  serviceType?: 'facilities' | 'electrical' | 'hydraulic' | 'other' | ''; // نوع خدمت
  equipmentCode?: string; // کد تجهیز
  installLocation?: string; // محل نصب
  breakdownDateTime?: string; // ساعت/تاریخ خرابی
  additionalInfo?: string; // اطلاعات تکمیلی
  causesStoppage?: boolean; // آیا توقف ایجاد شده
  stoppageDateTime?: string;
  urgencyLevel?: 'extreme' | 'necessary' | ''; // میزان ضرورت
  breakdownCause?: string; // تشخیص علت خرابی
  repairMethod?: 'internal' | 'external' | ''; // داخلی/خارجی
  contractorName?: string; // پیمانکار
  maintSupervisorName?: string;
  managementApproval?: string;
  workDoneDescription?: string;
  startDateTime?: string;
  endDateTime?: string;
  totalMaintenanceTime?: string;
  itemsUsed?: MaintenanceRequestItem[];
  maintTechSign?: string;
  requesterSign?: string;
  downtimeHours?: string;
  deliverySign?: string;
  deliveryTime?: string;
  deliveryReceiptNumber?: string;
}

interface MRState {
  requests: MaintenanceRequest[];
  setRequests: (r: MaintenanceRequest[]) => void;
  addRequest: (r: MaintenanceRequest) => void;
  updateRequest: (id: number, data: Partial<MaintenanceRequest>) => void;
  deleteRequest: (id: number) => void;
}

export const useMRStore = create<MRState>((set) => ({
  requests: [],
  setRequests: (r) => set({ requests: r }),
  addRequest: (r) => set((s) => ({ requests: [...s.requests, r] })),
  updateRequest: (id, data) => set((s) => ({
    requests: s.requests.map(r => r.id === id ? { ...r, ...data } : r)
  })),
  deleteRequest: (id) => set((s) => ({ requests: s.requests.filter(r => r.id !== id) })),
}));

// Personnel
export interface Personnel {
  id: number;
  personnelCode?: string;
  fullName: string;
  nationalId?: string;
  jobTitle?: string;
  department?: string;
  shift?: string;
  phone?: string;
  email?: string;
  hireDate?: string;
  isActive: boolean;
  skills?: string[];
  avatarColor?: string;
}

export interface Attendance {
  id: number;
  personnelId: number;
  attendanceDate: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  workMinutes?: number;
  lateMinutes?: number;
  notes?: string;
}

export interface Leave {
  id: number;
  personnelId: number;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason?: string;
  status: string;
  approvedBy?: string;
  notes?: string;
}

interface PersonnelState {
  personnel: Personnel[];
  attendance: Attendance[];
  leaves: Leave[];
  setPersonnel: (p: Personnel[]) => void;
  addPersonnel: (p: Personnel) => void;
  updatePersonnel: (id: number, data: Partial<Personnel>) => void;
  deletePersonnel: (id: number) => void;
  setAttendance: (a: Attendance[]) => void;
  addAttendance: (a: Attendance) => void;
  setLeaves: (l: Leave[]) => void;
  addLeave: (l: Leave) => void;
  updateLeave: (id: number, data: Partial<Leave>) => void;
}

export const usePersonnelStore = create<PersonnelState>((set) => ({
  personnel: [],
  attendance: [],
  leaves: [],
  setPersonnel: (p) => set({ personnel: p }),
  addPersonnel: (p) => set((s) => ({ personnel: [...s.personnel, p] })),
  updatePersonnel: (id, data) => set((s) => ({
    personnel: s.personnel.map(p => p.id === id ? { ...p, ...data } : p)
  })),
  deletePersonnel: (id) => set((s) => ({ personnel: s.personnel.filter(p => p.id !== id) })),
  setAttendance: (a) => set({ attendance: a }),
  addAttendance: (a) => set((s) => ({ attendance: [...s.attendance, a] })),
  setLeaves: (l) => set({ leaves: l }),
  addLeave: (l) => set((s) => ({ leaves: [...s.leaves, l] })),
  updateLeave: (id, data) => set((s) => ({
    leaves: s.leaves.map(l => l.id === id ? { ...l, ...data } : l)
  })),
}));

// Suppliers
export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  category?: string;
  rating?: number;
  isActive: boolean;
  notes?: string;
}

interface SupplierState {
  suppliers: Supplier[];
  setSuppliers: (s: Supplier[]) => void;
  addSupplier: (s: Supplier) => void;
  updateSupplier: (id: number, data: Partial<Supplier>) => void;
  deleteSupplier: (id: number) => void;
}

export const useSupplierStore = create<SupplierState>((set) => ({
  suppliers: [],
  setSuppliers: (s) => set({ suppliers: s }),
  addSupplier: (s) => set((st) => ({ suppliers: [...st.suppliers, s] })),
  updateSupplier: (id, data) => set((st) => ({
    suppliers: st.suppliers.map(s => s.id === id ? { ...s, ...data } : s)
  })),
  deleteSupplier: (id) => set((st) => ({ suppliers: st.suppliers.filter(s => s.id !== id) })),
}));

// Spare parts
export interface SparePart {
  id: number;
  partNumber?: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  currentStock: number;
  minStock: number;
  unitCost?: number;
  supplierId?: number;
  location?: string;
}

interface SparePartState {
  spareParts: SparePart[];
  setSpareParts: (p: SparePart[]) => void;
  addSparePart: (p: SparePart) => void;
  updateSparePart: (id: number, data: Partial<SparePart>) => void;
  deleteSparePart: (id: number) => void;
}

export const useSparePartStore = create<SparePartState>((set) => ({
  spareParts: [],
  setSpareParts: (p) => set({ spareParts: p }),
  addSparePart: (p) => set((s) => ({ spareParts: [...s.spareParts, p] })),
  updateSparePart: (id, data) => set((s) => ({
    spareParts: s.spareParts.map(p => p.id === id ? { ...p, ...data } : p)
  })),
  deleteSparePart: (id) => set((s) => ({ spareParts: s.spareParts.filter(p => p.id !== id) })),
}));

// Work Order History / Maintenance Logs
export interface MaintenanceLog {
  id: number;
  workOrderId?: number;
  equipmentId: number;
  activityType: string;
  title: string;
  description?: string;
  performedBy?: string;
  performedDate: string;
  durationMinutes?: number;
  cost?: number;
  outcome?: string;
  notes?: string;
  isMockData?: boolean;
}

interface LogState {
  logs: MaintenanceLog[];
  setLogs: (l: MaintenanceLog[]) => void;
  addLog: (l: MaintenanceLog) => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  setLogs: (l) => set({ logs: l }),
  addLog: (l) => set((s) => ({ logs: [...s.logs, l] })),
}));

// PM Plans
export interface PMPlan {
  id: number;
  equipmentId: number;
  title: string;
  frequency: string;
  intervalDays?: number;
  description?: string;
  checklist?: string[];
  estimatedDuration?: number;
  isActive: boolean;
  lastDone?: string;
  nextDue?: string;
}

interface PMState {
  pmPlans: PMPlan[];
  setPMPlans: (p: PMPlan[]) => void;
  addPMPlan: (p: PMPlan) => void;
  updatePMPlan: (id: number, data: Partial<PMPlan>) => void;
  deletePMPlan: (id: number) => void;
}

export const usePMStore = create<PMState>((set) => ({
  pmPlans: [],
  setPMPlans: (p) => set({ pmPlans: p }),
  addPMPlan: (p) => set((s) => ({ pmPlans: [...s.pmPlans, p] })),
  updatePMPlan: (id, data) => set((s) => ({
    pmPlans: s.pmPlans.map(p => p.id === id ? { ...p, ...data } : p)
  })),
  deletePMPlan: (id) => set((s) => ({ pmPlans: s.pmPlans.filter(p => p.id !== id) })),
}));

// ============== EQUIPMENT PASSPORT (Digital Equipment Passport) ==============
export interface EquipmentPart {
  id: number;
  equipmentId: number;
  name: string;
  criticality: 'main' | 'secondary' | 'consumable'; // اصلی / فرعی / مصرفی
  stockStatus: 'available' | 'unavailable' | 'in_use'; // موجود / ناموجود / در حال فعالیت
  notes?: string;
}

export interface EquipmentPMOperation {
  id: number;
  equipmentId: number;
  description: string;
  period: string; // روزانه / هفتگی / ماهانه / فصلی / سالانه / ...
  notes?: string;
}

export interface EquipmentMaintenanceRecord {
  id: number;
  equipmentId: number;
  partName?: string; // نام قطعه مورد تعمیر
  partCriticality?: 'main' | 'secondary' | 'consumable';
  partStockStatus?: 'available' | 'unavailable' | 'in_use';
  stopStatus?: 'stopped' | 'running'; // متوقف / در حال فعالیت
  stopTime?: string; // زمان توقف
  maintenanceDate?: string; // تاریخ انجام
  startTime?: string; // ساعت شروع
  endTime?: string; // ساعت پایان
  downtimeMinutes?: number; // مدت توقف (دقیقه)
  activityType: 'pm' | 'cm' | 'emergency' | 'inspection' | 'service' | 'overhaul' | 'calibration' | 'other';
  pmOrEm?: 'PM' | 'EM';
  workOrderNumber?: string;
  description: string; // شرح کامل فعالیت
  failureCause?: string;
  rootCause?: string;
  actionsTaken?: string;
  consumedParts?: string;
  replacedParts?: string;
  personnel?: string; // نفرات انجام‌دهنده
  contractor?: string;
  cost?: number;
  productionDowntime?: number; // مدت توقف تولید (دقیقه)
  result?: string;
  equipmentStatusAfter?: string;
  beforeImages?: string[];
  afterImages?: string[];
  attachments?: { name: string; url: string; size?: number }[];
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface PMPlanFull {
  id: number;
  equipmentId: number;
  title: string;
  planType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'runtime_hours' | 'cycles' | 'condition';
  frequency: string;
  intervalDays?: number;
  intervalHours?: number;
  intervalCycles?: number;
  startDate?: string;
  endDate?: string;
  instructions?: string;
  checklist?: string[];
  tools?: string;
  spareParts?: string;
  consumables?: string;
  lubricants?: string;
  standardReference?: string;
  estimatedDuration?: number; // دقیقه
  responsibleId?: number;
  approverId?: number;
  importanceLevel: 'low' | 'medium' | 'high' | 'critical';
  equipmentCriticality: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  lastDone?: string;
  nextDue?: string;
}

export interface CalibrationRecord {
  id: number;
  date: string;
  records?: string; // سوابق اجرایی
  calibratorName?: string;
  signature?: string;
}

export interface EquipmentCalibration {
  id: number;
  equipmentId: number;
  range?: string; // محدوده اندازه‌گیری
  parameter?: string; // پارامتر اندازه‌گیری
  accuracy?: string; // دقت
  period?: string; // دوره
  type?: 'internal' | 'external'; // نوع
  location?: string; // محل استفاده
  method?: string; // متد اجرا
  records: CalibrationRecord[];
  responsibleSign?: string;
}

// ============== CORRECTIVE ACTIONS (CAPA / 8D / RCA) ==============
export interface CorrectiveAction {
  id: number;
  carNumber: string;
  title: string;
  description: string;
  source: 'workorder' | 'request' | 'inspection' | 'audit' | 'customer' | 'internal';
  sourceId?: number;
  equipmentId?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'quality' | 'safety' | 'environment' | 'process' | 'equipment' | 'other';
  // 8D fields
  d1_team?: string;           // تیم حل مسئله
  d2_problem?: string;        // تعریف مشکل
  d3_containment?: string;    // اقدام موقت
  d4_rootCause?: string;      // علت ریشه‌ای (RCA)
  d5_permanentAction?: string; // اقدام اصلاحی دائمی
  d6_implementation?: string; // اجرای اقدام
  d7_prevention?: string;     // جلوگیری از تکرار
  d8_congratulation?: string; // تقدیر از تیم
  // CAPA
  rootCauseMethod?: '5why' | 'fishbone' | 'fta' | 'pareto' | 'other';
  rootCauseAnalysis?: string;
  assignedTo?: number;
  dueDate?: string;
  status: 'open' | 'in_progress' | 'review' | 'closed' | 'cancelled';
  effectivenessCheck?: string;
  effectivenessResult?: 'effective' | 'ineffective' | 'pending';
  closedDate?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============== NOTIFICATIONS ==============
export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  source?: string;
  sourceId?: number;
  channels: {
    inApp: boolean;
    whatsapp: boolean;
    telegram: boolean;
    sms: boolean;
    bale: boolean;
    email: boolean;
  };
  channelStatus?: Partial<Record<'whatsapp' | 'telegram' | 'sms' | 'bale' | 'email', 'sent' | 'failed' | 'pending'>>;
  recipients?: string[];
  isRead?: boolean;
  createdAt: string;
}

export interface NotificationChannelConfig {
  whatsapp: { enabled: boolean; provider: 'twilio' | 'kavenegar' | 'meta'; apiKey: string; fromNumber: string; defaultRecipients: string };
  telegram: { enabled: boolean; botToken: string; chatIds: string };
  sms: { enabled: boolean; provider: 'kavenegar' | 'ghasedak' | 'farazsms'; apiKey: string; lineNumber: string; defaultRecipients: string };
  bale: { enabled: boolean; botToken: string; chatIds: string };
  email: { enabled: boolean; smtpHost: string; smtpPort: number; smtpUser: string; smtpPass: string; fromAddress: string; defaultRecipients: string };
}

// ============== PM KPIs (standard) ==============
export interface PMKpiMetric {
  key: string;
  name: string;
  nameEn: string;
  value: number;
  target: number;
  unit: string;
  formula: string;
  description: string;
  category: 'reliability' | 'compliance' | 'cost' | 'inventory' | 'safety' | 'efficiency';
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

// ============== TECHNICAL PERSONNEL ==============
export interface TechnicalPersonnel {
  id: number;
  codeNET: string;
  codePersonnel: string;
  firstName: string;
  lastName: string;
  contractType: string;
  gender: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  idNumber?: string;
  nationalCode?: string;
  address?: string;
  zipCode?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  situation?: string;
  companyDate?: string;
  netDate?: string;
  txtImageName?: string;
  avatarUrl?: string;
  accountId?: number; // Link to user account
  createdAt: string;
}

// Messaging
export interface Conversation {
  id: number;
  title?: string;
  type: string;
  createdBy: number;
  lastMessageAt?: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageParticipant {
  id: number;
  conversationId: number;
  userId: number;
  isAdmin: boolean;
  lastReadAt?: string;
  joinedAt?: string;
}

interface MessageState {
  conversations: Conversation[];
  messages: Message[];
  participants: MessageParticipant[];
  setConversations: (c: Conversation[]) => void;
  setMessages: (m: Message[]) => void;
  setParticipants: (p: MessageParticipant[]) => void;
  addMessage: (m: Message) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  conversations: [],
  messages: [],
  participants: [],
  setConversations: (c) => set({ conversations: c }),
  setMessages: (m) => set({ messages: m }),
  setParticipants: (p) => set({ participants: p }),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
}));

// Current logged-in user (mock)
export const CURRENT_USER = {
  id: 1,
  fullName: 'مدیر سیستم',
  role: 'admin',
  department: 'نگهداری و تعمیرات',
  jobTitle: 'مدیر فنی',
};

// ============== CORRECTIVE ACTIONS STORE ==============
interface CorrectiveActionState {
  actions: CorrectiveAction[];
  setActions: (a: CorrectiveAction[]) => void;
  addAction: (a: CorrectiveAction) => void;
  updateAction: (id: number, data: Partial<CorrectiveAction>) => void;
  deleteAction: (id: number) => void;
}

export const useCAStore = create<CorrectiveActionState>((set) => ({
  actions: [],
  setActions: (a) => set({ actions: a }),
  addAction: (a) => set((s) => ({ actions: [...s.actions, a] })),
  updateAction: (id, data) => set((s) => ({
    actions: s.actions.map(a => a.id === id ? { ...a, ...data } : a)
  })),
  deleteAction: (id) => set((s) => ({ actions: s.actions.filter(a => a.id !== id) })),
}));

// ============== TECHNICAL PERSONNEL STORE ==============
interface TechnicalPersonnelState {
  technicalPersonnel: TechnicalPersonnel[];
  setTechnicalPersonnel: (p: TechnicalPersonnel[]) => void;
  addTechnicalPersonnel: (p: TechnicalPersonnel) => void;
  updateTechnicalPersonnel: (id: number, data: Partial<TechnicalPersonnel>) => void;
  deleteTechnicalPersonnel: (id: number) => void;
}

export const useTechnicalPersonnelStore = create<TechnicalPersonnelState>((set) => ({
  technicalPersonnel: [],
  setTechnicalPersonnel: (p) => set({ technicalPersonnel: p }),
  addTechnicalPersonnel: (p) => set((s) => ({ technicalPersonnel: [...s.technicalPersonnel, p] })),
  updateTechnicalPersonnel: (id, data) => set((s) => ({
    technicalPersonnel: s.technicalPersonnel.map(p => p.id === id ? { ...p, ...data } : p)
  })),
  deleteTechnicalPersonnel: (id) => set((s) => ({
    technicalPersonnel: s.technicalPersonnel.filter(p => p.id !== id)
  })),
}));

// ============== EQUIPMENT PASSPORT STORE ==============
interface EquipmentPassportState {
  parts: EquipmentPart[];
  pmOperations: EquipmentPMOperation[];
  maintenanceRecords: EquipmentMaintenanceRecord[];
  pmPlansFull: PMPlanFull[];
  calibrations: EquipmentCalibration[];
  addPart: (p: EquipmentPart) => void;
  updatePart: (id: number, data: Partial<EquipmentPart>) => void;
  deletePart: (id: number) => void;
  addPMOperation: (p: EquipmentPMOperation) => void;
  updatePMOperation: (id: number, data: Partial<EquipmentPMOperation>) => void;
  deletePMOperation: (id: number) => void;
  addMaintenanceRecord: (r: EquipmentMaintenanceRecord) => void;
  updateMaintenanceRecord: (id: number, data: Partial<EquipmentMaintenanceRecord>) => void;
  deleteMaintenanceRecord: (id: number) => void;
  addPMPlanFull: (p: PMPlanFull) => void;
  updatePMPlanFull: (id: number, data: Partial<PMPlanFull>) => void;
  deletePMPlanFull: (id: number) => void;
  addCalibration: (c: EquipmentCalibration) => void;
  updateCalibration: (id: number, data: Partial<EquipmentCalibration>) => void;
  deleteCalibration: (id: number) => void;
}

export const useEquipmentPassportStore = create<EquipmentPassportState>((set) => ({
  parts: [],
  pmOperations: [],
  maintenanceRecords: [],
  pmPlansFull: [],
  calibrations: [],
  addPart: (p) => set((s) => ({ parts: [...s.parts, p] })),
  updatePart: (id, data) => set((s) => ({ parts: s.parts.map(p => p.id === id ? { ...p, ...data } : p) })),
  deletePart: (id) => set((s) => ({ parts: s.parts.filter(p => p.id !== id) })),
  addPMOperation: (p) => set((s) => ({ pmOperations: [...s.pmOperations, p] })),
  updatePMOperation: (id, data) => set((s) => ({ pmOperations: s.pmOperations.map(p => p.id === id ? { ...p, ...data } : p) })),
  deletePMOperation: (id) => set((s) => ({ pmOperations: s.pmOperations.filter(p => p.id !== id) })),
  addMaintenanceRecord: (r) => set((s) => ({ maintenanceRecords: [...s.maintenanceRecords, r] })),
  updateMaintenanceRecord: (id, data) => set((s) => ({ maintenanceRecords: s.maintenanceRecords.map(r => r.id === id ? { ...r, ...data } : r) })),
  deleteMaintenanceRecord: (id) => set((s) => ({ maintenanceRecords: s.maintenanceRecords.filter(r => r.id !== id) })),
  addPMPlanFull: (p) => set((s) => ({ pmPlansFull: [...s.pmPlansFull, p] })),
  updatePMPlanFull: (id, data) => set((s) => ({ pmPlansFull: s.pmPlansFull.map(p => p.id === id ? { ...p, ...data } : p) })),
  deletePMPlanFull: (id) => set((s) => ({ pmPlansFull: s.pmPlansFull.filter(p => p.id !== id) })),
  addCalibration: (c) => set((s) => ({ calibrations: [...s.calibrations, c] })),
  updateCalibration: (id, data) => set((s) => ({ calibrations: s.calibrations.map(c => c.id === id ? { ...c, ...data } : c) })),
  deleteCalibration: (id) => set((s) => ({ calibrations: s.calibrations.filter(c => c.id !== id) })),
}));

// ============== NOTIFICATIONS STORE ==============
interface NotificationState {
  notifications: NotificationItem[];
  channelConfig: NotificationChannelConfig;
  setNotifications: (n: NotificationItem[]) => void;
  addNotification: (n: NotificationItem) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  updateChannelConfig: (c: Partial<NotificationChannelConfig>) => void;
}

const defaultChannelConfig: NotificationChannelConfig = {
  whatsapp: { enabled: false, provider: 'meta', apiKey: '', fromNumber: '', defaultRecipients: '' },
  telegram: { enabled: false, botToken: '', chatIds: '' },
  sms: { enabled: false, provider: 'kavenegar', apiKey: '', lineNumber: '', defaultRecipients: '' },
  bale: { enabled: false, botToken: '', chatIds: '' },
  email: { enabled: false, smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpUser: '', smtpPass: '', fromAddress: '', defaultRecipients: '' },
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  channelConfig: defaultChannelConfig,
  setNotifications: (n) => set({ notifications: n }),
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
  markAsRead: (id) => set((s) => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  })),
  markAllAsRead: () => set((s) => ({
    notifications: s.notifications.map(n => ({ ...n, isRead: true }))
  })),
  deleteNotification: (id) => set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) })),
  updateChannelConfig: (c) => set((s) => ({ channelConfig: { ...s.channelConfig, ...c } })),
}));
