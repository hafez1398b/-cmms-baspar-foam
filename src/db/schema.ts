import { pgTable, serial, varchar, text, integer, boolean, timestamp, jsonb, date, real, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============== USERS ==============
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  fullName: varchar('full_name', { length: 200 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user').notNull(), // admin, technician, manager, viewer
  email: varchar('email', { length: 200 }),
  phone: varchar('phone', { length: 20 }),
  department: varchar('department', { length: 100 }),
  jobTitle: varchar('job_title', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  avatarColor: varchar('avatar_color', { length: 20 }).default('#D4A555'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  workOrders: many(workOrders),
  messages: many(messageParticipants),
}));

// ============== EQUIPMENT TREE ==============
export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  equipmentCode: varchar('equipment_code', { length: 100 }),
  pmCode: varchar('pm_code', { length: 100 }),
  feCode: varchar('fe_code', { length: 100 }),
  name: varchar('name', { length: 300 }).notNull(),
  model: varchar('model', { length: 200 }),
  serialNumber: varchar('serial_number', { length: 200 }),
  manufacturer: varchar('manufacturer', { length: 200 }),
  country: varchar('country', { length: 100 }),
  location: varchar('location', { length: 300 }), // محل استفاده
  installationDate: date('installation_date'),
  manufactureYear: varchar('manufacture_year', { length: 20 }),
  capacity: varchar('capacity', { length: 200 }),
  power: varchar('power', { length: 200 }),
  voltage: varchar('voltage', { length: 200 }),
  parentId: integer('parent_id'),
  level: integer('level').default(0).notNull(), // 0=factory, 1=site, 2=unit, 3=line, 4=machine, 5=sub-equipment
  nodeType: varchar('node_type', { length: 50 }).default('machine').notNull(), // factory, site, unit, line, machine, component
  authorizedPersonnel: text('authorized_personnel'), // سمت مجاز به کار
  hasPM: boolean('has_pm').default(true),
  pcRequired: boolean('pc_required').default(false),
  ncrRequired: boolean('ncr_required').default(false),
  cbuRequired: boolean('cbu_required').default(false),
  calibrationPeriod: varchar('calibration_period', { length: 100 }),
  calibrationType: varchar('calibration_type', { length: 100 }),
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, inactive, under_repair, decommissioned
  isLeaf: boolean('is_leaf').default(false).notNull(),
  iconName: varchar('icon_name', { length: 50 }),
  customFields: jsonb('custom_fields').default('{}'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: integer('created_by'),
});

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  parent: one(equipment, { fields: [equipment.parentId], references: [equipment.id], relationName: 'parent_child' }),
  children: many(equipment, { relationName: 'parent_child' }),
  workOrders: many(workOrders),
  maintenanceRequests: many(maintenanceRequests),
  pmPlans: many(pmPlans),
  history: many(workOrderHistory),
  spareParts: many(equipmentSpareParts),
}));

// ============== SUPPLIERS ==============
export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 300 }).notNull(),
  contactPerson: varchar('contact_person', { length: 200 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 200 }),
  address: text('address'),
  category: varchar('category', { length: 100 }),
  taxId: varchar('tax_id', { length: 50 }),
  notes: text('notes'),
  rating: real('rating').default(5),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============== PM PLANS ==============
