'use client';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '@/lib/store';

export default function Notification({ notification, onClose }: { notification: any; onClose: () => void }) {
  const icons: any = {
    success: <CheckCircle size={20} className="text-[var(--success)]" />,
    error: <XCircle size={20} className="text-[var(--danger)]" />,
    warning: <AlertTriangle size={20} className="text-[var(--warning)]" />,
    info: <Info size={20} className="text-[var(--info)]" />,
  };
  const bgColors: any = {
    success: 'border-[var(--success)]/30 bg-[var(--success)]/10',
    error: 'border-[var(--danger)]/30 bg-[var(--danger)]/10',
    warning: 'border-[var(--warning)]/30 bg-[var(--warning)]/10',
    info: 'border-[var(--info)]/30 bg-[var(--info)]/10',
  };

  return (
    <div className="fixed top-6 left-6 z-[200] fade-in no-print">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColors[notification.type]} shadow-lg min-w-[300px] max-w-[500px]`}>
        {icons[notification.type]}
        <span className="text-sm flex-1">{notification.message}</span>
        <button onClick={onClose} className="btn btn-ghost !p-1"><X size={14} /></button>
      </div>
    </div>
  );
}
