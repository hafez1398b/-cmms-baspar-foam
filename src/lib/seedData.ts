import { MEMORY_FOAM_FACTORY_EQUIPMENT, LAB_EQUIPMENT } from './utils';

// Determine which Baspar factory based on equipment code prefix
export function getBasparFactory(code: string | undefined): number {
  if (!code) return 1; // Default to Baspar 1
  const c = code.toUpperCase();
  if (c.startsWith('B1') || c.startsWith('FE-0')) return 1;
  if (c.startsWith('B2')) return 2;
  if (c.startsWith('B3')) return 3;
  if (c.startsWith('B4')) return 4;
  if (c.startsWith('B5')) return 5;
  if (c.startsWith('B6')) return 6;
  // Lab equipment (SC-) and others go to Baspar 1
  return 1;
}

// Build initial equipment tree with new Baspar structure
export function buildInitialEquipmentTree() {
  const equipment: any[] = [];
  let idCounter = 1;

  // Root: کارخانجات دانش‌بنیان بسپار فوم غرب (سلن)
  const rootId = idCounter++;
  equipment.push({
    id: rootId,
    name: 'کارخانجات دانش‌بنیان بسپار فوم غرب (سلن)',
    nodeType: 'factory',
    parentId: null,
    level: 0,
    isLeaf: false,
    status: 'active',
    hasPM: true,
    location: 'شهرک صنعتی',
  });

  // 6 Baspar factories
  const basparIds: Record<number, number> = {};
  const basparNames: Record<number, string> = {
    1: 'بسپار ۱ (کارخانه فوم)',
    2: 'بسپار ۲',
    3: 'بسپار ۳ (کارخانه اسفنج)',
    4: 'بسپار ۴',
    5: 'بسپار ۵',
    6: 'بسپار ۶',
  };

  for (let i = 1; i <= 6; i++) {
    basparIds[i] = idCounter++;
    equipment.push({
      id: basparIds[i],
      name: basparNames[i],
      nodeType: 'site',
      parentId: rootId,
      level: 1,
      isLeaf: false,
      status: 'active',
    });
  }

  // Lab unit under Baspar 1
  const labUnitId = idCounter++;
  equipment.push({
    id: labUnitId,
    name: 'آزمایشگاه و کنترل کیفیت',
    nodeType: 'unit',
    parentId: basparIds[1],
    level: 2,
    isLeaf: false,
    status: 'active',
  });

  // Production units under Baspar 1
  const foamUnitId = idCounter++;
  equipment.push({
    id: foamUnitId,
    name: 'واحد چیدمان فوم',
    nodeType: 'unit',
    parentId: basparIds[1],
    level: 2,
    isLeaf: false,
    status: 'active',
  });

  const foamStorageId = idCounter++;
  equipment.push({
    id: foamStorageId,
    name: 'انبار فوم',
    nodeType: 'unit',
    parentId: basparIds[1],
    level: 2,
    isLeaf: false,
    status: 'active',
  });

  // Lines under units
  const line1Id = idCounter++;
  equipment.push({
    id: line1Id,
    name: 'خط تولید فوم',
    nodeType: 'line',
    parentId: foamUnitId,
    level: 3,
    isLeaf: false,
    status: 'active',
  });

  const storageLineId = idCounter++;
  equipment.push({
    id: storageLineId,
    name: 'تجهیزات انبار',
    nodeType: 'line',
    parentId: foamStorageId,
    level: 3,
    isLeaf: false,
    status: 'active',
  });

  // Add Memory Foam equipment (conveyors, coolers) to Baspar 1 lines
  const conveyorsFoam = MEMORY_FOAM_FACTORY_EQUIPMENT.slice(0, 7);
  const coolers = MEMORY_FOAM_FACTORY_EQUIPMENT.slice(13, 17);
  const conveyorsStorage = MEMORY_FOAM_FACTORY_EQUIPMENT.slice(7, 13);

  [...conveyorsFoam, ...coolers].forEach((eq) => {
    equipment.push({
      id: idCounter++,
      name: eq.name,
      model: eq.model,
      serialNumber: eq.serialNumber,
      pmCode: eq.pmCode,
      feCode: eq.feCode,
      manufacturer: eq.manufacturer,
      country: eq.country,
      location: eq.location,
      nodeType: 'machine',
      parentId: line1Id,
      level: 4,
      isLeaf: true,
      status: 'active',
      hasPM: eq.hasPM,
      calibrationPeriod: eq.calibrationPeriod,
      calibrationType: eq.calibrationType,
      authorizedPersonnel: eq.authorizedPersonnel,
    });
  });

  conveyorsStorage.forEach((eq) => {
    equipment.push({
      id: idCounter++,
      name: eq.name,
      model: eq.model,
      serialNumber: eq.serialNumber,
      pmCode: eq.pmCode,
      feCode: eq.feCode,
      manufacturer: eq.manufacturer,
      country: eq.country,
      location: eq.location,
      nodeType: 'machine',
      parentId: storageLineId,
      level: 4,
      isLeaf: true,
      status: 'active',
      hasPM: eq.hasPM,
      calibrationPeriod: eq.calibrationPeriod,
      calibrationType: eq.calibrationType,
      authorizedPersonnel: eq.authorizedPersonnel,
    });
  });

  // Lab equipment under lab unit
  LAB_EQUIPMENT.forEach((eq) => {
    equipment.push({
      id: idCounter++,
      name: eq.name,
      model: eq.model,
      serialNumber: eq.serialNumber,
      pmCode: eq.pmCode,
      feCode: eq.feCode,
      manufacturer: eq.manufacturer,
      country: eq.country,
      location: eq.location,
      nodeType: 'machine',
      parentId: labUnitId,
      level: 4,
      isLeaf: true,
      status: 'active',
      hasPM: eq.hasPM,
      pcRequired: eq.pcRequired,
      calibrationPeriod: eq.calibrationPeriod,
      calibrationType: eq.calibrationType,
      authorizedPersonnel: eq.authorizedPersonnel,
    });
  });

  return { equipment, basparIds, rootId, labUnitId };
}