export const pmPlans = pgTable('pm_plans', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(), // daily, weekly, monthly, quarterly, yearly
  intervalDays: integer('interval_days'),
  assigneeId: integer('assignee_id').references(() => users.id),
  description: text('description'),
  checklist: jsonb('checklist').default('[]'),
  estimatedDuration: integer('estimated_duration'), // minutes
  isActive: boolean('is_active').default(true).notNull(),
  lastDone: date('last_done'),
  nextDue: date('next_due'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============== WORK ORDERS ==============
export const workOrders = pgTable('work_orders', {
  id: serial('id').primaryKey(),
  woNumber: varchar('wo_number', { length: 100 }).unique().notNull(),
  title: varchar('title', { length: 400 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).default('corrective').notNull(), // corrective, preventive, predictive, emergency
  priority: varchar('priority', { length: 30 }).default('medium').notNull(), // low, medium, high, critical
  status: varchar('status', { length: 40 }).default('open').notNull(), // open, in_progress, on_hold, completed, cancelled
  equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'set null' }),
  requestedBy: integer('requested_by').references(() => users.id),
  assignedTo: integer('assigned_to').references(() => users.id),
  supervisorId: integer('supervisor_id').references(() => users.id),
  requesterName: varchar('requester_name', { length: 200 }),
  sourceRequestId: integer('source_request_id'), // from maintenance_requests
  scheduledDate: date('scheduled_date'),
  dueDate: date('due_date'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  estimatedHours: real('estimated_hours'),
  actualHours: real('actual_hours'),
  laborCost: real('labor_cost').default(0),
  partsCost: real('parts_cost').default(0),
  totalCost: real('total_cost').default(0),
  failureType: varchar('failure_type', { length: 100 }),
  rootCause: text('root_cause'),
  solution: text('solution'),
  downtimeMinutes: integer('downtime_minutes').default(0),
  aiAnalysis: text('ai_analysis'),
  imageUrls: jsonb('image_urls').default('[]'),
  attachments: jsonb('attachments').default('[]'),
  tags: jsonb('tags').default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  equipment: one(equipment, { fields: [workOrders.equipmentId], references: [equipment.id] }),
  assignee: one(users, { fields: [workOrders.assignedTo], references: [users.id] }),
  consultations: many(workOrderConsultations),
  history: many(workOrderHistory),
  partsUsed: many(workOrderPartsUsed),
}));

// ============== WORK ORDER CONSULTATIONS (مشاوره مدیر فنی) ==============
export const workOrderConsultations = pgTable('work_order_consultations', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }).notNull(),
  consultantName: varchar('consultant_name', { length: 200 }).notNull(),
  consultationDate: date('consultation_date').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============== MAINTENANCE REQUESTS (درخواست تعمیرات) ==============
