'use client';
import { useEffect } from 'react';
import {
  useEquipmentStore, useLogStore, usePMStore, useWOStore, useMRStore,
  usePersonnelStore, useSupplierStore, useSparePartStore, useCAStore,
  useEquipmentPassportStore, useNotificationStore, useMessageStore,
  useTechnicalPersonnelStore
} from '@/lib/store';
import { useAuthStore } from '@/lib/auth';

const STORAGE_KEY = 'cmms_baspar_foam_gharb_v2';

// Save all stores to localStorage
export function saveAllToLocalStorage() {
  try {
    const data = {
      version: '2.0',
      savedAt: new Date().toISOString(),
      equipment: useEquipmentStore.getState().equipment,
      logs: useLogStore.getState().logs,
      pmPlans: usePMStore.getState().pmPlans,
      workOrders: useWOStore.getState().workOrders,
      woConsultations: useWOStore.getState().consultations,
      requests: useMRStore.getState().requests,
      personnel: usePersonnelStore.getState().personnel,
      attendance: usePersonnelStore.getState().attendance,
      leaves: usePersonnelStore.getState().leaves,
      suppliers: useSupplierStore.getState().suppliers,
      spareParts: useSparePartStore.getState().spareParts,
      correctiveActions: useCAStore.getState().actions,
      passportParts: useEquipmentPassportStore.getState().parts,
      passportPMOps: useEquipmentPassportStore.getState().pmOperations,
      passportRecords: useEquipmentPassportStore.getState().maintenanceRecords,
      passportPMPlans: useEquipmentPassportStore.getState().pmPlansFull,
      calibrations: useEquipmentPassportStore.getState().calibrations,
      notifications: useNotificationStore.getState().notifications,
      channelConfig: useNotificationStore.getState().channelConfig,
      messages: useMessageStore.getState().messages,
      conversations: useMessageStore.getState().conversations,
      participants: useMessageStore.getState().participants,
      technicalPersonnel: useTechnicalPersonnelStore.getState().technicalPersonnel,
      users: useAuthStore.getState().users,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
    return false;
  }
}

// Load all stores from localStorage
export function loadAllFromLocalStorage(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);

    if (data.equipment?.length) useEquipmentStore.getState().setEquipment(data.equipment);
    if (data.logs?.length) useLogStore.getState().setLogs(data.logs);
    if (data.pmPlans?.length) usePMStore.getState().setPMPlans(data.pmPlans);
    if (data.workOrders?.length) useWOStore.getState().setWorkOrders(data.workOrders);
    if (data.requests?.length) useMRStore.getState().setRequests(data.requests);
    if (data.personnel?.length) usePersonnelStore.getState().setPersonnel(data.personnel);
    if (data.attendance?.length) usePersonnelStore.getState().setAttendance(data.attendance);
    if (data.leaves?.length) usePersonnelStore.getState().setLeaves(data.leaves);
    if (data.suppliers?.length) useSupplierStore.getState().setSuppliers(data.suppliers);
    if (data.spareParts?.length) useSparePartStore.getState().setSpareParts(data.spareParts);
    if (data.correctiveActions?.length) useCAStore.getState().setActions(data.correctiveActions);
    if (data.notifications?.length) useNotificationStore.getState().setNotifications(data.notifications);
    if (data.channelConfig) useNotificationStore.getState().updateChannelConfig(data.channelConfig);
    if (data.messages?.length) useMessageStore.getState().setMessages(data.messages);
    if (data.conversations?.length) useMessageStore.getState().setConversations(data.conversations);
    if (data.participants?.length) useMessageStore.getState().setParticipants(data.participants);
    if (data.technicalPersonnel?.length) useTechnicalPersonnelStore.getState().setTechnicalPersonnel(data.technicalPersonnel);
    if (data.users?.length) useAuthStore.setState({ users: data.users });

    // Passport data
    if (data.passportParts?.length || data.passportPMOps?.length || data.passportRecords?.length || data.passportPMPlans?.length || data.calibrations?.length) {
      useEquipmentPassportStore.setState({
        parts: data.passportParts || [],
        pmOperations: data.passportPMOps || [],
        maintenanceRecords: data.passportRecords || [],
        pmPlansFull: data.passportPMPlans || [],
        calibrations: data.calibrations || [],
      });
    }

    return true;
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    return false;
  }
}

// Auto-save hook - saves every 5 seconds if data changed
export function useAutoSave() {
  useEffect(() => {
    const interval = setInterval(() => {
      saveAllToLocalStorage();
    }, 5000);
    return () => clearInterval(interval);
  }, []);
}

// Legacy compatibility - old useStorageSync
export function useStorageSync() {
  useAutoSave();
}

// Legacy compatibility - load individual stores
export function loadEquipmentFromStorage(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data.equipment || [];
  } catch { return []; }
}

export function loadLogsFromStorage(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data.logs || [];
  } catch { return []; }
}

export function loadPMPlansFromStorage(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data.pmPlans || [];
  } catch { return []; }
}

// Check if localStorage has data
export function hasLocalStorageData(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

// Clear localStorage
export function clearLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Also clear per-equipment docs
    const keys = Object.keys(localStorage).filter(k => k.startsWith('cmms_docs_'));
    keys.forEach(k => localStorage.removeItem(k));
  } catch {}
}

// Get storage info
export function getStorageInfo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { exists: false, size: 0, savedAt: null };
    const data = JSON.parse(raw);
    return {
      exists: true,
      size: new Blob([raw]).size,
      savedAt: data.savedAt || null,
      equipmentCount: data.equipment?.length || 0,
      logsCount: data.logs?.length || 0,
    };
  } catch {
    return { exists: false, size: 0, savedAt: null };
  }
}