// Reorganize extra equipment into Baspar structure based on code prefix
export function assignBasparParent(eq: any, basparIds: Record<number, number>, labUnitId: number): number {
  const code = eq.feCode || eq.pmCode || eq.serialNumber || '';
  const isLab = eq.location?.includes('آزمایشگاه') || eq.feCode?.startsWith('SC-');
  if (isLab) return labUnitId;
  return basparIds[getBasparFactory(code)] || basparIds[1];
}

// Generate mock maintenance logs
export function generateMockMaintenanceLogs(equipment: any[]) {
  const logs: any[] = [];
  let logId = 1;
  const startDate = new Date(2026, 2, 21);
  const today = new Date();
  const technicians = ['علی رضایی', 'محمود حسینی', 'سعید کریمی', 'رضا محمدی', 'حسین احمدی', 'تکنسین شیفت'];
  const machineEquipment = equipment.filter((e: any) => e.isLeaf);

  machineEquipment.forEach((eq: any) => {
    const weeks = Math.floor((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    for (let w = 0; w < Math.min(weeks, 20); w++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7);
      if (date > today) break;
      if (Math.random() > 0.85) continue;
      logs.push({
        id: logId++,
        equipmentId: eq.id,
        activityType: 'pm',
        title: 'سرویس هفتگی - ' + eq.name,
        description: 'بازرسی کامل، روغن‌کاری و تمیزکاری دوره‌ای',
        performedBy: technicians[Math.floor(Math.random() * technicians.length)],
        performedDate: date.toISOString().split('T')[0],
        durationMinutes: 30 + Math.floor(Math.random() * 30),
        cost: Math.floor(Math.random() * 500000),
        outcome: 'successful',
        notes: 'موردی برای گزارش نیست. تجهیز در وضعیت مطلوب است.',
        isMockData: true,
      });
    }
    if (Math.random() > 0.4) {
      const numRepairs = Math.floor(Math.random() * 3) + 1;
      for (let r = 0; r < numRepairs; r++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + Math.floor(Math.random() * (weeks * 7)));
        if (date > today) continue;
        const failureTypes = ['نشتی روغن', 'شل بودن اتصالات', 'خرابی بلبرینگ', 'مشکل الکتریکی', 'فرسایش قطعه'];
        logs.push({
          id: logId++,
          equipmentId: eq.id,
          activityType: 'repair',
          title: 'تعمیر اضطراری - ' + failureTypes[r % failureTypes.length],
          description: 'خرابی گزارش شده توسط اپراتور و رفع آن',
          performedBy: technicians[Math.floor(Math.random() * technicians.length)],
          performedDate: date.toISOString().split('T')[0],
          durationMinutes: 60 + Math.floor(Math.random() * 180),
          cost: Math.floor(Math.random() * 3000000) + 500000,
          outcome: Math.random() > 0.1 ? 'successful' : 'partial',
          notes: 'پس از تعمیر، تست عملکرد انجام و تجهیز به چرخه کار بازگشت.',
          isMockData: true,
        });
      }
    }
  });
  return logs;
}