export const maintenanceRequests = pgTable('maintenance_requests', {
  id: serial('id').primaryKey(),
  mrNumber: varchar('mr_number', { length: 100 }).unique().notNull(),
  requesterFullName: varchar('requester_full_name', { length: 300 }).notNull(),
  department: varchar('department', { length: 200 }),
  phone: varchar('phone', { length: 30 }),
  title: varchar('title', { length: 400 }).notNull(),
  description: text('description').notNull(),
  equipmentId: integer('equipment_id').references(() => equipment.id),
  location: varchar('location', { length: 300 }),
  priority: varchar('priority', { length: 30 }).default('medium').notNull(),
  status: varchar('status', { length: 40 }).default('pending').notNull(), // pending, reviewed, approved, converted, rejected
  convertedToWoId: integer('converted_to_wo_id'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  requestedDate: date('requested_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============== WORK ORDER HISTORY (سوابق) ==============
export const workOrderHistory = pgTable('work_order_history', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }),
  equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'cascade' }),
  activityType: varchar('activity_type', { length: 50 }).notNull(), // pm, repair, inspection, calibration
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  performedBy: varchar('performed_by', { length: 200 }),
  performedDate: date('performed_date').notNull(),
  durationMinutes: integer('duration_minutes'),
  cost: real('cost').default(0),
  partsUsed: jsonb('parts_used').default('[]'),
  outcome: varchar('outcome', { length: 50 }), // successful, partial, unsuccessful
  notes: text('notes'),
  isMockData: boolean('is_mock_data').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============== SPARE PARTS / INVENTORY ==============
export const spareParts = pgTable('spare_parts', {
  id: serial('id').primaryKey(),
  partNumber: varchar('part_number', { length: 100 }).unique(),
  name: varchar('name', { length: 300 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  unit: varchar('unit', { length: 50 }).default('عدد'),
  currentStock: real('current_stock').default(0),
  minStock: real('min_stock').default(0),
  maxStock: real('max_stock'),
  unitCost: real('unit_cost').default(0),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  location: varchar('location', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const equipmentSpareParts = pgTable('equipment_spare_parts', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'cascade' }).notNull(),
  partId: integer('part_id').references(() => spareParts.id, { onDelete: 'cascade' }).notNull(),
  quantity: real('quantity').default(1),
  isCritical: boolean('is_critical').default(false),
});

export const workOrderPartsUsed = pgTable('work_order_parts_used', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').references(() => workOrders.id, { onDelete: 'cascade' }).notNull(),
  partId: integer('part_id').references(() => spareParts.id),
  partName: varchar('part_name', { length: 300 }),
  quantity: real('quantity').default(1),
  unitCost: real('unit_cost').default(0),
  totalCost: real('total_cost').default(0),
});

// ============== PERSONNEL ==============
export const personnel = pgTable('personnel', {
  id: serial('id').primaryKey(),
  personnelCode: varchar('personnel_code', { length: 50 }).unique(),
  fullName: varchar('full_name', { length: 300 }).notNull(),
  nationalId: varchar('national_id', { length: 20 }),
  jobTitle: varchar('job_title', { length: 200 }),
  department: varchar('department', { length: 200 }),
  shift: varchar('shift', { length: 50 }), // morning, evening, night, rotational
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 200 }),
  hireDate: date('hire_date'),
  isActive: boolean('is_active').default(true).notNull(),
  skills: jsonb('skills').default('[]'),
  notes: text('notes'),
  avatarColor: varchar('avatar_color', { length: 20 }).default('#3B82F6'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  personnelId: integer('personnel_id').references(() => personnel.id, { onDelete: 'cascade' }).notNull(),
  attendanceDate: date('attendance_date').notNull(),
  checkIn: timestamp('check_in'),
  checkOut: timestamp('check_out'),
  status: varchar('status', { length: 30 }).default('present').notNull(), // present, absent, leave, half_day, holiday
  workMinutes: integer('work_minutes'),
  lateMinutes: integer('late_minutes').default(0),
  earlyLeaveMinutes: integer('early_leave_minutes').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaves = pgTable('leaves', {
  id: serial('id').primaryKey(),
  personnelId: integer('personnel_id').references(() => personnel.id, { onDelete: 'cascade' }).notNull(),
  leaveType: varchar('leave_type', { length: 50 }).notNull(), // annual, sick, casual, unpaid, maternity
  fromDate: date('from_date').notNull(),
  toDate: date('to_date').notNull(),
  days: real('days').notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 30 }).default('pending').notNull(), // pending, approved, rejected
  approvedBy: varchar('approved_by', { length: 200 }),
  approvedAt: timestamp('approved_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============== MESSAGING ==============
export const messageConversations = pgTable('message_conversations', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 300 }),
  type: varchar('type', { length: 20 }).default('private').notNull(), // private, group
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastMessageAt: timestamp('last_message_at'),
});

export const messageParticipants = pgTable('message_participants', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => messageConversations.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isAdmin: boolean('is_admin').default(false),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  lastReadAt: timestamp('last_read_at'),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => messageConversations.id, { onDelete: 'cascade' }).notNull(),
  senderId: integer('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============== EXCEL IMPORT MAPPING TEMPLATES ==============
export const mappingTemplates = pgTable('mapping_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 300 }).notNull(),
  targetModule: varchar('target_module', { length: 100 }).notNull(), // equipment, spare_parts, etc
  sheetName: varchar('sheet_name', { length: 200 }),
  headerRowIndex: integer('header_row_index').default(0),
  columnMappings: jsonb('column_mappings').notNull(), // {excelColumn: systemField}
  learnedFrom: jsonb('learned_from').default('[]'),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============== FILE REPOSITORY ==============
export const fileRepository = pgTable('file_repository', {
  id: serial('id').primaryKey(),
  originalName: varchar('original_name', { length: 400 }).notNull(),
  storedName: varchar('stored_name', { length: 400 }),
  mimeType: varchar('mime_type', { length: 200 }),
  sizeBytes: integer('size_bytes'),
  category: varchar('category', { length: 100 }), // excel, pdf, image, doc
  relatedEquipmentId: integer('related_equipment_id'),
  relatedWoId: integer('related_wo_id'),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  analysisResult: jsonb('analysis_result'),
  aiDetectedFields: jsonb('ai_detected_fields'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============== CHECKLISTS ==============
export const checklists = pgTable('checklists', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 300 }).notNull(),
  equipmentTypeId: integer('equipment_type_id'),
  equipmentId: integer('equipment_id').references(() => equipment.id),
  description: text('description'),
  items: jsonb('items').default('[]').notNull(),
  frequency: varchar('frequency', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
