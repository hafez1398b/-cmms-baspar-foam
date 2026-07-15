'use client';
import React, { useState } from 'react';
import { useAuthStore } from '@/lib/auth';
import { Lock, User as UserIcon, Eye, EyeOff, LogIn, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(username.trim(), password);
      if (!result.ok) {
        setError(result.error || 'خطا در ورود');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'radial-gradient(circle at top left, rgba(212,165,85,0.15), transparent 50%), radial-gradient(circle at bottom right, rgba(30,58,95,0.2), transparent 50%), #0a0a0b' }}>
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--gold)]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--navy)]/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] mb-4 shadow-2xl">
            <Shield size={40} className="text-[#0a0a0b]" />
          </div>
          <h1 className="text-3xl font-bold gold-text">بسپارفوم غرب</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-2">سامانه جامع مدیریت نگهداری و تعمیرات (CMMS)</p>
        </div>

        {/* Login Card */}
        <div className="card card-gold p-8 shadow-2xl">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><LogIn size={20} className="text-[var(--gold)]" /> ورود به سامانه</h2>
          <p className="text-xs text-[var(--foreground-muted)] mb-6">لطفاً نام کاربری و رمز عبور خود را وارد کنید</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label flex items-center gap-1"><UserIcon size={12} /> نام کاربری</label>
              <div className="relative">
                <UserIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  className="input !pr-10"
                  placeholder="نام کاربری"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-1"><Lock size={12} /> رمز عبور</label>
              <div className="relative">
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input !pr-10 !pl-10"
                  placeholder="رمز عبور"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[var(--danger)]/30 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full !py-3 text-base" disabled={loading}>
              {loading ? 'در حال ورود...' : <><LogIn size={18} /> ورود به سامانه</>}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 p-3 rounded-lg bg-[var(--background-secondary)] text-xs">
            <div className="font-bold mb-2 text-[var(--gold)]">حساب‌های آزمایشی:</div>
            <div className="space-y-1 text-[var(--foreground-secondary)]">
              <div className="flex justify-between"><span>مدیر کل:</span><span className="font-mono" dir="ltr">admin / admin</span></div>
              <div className="flex justify-between"><span>مدیر فنی:</span><span className="font-mono" dir="ltr">manager / manager</span></div>
              <div className="flex justify-between"><span>تکنسین:</span><span className="font-mono" dir="ltr">tech1 / 1234</span></div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-[var(--foreground-muted)]">
          نسخه ۲.۰ © بسپارفوم غرب
        </div>
      </div>
    </div>
  );
}
