'use client';
import { create } from 'zustand';

export interface UserAccount {
  id: number;
  username: string;
  password: string; // In real app, this would be hashed
  fullName: string;
  role: 'admin' | 'manager' | 'technician' | 'viewer';
  department?: string;
  personnelId?: number; // link to personnel record
  isActive: boolean;
  avatarColor?: string;
  createdAt: string;
  lastLogin?: string;
}

interface AuthState {
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  addUser: (u: UserAccount) => void;
  updateUser: (id: number, data: Partial<UserAccount>) => void;
  deleteUser: (id: number) => void;
  changePassword: (userId: number, newPassword: string) => void;
}

const DEFAULT_USERS: UserAccount[] = [
  { id: 1, username: 'admin', password: 'admin', fullName: 'مدیر سیستم', role: 'admin', department: 'مدیریت', isActive: true, avatarColor: '#D4A555', createdAt: new Date().toISOString() },
  { id: 2, username: 'manager', password: 'manager', fullName: 'محمد موسوی', role: 'manager', department: 'مدیریت فنی', personnelId: 6, isActive: true, avatarColor: '#3B82F6', createdAt: new Date().toISOString() },
  { id: 3, username: 'tech1', password: '1234', fullName: 'علی رضایی', role: 'technician', department: 'تعمیرات', personnelId: 1, isActive: true, avatarColor: '#10B981', createdAt: new Date().toISOString() },
  { id: 4, username: 'tech2', password: '1234', fullName: 'محمود حسینی', role: 'technician', department: 'تعمیرات', personnelId: 2, isActive: true, avatarColor: '#F59E0B', createdAt: new Date().toISOString() },
];

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  users: DEFAULT_USERS,

  login: (username, password) => {
    const user = get().users.find(u => u.username === username && u.password === password && u.isActive);
    if (!user) {
      return { ok: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
    }
    set({
      currentUser: { ...user, lastLogin: new Date().toISOString() },
      users: get().users.map(u => u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u),
    });
    return { ok: true };
  },

  logout: () => set({ currentUser: null }),

  addUser: (u) => set((s) => ({ users: [...s.users, u] })),

  updateUser: (id, data) => set((s) => ({
    users: s.users.map(u => u.id === id ? { ...u, ...data } : u),
    currentUser: s.currentUser && s.currentUser.id === id ? { ...s.currentUser, ...data } : s.currentUser,
  })),

  deleteUser: (id) => set((s) => ({
    users: s.users.filter(u => u.id !== id),
    currentUser: s.currentUser?.id === id ? null : s.currentUser,
  })),

  changePassword: (userId, newPassword) => set((s) => ({
    users: s.users.map(u => u.id === userId ? { ...u, password: newPassword } : u),
  })),
}));

export const roleLabels: Record<string, string> = {
  admin: 'مدیر کل سیستم',
  manager: 'مدیر فنی',
  technician: 'تکنسین',
  viewer: 'مشاهده‌گر',
};
