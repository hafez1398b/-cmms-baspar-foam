'use client';
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ error, errorInfo });
    // Also log to server if available
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cmms_last_error', JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          time: new Date().toISOString(),
        }));
      } catch {}
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
          <div className="card max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
                <AlertTriangle size={24} className="text-[var(--danger)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--danger)]">خطایی رخ داد</h2>
                <p className="text-xs text-[var(--foreground-muted)]">متأسفانه هنگام بارگذاری این بخش مشکلی پیش آمد.</p>
              </div>
            </div>

            <div className="p-3 bg-[var(--background-secondary)] rounded-lg mb-4">
              <div className="text-xs font-bold mb-1 text-[var(--danger)]">پیام خطا:</div>
              <div className="text-sm font-mono break-all">{this.state.error?.message || 'Unknown error'}</div>
            </div>

            {this.state.error?.stack && (
              <details className="mb-4">
                <summary className="cursor-pointer text-xs text-[var(--foreground-muted)] mb-2">نمایش Stack Trace</summary>
                <pre className="text-[10px] bg-black/30 p-2 rounded overflow-auto max-h-60 text-[var(--foreground-secondary)] whitespace-pre-wrap">{this.state.error.stack}</pre>
              </details>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                className="btn btn-primary"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
              >
                <RefreshCw size={14} /> تلاش مجدد
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                  } catch {}
                  window.location.href = '/';
                }}
              >
                پاک کردن کش و ورود مجدد
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => window.location.reload()}
              >
                بارگذاری مجدد صفحه
              </button>
            </div>

            <div className="mt-4 p-3 bg-[rgba(212,165,85,0.05)] border border-[var(--gold)]/30 rounded-lg text-xs text-[var(--foreground-secondary)]">
              <strong>راهنما:</strong> اگر مشکل ادامه داشت، با کلیک روی «پاک کردن کش و ورود مجدد» داده‌های محلی پاک شده و دوباره وارد شوید.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