export function buildInitialPersonnel() {
  // لیست پرسنل خالی - از ماژول پرسنل فنی استفاده می‌شود
  return [];
}

export function buildInitialSuppliers() {
  return [
    { id: 1, name: 'شرکت تجهیزات صنعتی پارس', contactPerson: 'مهندس رضوی', phone: '02188776655', category: 'قطعات مکانیکی', rating: 4.5, isActive: true },
    { id: 2, name: 'تامین قطعات الکتریک', contactPerson: 'آقای کاظمی', phone: '02144332211', category: 'قطعات الکتریکی', rating: 4.2, isActive: true },
    { id: 3, name: 'بازرگانی روغن صنعتی ایران', contactPerson: 'خانم احمدی', phone: '02155667788', category: 'روغن و روانکار', rating: 4.8, isActive: true },
    { id: 4, name: 'شرکت مهندسی دقیق', contactPerson: 'مهندس نوری', phone: '02199887766', category: 'کالیبراسیون', rating: 4.9, isActive: true },
  ];
}

export function buildInitialSpareParts() {
  return [
    { id: 1, partNumber: 'BL-6205', name: 'بلبرینگ 6205', category: 'بلبرینگ', unit: 'عدد', currentStock: 24, minStock: 10, unitCost: 450000, location: 'انبار قطعات - قفسه A1' },
    { id: 2, partNumber: 'FL-20', name: 'فیلتر هوا 20 میکرون', category: 'فیلتر', unit: 'عدد', currentStock: 8, minStock: 15, unitCost: 180000, location: 'انبار قطعات - قفسه B2' },
    { id: 3, partNumber: 'OL-ISO-VG68', name: 'روغن هیدرولیک VG68 (بشکه 20 لیتری)', category: 'روغن', unit: 'بشکه', currentStock: 12, minStock: 5, unitCost: 3500000, location: 'انبار روغن' },
    { id: 4, partNumber: 'BL-VB-A12', name: 'تسمه V-belt A12', category: 'تسمه', unit: 'عدد', currentStock: 6, minStock: 8, unitCost: 320000, location: 'انبار قطعات - قفسه C3' },
    { id: 5, partNumber: 'SN-SEAL-25', name: 'کاسه نمد 25mm', category: 'آب‌بند', unit: 'عدد', currentStock: 30, minStock: 20, unitCost: 85000, location: 'انبار قطعات - قفسه A2' },
    { id: 6, partNumber: 'SC-M10', name: 'پیچ و مهره M10 (بسته 50 عددی)', category: 'اتصالات', unit: 'بسته', currentStock: 15, minStock: 10, unitCost: 220000, location: 'انبار قطعات - قفسه D1' },
  ];
}
