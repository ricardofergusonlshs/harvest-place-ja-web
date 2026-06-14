'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import {
  fetchAdminChatMessages,
  fetchAdminChatThreads,
  sendAdminChatMessage,
  subscribeToAdminChatChanges,
  updateAdminChatStatus,
  type ChatThreadStatus,
  type SupportChatMessage,
  type SupportChatThread,
} from '@/lib/live-chat';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusClass(status: ChatThreadStatus) {
  if (status === 'open') return 'bg-[#EAF5E7] text-[#2D6741]';
  if (status === 'waiting') return 'bg-[#FFF3D9] text-[#A66A16]';
  if (status === 'resolved') return 'bg-[#EDF7FF] text-[#175CD3]';
  return 'bg-slate-100 text-slate-600';
}

export default function AdminChatPage() {
  const { user, isAdmin } = useAuth();
  const [threads, setThreads] = useState<SupportChatThread[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectedThread = useMemo(() => threads.find((thread) => thread.id === selectedId) || null, [threads, selectedId]);

  async function loadThreads(keepSelected = true) {
    setError('');
    try {
      const loaded = await fetchAdminChatThreads();
      setThreads(loaded);
      if (!keepSelected || !selectedId) setSelectedId(loaded[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load live chats.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(threadId: string) {
    if (!threadId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    setError('');
    try {
      const loaded = await fetchAdminChatMessages(threadId);
      setMessages(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load messages.');
    } finally {
      setMessagesLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    loadThreads(false);
    const cleanup = subscribeToAdminChatChanges(() => loadThreads(true), setError);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedId || !isAdmin) return;
    loadMessages(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, isAdmin]);

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedThread || sending || !reply.trim()) return;

    setSending(true);
    setError('');
    try {
      const sent = await sendAdminChatMessage(selectedThread.id, reply);
      setMessages((current) => (current.some((item) => item.id === sent.id) ? current : [...current, sent]));
      setReply('');
      await loadThreads(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reply could not be sent.');
    } finally {
      setSending(false);
    }
  }

  async function handleStatus(status: ChatThreadStatus) {
    if (!selectedThread) return;
    try {
      await updateAdminChatStatus(selectedThread.id, status);
      await loadThreads(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status could not be updated.');
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#FAF8F0] px-4 py-12 text-[#183B28]">
        <div className="mx-auto max-w-xl rounded-[28px] border border-[#D8E5D4] bg-[#FFFDF7] p-8 text-center shadow-sm">
          <h1 className="font-serif text-3xl font-black">Admin chat</h1>
          <p className="mt-3 text-[#5F6A62]">Please sign in as an admin to view customer chats.</p>
          <Link href="/auth" className="mt-6 inline-flex rounded-full bg-[#183B28] px-6 py-3 text-sm font-black text-white">Sign in</Link>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#FAF8F0] px-4 py-12 text-[#183B28]">
        <div className="mx-auto max-w-xl rounded-[28px] border border-[#D8E5D4] bg-[#FFFDF7] p-8 text-center shadow-sm">
          <h1 className="font-serif text-3xl font-black">Admin access required</h1>
          <p className="mt-3 text-[#5F6A62]">This live chat inbox is only available to admin users.</p>
          <Link href="/" className="mt-6 inline-flex rounded-full bg-[#183B28] px-6 py-3 text-sm font-black text-white">Go home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F0] px-4 py-8 text-[#183B28] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1450px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-black text-[#2D6741]">
              <ArrowLeft className="h-4 w-4" />
              Back to admin
            </Link>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-[#DFA75A]">Customer support</p>
            <h1 className="mt-2 font-serif text-4xl font-black tracking-[-0.04em] text-[#183B28] sm:text-5xl">Live chat inbox</h1>
            <p className="mt-3 max-w-2xl text-[#5F6A62]">Respond to customers from the website and Android app support flow.</p>
          </div>

          <button
            type="button"
            onClick={() => loadThreads(true)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-5 text-sm font-black text-[#183B28] shadow-sm transition hover:bg-[#EAF5E7]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {error ? <p className="mt-5 rounded-2xl border border-[#F3D3D3] bg-[#FFF2F2] px-4 py-3 text-sm font-bold text-[#B42318]">{error}</p> : null}

        <section className="mt-8 grid min-h-[680px] overflow-hidden rounded-[34px] border border-[#D8E5D4] bg-[#FFFDF7] shadow-[0_18px_50px_rgba(24,59,40,0.08)] lg:grid-cols-[390px_1fr]">
          <aside className="border-b border-[#D8E5D4] bg-white/60 lg:border-b-0 lg:border-r">
            <div className="border-b border-[#D8E5D4] px-5 py-4">
              <p className="text-sm font-black text-[#183B28]">Conversations</p>
              <p className="mt-1 text-xs font-semibold text-[#5F6A62]">{threads.length} chat thread{threads.length === 1 ? '' : 's'}</p>
            </div>

            <div className="max-h-[620px] overflow-y-auto p-3">
              {loading ? (
                <div className="grid h-40 place-items-center text-[#5F6A62]"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : threads.length ? (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedId(thread.id)}
                    className={cx(
                      'mb-2 w-full rounded-[22px] border p-4 text-left transition',
                      selectedId === thread.id ? 'border-[#2D6741] bg-[#EAF5E7]' : 'border-[#D8E5D4] bg-white hover:bg-[#FAF8F0]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#183B28]">{thread.customer_name || thread.customer_email || 'Customer'}</p>
                        <p className="mt-1 truncate text-xs font-semibold text-[#5F6A62]">{thread.last_message || 'New conversation'}</p>
                      </div>
                      <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]', statusClass(thread.status))}>{thread.status}</span>
                    </div>
                    <p className="mt-2 text-[11px] font-bold text-[#5F6A62]/70">{formatDate(thread.last_message_at)}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[#D8E5D4] bg-white p-8 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-[#2D6741]" />
                  <p className="mt-3 font-black">No chats yet</p>
                  <p className="mt-2 text-sm text-[#5F6A62]">Customer messages will appear here.</p>
                </div>
              )}
            </div>
          </aside>

          <div className="flex min-h-[680px] flex-col">
            {selectedThread ? (
              <>
                <div className="flex flex-col gap-3 border-b border-[#D8E5D4] bg-[#FFFDF7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-serif text-2xl font-black text-[#183B28]">{selectedThread.customer_name || 'Customer'}</p>
                    <p className="text-sm font-semibold text-[#5F6A62]">{selectedThread.customer_email || selectedThread.customer_id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['open', 'waiting', 'resolved', 'closed'] as ChatThreadStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatus(status)}
                        className={cx('rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition', selectedThread.status === status ? 'bg-[#183B28] text-white' : 'border border-[#D8E5D4] bg-white text-[#5F6A62] hover:bg-[#EAF5E7]')}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-[#FAF8F0] px-5 py-5">
                  {messagesLoading ? (
                    <div className="grid h-full place-items-center text-[#5F6A62]"><Loader2 className="h-7 w-7 animate-spin" /></div>
                  ) : messages.length ? (
                    messages.map((message) => {
                      const admin = message.sender_role === 'admin';
                      return (
                        <div key={message.id} className={cx('flex', admin ? 'justify-end' : 'justify-start')}>
                          <div className={cx('max-w-[78%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-sm', admin ? 'rounded-br-md bg-[#183B28] text-white' : 'rounded-bl-md border border-[#D8E5D4] bg-white text-[#183B28]')}>
                            <p>{message.body}</p>
                            <p className={cx('mt-1 text-[10px] font-bold', admin ? 'text-white/55' : 'text-[#5F6A62]/70')}>{message.sender_role} • {formatDate(message.created_at)}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid h-full place-items-center text-center">
                      <div>
                        <CheckCircle2 className="mx-auto h-12 w-12 text-[#2D6741]" />
                        <p className="mt-4 font-serif text-2xl font-black">No messages yet</p>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleReply} className="border-t border-[#D8E5D4] bg-[#FFFDF7] p-4">
                  <div className="flex items-end gap-2 rounded-[24px] border border-[#D8E5D4] bg-white p-2 shadow-sm">
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="Reply as admin..."
                      rows={2}
                      maxLength={1500}
                      className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm font-semibold text-[#183B28] outline-none placeholder:text-[#5F6A62]/55"
                    />
                    <button type="submit" disabled={sending || !reply.trim()} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#2D6741] px-5 text-sm font-black text-white transition hover:bg-[#183B28] disabled:cursor-not-allowed disabled:opacity-45">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <div>
                  <MessageCircle className="mx-auto h-12 w-12 text-[#2D6741]" />
                  <h2 className="mt-4 font-serif text-3xl font-black">Select a chat</h2>
                  <p className="mt-2 text-[#5F6A62]">Choose a customer conversation from the inbox.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
