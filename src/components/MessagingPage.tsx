'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Plus, Users, MessageSquare, Search, X, Check, CheckCheck } from 'lucide-react';
import { useMessageStore, usePersonnelStore, useTechnicalPersonnelStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth';
import { toPersianDigits, formatJalaliDateTime } from '@/lib/utils';

export default function MessagingPage() {
  const { conversations, messages, participants, setConversations, setMessages, setParticipants, addMessage } = useMessageStore();
  const { technicalPersonnel } = useTechnicalPersonnelStore();
  const authUsers = useAuthStore(s => s.users);
  const authUser = useAuthStore(s => s.currentUser);
  const CURRENT_USER = authUser ? { id: authUser.id, fullName: authUser.fullName, avatarColor: authUser.avatarColor || '#D4A555' } : { id: 1, fullName: 'مدیر سیستم', avatarColor: '#D4A555' };

  // Build contact list: ALL technical personnel + system users (no duplicates)
  const allContacts = useMemo(() => {
    const contacts: Array<{ id: number; fullName: string; jobTitle?: string; avatarColor: string }> = [];
    const addedIds = new Set<number>();

    // 1. Add ALL technical personnel (whether they have account or not)
    technicalPersonnel.forEach((tp, idx) => {
      const uniqueId = tp.accountId || (50000 + tp.id); // Use accountId if exists, otherwise generate unique
      if (uniqueId !== CURRENT_USER.id && !addedIds.has(uniqueId)) {
        contacts.push({
          id: uniqueId,
          fullName: `${tp.firstName} ${tp.lastName}`,
          jobTitle: `${tp.contractType || 'پرسنل فنی'} - NET: ${tp.codeNET}`,
          avatarColor: ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#D4A555','#ef4444','#14b8a6','#f97316'][idx % 10],
        });
        addedIds.add(uniqueId);
      }
    });

    // 2. Add system users who are NOT already in the list
    authUsers.forEach(u => {
      if (u.id !== CURRENT_USER.id && !addedIds.has(u.id)) {
        contacts.push({
          id: u.id,
          fullName: u.fullName,
          jobTitle: u.role === 'admin' ? 'مدیر کل سیستم' : u.role === 'manager' ? 'مدیر فنی' : u.role === 'technician' ? 'تکنسین' : 'کاربر',
          avatarColor: u.avatarColor || '#3b82f6',
        });
        addedIds.add(u.id);
      }
    });

    return contacts;
  }, [authUsers, technicalPersonnel, CURRENT_USER.id]);

  // Replace personnel references with allContacts
  const personnel = allContacts;
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatType, setNewChatType] = useState<'private' | 'group'>('private');
  const [newChatTitle, setNewChatTitle] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with sample conversations if empty
  useEffect(() => {
    if (conversations.length === 0 && personnel.length > 0) {
      const sampleConv = { id: 1, title: 'گروه فنی', type: 'group', createdBy: CURRENT_USER.id, lastMessageAt: new Date().toISOString() };
      setConversations([sampleConv]);
      setParticipants([
        { id: 1, conversationId: 1, userId: CURRENT_USER.id, isAdmin: true, joinedAt: new Date().toISOString() },
        ...personnel.slice(0, 3).map((p, i) => ({ id: i + 2, conversationId: 1, userId: p.id, isAdmin: false, joinedAt: new Date().toISOString() })),
      ]);
      setMessages([
        { id: 1, conversationId: 1, senderId: personnel[0]?.id || 2, content: 'سلام، گزارش تعمیر کانوایر خط یک آماده شد.', isRead: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, conversationId: 1, senderId: CURRENT_USER.id, content: 'ممنون، لطفاً به صورت سیستمی ثبت کنید.', isRead: true, createdAt: new Date(Date.now() - 1800000).toISOString() },
      ]);
    }
  }, [conversations.length, personnel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const activeMessages = messages.filter(m => m.conversationId === activeConvId);
  const activeParticipants = participants.filter(p => p.conversationId === activeConvId);

  const getUserById = (id: number) => personnel.find(p => p.id === id) || { fullName: id === CURRENT_USER.id ? 'من' : 'کاربر', avatarColor: '#D4A555' };

  const sendMessage = () => {
    if (!messageText.trim() || !activeConvId) return;
    addMessage({
      id: Date.now(),
      conversationId: activeConvId,
      senderId: CURRENT_USER.id,
      content: messageText,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    setMessageText('');
  };

  const startNewChat = () => {
    if (selectedUsers.length === 0) return;
    const newId = Date.now();
    const isGroup = newChatType === 'group';
    const conv = {
      id: newId,
      title: isGroup ? (newChatTitle || 'گروه جدید') : personnel.find(p => p.id === selectedUsers[0])?.fullName || 'چت',
      type: isGroup ? 'group' : 'private',
      createdBy: CURRENT_USER.id,
      lastMessageAt: new Date().toISOString(),
    };
    setConversations([...conversations, conv]);
    setParticipants([
      ...participants,
      { id: Date.now(), conversationId: newId, userId: CURRENT_USER.id, isAdmin: true, joinedAt: new Date().toISOString() },
      ...selectedUsers.map(uid => ({ id: Date.now() + uid, conversationId: newId, userId: uid, isAdmin: false, joinedAt: new Date().toISOString() })),
    ]);
    setShowNewChat(false);
    setSelectedUsers([]);
    setNewChatTitle('');
    setActiveConvId(newId);
  };

  const filteredPersonnel = personnel.filter(p =>
    p.fullName.includes(searchUser) && p.id !== CURRENT_USER.id
  );

  return (
    <div className="flex h-[calc(100vh-180px)] gap-4">
      {/* Conversation List */}
      <div className="w-80 flex flex-col bg-[var(--background-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="p-3 border-b border-[var(--border)]">
          <div className="flex gap-2 mb-2">
            <button className="btn btn-primary flex-1" onClick={() => setShowNewChat(true)}><Plus size={16} /> گفتگوی جدید</button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input className="input !pr-9 text-sm" placeholder="جستجو..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => {
            const convParticipants = participants.filter(p => p.conversationId === conv.id);
            const lastMsg = messages.filter(m => m.conversationId === conv.id).slice(-1)[0];
            const unread = messages.filter(m => m.conversationId === conv.id && !m.isRead && m.senderId !== CURRENT_USER.id).length;
            return (
              <div
                key={conv.id}
                className={`p-3 border-b border-[var(--border)] cursor-pointer transition-colors ${activeConvId === conv.id ? 'bg-[rgba(212,165,85,0.1)]' : 'hover:bg-[var(--background-hover)]'}`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--background-elevated)] flex items-center justify-center shrink-0">
                    {conv.type === 'group' ? <Users size={18} className="text-[var(--gold)]" /> : <MessageSquare size={18} className="text-[var(--foreground-secondary)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm truncate">{conv.title}</div>
                      {unread > 0 && <span className="bg-[var(--danger)] text-white text-[10px] px-1.5 py-0.5 rounded-full">{toPersianDigits(unread)}</span>}
                    </div>
                    {lastMsg && <div className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">{lastMsg.content}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[var(--background-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {activeConv ? (
          <>
            <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-bold">{activeConv.title}</div>
                <span className="badge badge-neutral">{activeConv.type === 'group' ? 'گروهی' : 'خصوصی'}</span>
              </div>
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {activeParticipants.slice(0, 4).map(p => {
                  const u = getUserById(p.userId);
                  return (
                    <div key={p.id} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#0a0a0b] border-2 border-[var(--background-card)]" style={{ background: (u as any).avatarColor || '#D4A555' }}>
                      {u.fullName.charAt(0)}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeMessages.map((msg, idx) => {
                const isMine = msg.senderId === CURRENT_USER.id;
                const sender = getUserById(msg.senderId);
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] ${isMine ? 'ai-message-user' : 'ai-message-assistant'} px-4 py-2 text-sm`}>
                      {!isMine && activeConv.type === 'group' && (
                        <div className="text-xs font-bold mb-1 opacity-70">{sender.fullName}</div>
                      )}
                      <div>{msg.content}</div>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                        <span>{formatJalaliDateTime(msg.createdAt)}</span>
                        {isMine && (msg.isRead ? <CheckCheck size={12} /> : <Check size={12} />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-[var(--border)]">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="پیام خود را بنویسید..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button className="btn btn-primary px-4" onClick={sendMessage}><Send size={16} /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--foreground-muted)]">
            <MessageSquare size={48} className="mb-4 opacity-30" />
            <p>یک گفتگو را انتخاب کنید یا گفتگوی جدید بسازید</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
          <div className="modal-content p-6 max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">گفتگوی جدید</h3>
              <button className="btn btn-ghost !p-2" onClick={() => setShowNewChat(false)}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  className={`btn flex-1 ${newChatType === 'private' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setNewChatType('private'); setSelectedUsers([]); setNewChatTitle(''); }}
                >چت خصوصی</button>
                <button
                  className={`btn flex-1 ${newChatType === 'group' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setNewChatType('group')}
                >گروه</button>
              </div>
              {newChatType === 'group' && (
                <div>
                  <label className="label">نام گروه</label>
                  <input className="input" value={newChatTitle} onChange={e => setNewChatTitle(e.target.value)} placeholder="مثلاً: تیم تعمیرات" />
                </div>
              )}
              <div>
                <label className="label">{newChatType === 'private' ? 'انتخاب مخاطب' : 'اعضا'}</label>
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input className="input !pr-9 text-sm" placeholder="جستجو..." value={searchUser} onChange={e => setSearchUser(e.target.value)} />
                </div>
                <div className="max-h-60 overflow-y-auto mt-2 space-y-1">
                  {filteredPersonnel.map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-[var(--background-hover)] cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedUsers.includes(p.id)}
                        disabled={newChatType === 'private' && selectedUsers.length >= 1 && !selectedUsers.includes(p.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            if (newChatType === 'private') setSelectedUsers([p.id]);
                            else setSelectedUsers([...selectedUsers, p.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(u => u !== p.id));
                          }
                        }}
                      />
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#0a0a0b]" style={{ background: p.avatarColor || '#3b82f6' }}>{p.fullName.charAt(0)}</div>
                      <span className="text-sm">{p.fullName}</span>
                      <span className="text-xs text-[var(--foreground-muted)] mr-auto">{p.jobTitle}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary w-full" onClick={startNewChat} disabled={selectedUsers.length === 0}><Check size={16} /> شروع گفتگو</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
