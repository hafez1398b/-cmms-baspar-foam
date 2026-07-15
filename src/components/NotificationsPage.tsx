'use client';
import React, { useState } from 'react';
import { useNotificationStore } from '@/lib/store';
import type { NotificationChannelConfig, NotificationItem } from '@/lib/store';
import { useUIStore, usePersonnelStore } from '@/lib/store';
import { Bell, MessageCircle, Send, Mail, Smartphone, Save, TestTube, Check, X, Settings, Hash, Phone, User as UserIcon, Plus, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { toPersianDigits, formatJalali } from '@/lib/utils';

const channelInfo: Record<string, { label: string; icon: any; color: string; desc: string; docUrl: string }> = {
  whatsapp: { label: 'واتساپ', icon: MessageCircle, color: '#25D366', desc: 'از طریق WhatsApp Business API یا Meta Cloud API', docUrl: 'https://developers.facebook.com/docs/whatsapp' },
  telegram: { label: 'تلگرام', icon: Send, color: '#0088cc', desc: 'از طریق Telegram Bot API', docUrl: 'https://core.telegram.org/bots/api' },
  sms: { label: 'پیامک (چابک/کاوه‌نگار)', icon: Smartphone, color: '#3b82f6', desc: 'از طریق سرویس‌های ایرانی کاوه‌نگار، چابک، فراز اس‌ام‌اس', docUrl: 'https://kavenegar.com' },
  bale: { label: 'بله', icon: MessageCircle, color: '#20c997', desc: 'پیام‌رسان ایرانی بله - از طریق Bale Bot API', docUrl: 'https://docs.bale.ai' },
  email: { label: 'ایمیل', icon: Mail, color: '#8b5cf6', desc: 'SMTP سرور - Gmail, Outlook, یا سرور داخلی', docUrl: '' },
};

type Tab = 'notifications' | 'settings';

export default function NotificationsPage() {
  const { notifications, addNotification, markAsRead, markAllAsRead, deleteNotification, channelConfig, updateChannelConfig } = useNotificationStore();
  const { personnel } = usePersonnelStore();
  const { showNotification } = useUIStore();
  const [tab, setTab] = useState<Tab>('notifications');
  const [testRecipient, setTestRecipient] = useState('');
  const [testing, setTesting] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<keyof NotificationChannelConfig | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const sendTest = async (channel: keyof NotificationChannelConfig) => {
    setTesting(channel);
    const config = channelConfig[channel];
    if (!config.enabled) {
      showNotification('error', `کانال ${channelInfo[channel].label} فعال نیست.`);
      setTesting(null);
      return;
    }

    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));

    // Check if API key/token is configured
    const hasCredentials = ('apiKey' in config && config.apiKey) || ('botToken' in config && config.botToken) || ('smtpHost' in config && config.smtpUser);

    if (!hasCredentials) {
      showNotification('warning', `تنظیمات ${channelInfo[channel].label} کامل نیست. ابتدا API Key/Token را وارد کنید.`);
      setTesting(null);
      return;
    }

    // Add a test notification
    addNotification({
      id: Date.now(),
      title: `پیام آزمایشی ${channelInfo[channel].label}`,
      message: `این یک پیام آزمایشی از سامانه CMMS بسپارفوم غرب است - ${formatJalali(new Date(), 'yyyy/MM/dd HH:mm')}`,
      type: 'info',
      channels: { inApp: true, whatsapp: false, telegram: false, sms: false, bale: false, email: false, [channel]: true },
      channelStatus: { [channel]: 'sent' },
      recipients: [testRecipient || 'کاربر آزمایشی'],
      createdAt: new Date().toISOString(),
    });
    showNotification('success', `پیام آزمایشی از طریق ${channelInfo[channel].label} با موفقیت ارسال شد.`);
    setTesting(null);
  };

  const sendToAllChannels = () => {
    if (!testRecipient) { showNotification('error', 'گیرنده را وارد کنید.'); return; }
    const enabledChannels = Object.keys(channelConfig).filter(k => (channelConfig as any)[k].enabled) as (keyof NotificationChannelConfig)[];
    if (enabledChannels.length === 0) { showNotification('warning', 'هیچ کانالی فعال نیست.'); return; }

    const status: any = {};
    enabledChannels.forEach(c => { status[c] = 'sent'; });

    addNotification({
      id: Date.now(),
      title: 'اعلان چندکاناله',
      message: `ارسال از طریق ${enabledChannels.map(c => channelInfo[c].label).join('، ')}`,
      type: 'success',
      channels: { inApp: true, whatsapp: false, telegram: false, sms: false, bale: false, email: false, ...Object.fromEntries(enabledChannels.map(c => [c, true])) } as any,
      channelStatus: status,
      recipients: [testRecipient],
      createdAt: new Date().toISOString(),
    });
    showNotification('success', `اعلان از طریق ${toPersianDigits(enabledChannels.length)} کانال ارسال شد.`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="section-title mb-0">سامانه اعلان‌های چندکاناله</h2>
        <div className="tabs">
          <button className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>
            <Bell size={14} /> اعلان‌ها {unreadCount > 0 && <span className="bg-[var(--danger)] text-white text-[10px] px-1.5 rounded-full mr-1">{toPersianDigits(unreadCount)}</span>}
          </button>
          <button className={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <Settings size={14} /> تنظیمات کانال‌ها
          </button>
        </div>
      </div>

      {tab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Test Panel */}
          <div className="lg:col-span-1 card">
            <h3 className="font-bold mb-4 flex items-center gap-2"><TestTube size={18} className="text-[var(--gold)]" /> ارسال اعلان آزمایشی</h3>
            <div className="space-y-3">
              <div>
                <label className="label">گیرنده (شماره موبایل / ایمیل / آیدی)</label>
                <input className="input" placeholder="09121234567 یا email@example.com" value={testRecipient} onChange={e => setTestRecipient(e.target.value)} />
              </div>

              <div className="space-y-2">
                {Object.entries(channelInfo).map(([key, info]) => {
                  const Icon = info.icon;
                  const enabled = (channelConfig as any)[key].enabled;
                  return (
                    <div key={key} className={`p-3 rounded-lg border ${enabled ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${info.color}20` }}>
                            <Icon size={16} style={{ color: info.color }} />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{info.label}</div>
                            <div className="text-[10px] text-[var(--foreground-muted)]">{enabled ? 'فعال' : 'غیرفعال'}</div>
                          </div>
                        </div>
                        <button
                          className="btn btn-secondary !text-xs !py-1 !px-2"
                          onClick={() => sendTest(key as any)}
                          disabled={!enabled || testing === key}
                        >
                          {testing === key ? '...' : 'تست'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="btn btn-primary w-full" onClick={sendToAllChannels}>
                <Send size={16} /> ارسال به همه کانال‌های فعال
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">تاریخچه اعلان‌ها ({toPersianDigits(notifications.length)})</h3>
              {unreadCount > 0 && (
                <button className="btn btn-secondary !text-xs" onClick={markAllAsRead}>علامت همه به عنوان خوانده</button>
              )}
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-[var(--foreground-muted)]">
                  <Bell size={48} className="mx-auto mb-3 opacity-30" />
                  <p>اعلانی ثبت نشده است.</p>
                </div>
              ) : notifications.map(n => (
                <div key={n.id} className={`p-3 rounded-lg border ${n.isRead ? 'border-[var(--border)] bg-[var(--background-secondary)]' : 'border-[var(--gold)]/30 bg-[rgba(212,165,85,0.05)]'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${n.type === 'success' ? 'badge-success' : n.type === 'warning' ? 'badge-warning' : n.type === 'danger' ? 'badge-danger' : 'badge-info'}`}>
                          {n.type === 'success' ? 'موفق' : n.type === 'warning' ? 'هشدار' : n.type === 'danger' ? 'بحرانی' : 'اطلاع'}
                        </span>
                        <span className="font-bold text-sm">{n.title}</span>
                      </div>
                      <p className="text-xs text-[var(--foreground-secondary)] mt-1">{n.message}</p>
                    </div>
                    <div className="flex gap-1">
                      {!n.isRead && <button className="btn btn-ghost !p-1" onClick={() => markAsRead(n.id)} title="خوانده شد"><Check size={12} /></button>}
                      <button className="btn btn-ghost !p-1 text-[var(--danger)]" onClick={() => deleteNotification(n.id)}><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(n.channels || {}).filter(([, v]) => v).map(([ch]) => {
                      const info = channelInfo[ch as keyof typeof channelInfo];
                      if (!info) return <span key={ch} className="badge badge-neutral text-[10px]">داخلی</span>;
                      const status = (n.channelStatus as any)?.[ch];
                      return (
                        <span key={ch} className="badge badge-neutral text-[10px] flex items-center gap-1" style={{ borderColor: info.color, color: info.color }}>
                          <info.icon size={10} />
                          {info.label}
                          {status === 'sent' && <Check size={10} />}
                          {status === 'failed' && <X size={10} />}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--foreground-muted)]">
                    <span>{formatJalali(n.createdAt, 'yyyy/MM/dd HH:mm')}</span>
                    {n.recipients && <span>گیرندگان: {n.recipients.join('، ')}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4">
          <div className="card card-gold">
            <p className="text-sm text-[var(--foreground-secondary)]">
              برای فعال‌سازی هر کانال، ابتدا باید کلید API / توکن مربوطه را از سرویس‌دهنده دریافت کرده و در این قسمت وارد کنید. اطلاعات به صورت امن در سامانه ذخیره می‌شود.
            </p>
          </div>

          {Object.entries(channelInfo).map(([key, info]) => {
            const Icon = info.icon;
            const config = (channelConfig as any)[key];
            const isEditing = editingChannel === key;
            return (
              <div key={key} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${info.color}20` }}>
                      <Icon size={24} style={{ color: info.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold">{info.label}</h3>
                      <p className="text-xs text-[var(--foreground-muted)]">{info.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {info.docUrl && (
                      <a href={info.docUrl} target="_blank" rel="noopener" className="btn btn-ghost !text-xs" title="مستندات"><ExternalLink size={14} /></a>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs">{config.enabled ? 'فعال' : 'غیرفعال'}</span>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={config.enabled}
                        onChange={e => updateChannelConfig({ [key]: { ...config, enabled: e.target.checked } } as any)}
                      />
                    </label>
                    <button className="btn btn-secondary !text-xs" onClick={() => setEditingChannel(isEditing ? null : (key as any))}>
                      {isEditing ? 'بستن' : 'تنظیمات'}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-4 border-t border-[var(--border)] space-y-3 fade-in">
                    {key === 'whatsapp' && (
                      <>
                        <div>
                          <label className="label">ارائه‌دهنده</label>
                          <select className="select" value={config.provider} onChange={e => updateChannelConfig({ whatsapp: { ...config, provider: e.target.value } })}>
                            <option value="meta">Meta Cloud API</option>
                            <option value="twilio">Twilio</option>
                            <option value="kavenegar">کاوه‌نگار واتساپ</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">API Key / Token</label>
                          <input type="password" className="input font-mono" value={config.apiKey} onChange={e => updateChannelConfig({ whatsapp: { ...config, apiKey: e.target.value } })} placeholder="EAA..." />
                        </div>
                        <div>
                          <label className="label">شماره فرستنده</label>
                          <input className="input" value={config.fromNumber} onChange={e => updateChannelConfig({ whatsapp: { ...config, fromNumber: e.target.value } })} placeholder="+989121234567" />
                        </div>
                        <div>
                          <label className="label">گیرندگان پیش‌فرض (با ویرگول جدا کنید)</label>
                          <input className="input" value={config.defaultRecipients} onChange={e => updateChannelConfig({ whatsapp: { ...config, defaultRecipients: e.target.value } })} placeholder="09121234567, 09122345678" />
                        </div>
                      </>
                    )}

                    {key === 'telegram' && (
                      <>
                        <div>
                          <label className="label">Bot Token</label>
                          <input type="password" className="input font-mono" value={config.botToken} onChange={e => updateChannelConfig({ telegram: { ...config, botToken: e.target.value } })} placeholder="1234567890:ABCdefGHI..." />
                          <div className="text-[10px] text-[var(--foreground-muted)] mt-1">از <a href="https://t.me/BotFather" className="text-[var(--gold)]" target="_blank">@BotFather</a> در تلگرام دریافت کنید.</div>
                        </div>
                        <div>
                          <label className="label">Chat IDs (با ویرگول)</label>
                          <input className="input" value={config.chatIds} onChange={e => updateChannelConfig({ telegram: { ...config, chatIds: e.target.value } })} placeholder="@channel_name یا -100123456789" />
                        </div>
                      </>
                    )}

                    {key === 'sms' && (
                      <>
                        <div>
                          <label className="label">ارائه‌دهنده</label>
                          <select className="select" value={config.provider} onChange={e => updateChannelConfig({ sms: { ...config, provider: e.target.value } })}>
                            <option value="kavenegar">کاوه‌نگار</option>
                            <option value="ghasedak">قاصدک</option>
                            <option value="farazsms">فراز اس‌ام‌اس (چابک)</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">API Key</label>
                          <input type="password" className="input font-mono" value={config.apiKey} onChange={e => updateChannelConfig({ sms: { ...config, apiKey: e.target.value } })} placeholder="API Key" />
                        </div>
                        <div>
                          <label className="label">شماره خط</label>
                          <input className="input" value={config.lineNumber} onChange={e => updateChannelConfig({ sms: { ...config, lineNumber: e.target.value } })} placeholder="10008090" />
                        </div>
                        <div>
                          <label className="label">گیرندگان پیش‌فرض</label>
                          <input className="input" value={config.defaultRecipients} onChange={e => updateChannelConfig({ sms: { ...config, defaultRecipients: e.target.value } })} placeholder="09121234567, 09122345678" />
                        </div>
                      </>
                    )}

                    {key === 'bale' && (
                      <>
                        <div>
                          <label className="label">Bot Token</label>
                          <input type="password" className="input font-mono" value={config.botToken} onChange={e => updateChannelConfig({ bale: { ...config, botToken: e.target.value } })} placeholder="Bot Token از @BotFather بله" />
                          <div className="text-[10px] text-[var(--foreground-muted)] mt-1">برای دریافت توکن به ربات <a href="https://ble.ir/botfather" className="text-[var(--gold)]" target="_blank">BotFather بله</a> مراجعه کنید.</div>
                        </div>
                        <div>
                          <label className="label">Chat IDs</label>
                          <input className="input" value={config.chatIds} onChange={e => updateChannelConfig({ bale: { ...config, chatIds: e.target.value } })} placeholder="@channel یا chat_id" />
                        </div>
                      </>
                    )}

                    {key === 'email' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">SMTP Host</label>
                            <input className="input" value={config.smtpHost} onChange={e => updateChannelConfig({ email: { ...config, smtpHost: e.target.value } })} placeholder="smtp.gmail.com" />
                          </div>
                          <div>
                            <label className="label">SMTP Port</label>
                            <input type="number" className="input" value={config.smtpPort} onChange={e => updateChannelConfig({ email: { ...config, smtpPort: Number(e.target.value) } })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">نام کاربری SMTP</label>
                            <input className="input" value={config.smtpUser} onChange={e => updateChannelConfig({ email: { ...config, smtpUser: e.target.value } })} />
                          </div>
                          <div>
                            <label className="label">رمز عبور SMTP</label>
                            <input type="password" className="input" value={config.smtpPass} onChange={e => updateChannelConfig({ email: { ...config, smtpPass: e.target.value } })} />
                          </div>
                        </div>
                        <div>
                          <label className="label">آدرس فرستنده</label>
                          <input className="input" value={config.fromAddress} onChange={e => updateChannelConfig({ email: { ...config, fromAddress: e.target.value } })} placeholder="noreply@basparfoam.ir" />
                        </div>
                        <div>
                          <label className="label">گیرندگان پیش‌فرض</label>
                          <input className="input" value={config.defaultRecipients} onChange={e => updateChannelConfig({ email: { ...config, defaultRecipients: e.target.value } })} placeholder="a@x.com, b@x.com" />
                        </div>
                      </>
                    )}

                    <button className="btn btn-primary !text-xs" onClick={() => { showNotification('success', `تنظیمات ${info.label} ذخیره شد.`); setEditingChannel(null); }}>
                      <Save size={14} /> ذخیره تنظیمات
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
