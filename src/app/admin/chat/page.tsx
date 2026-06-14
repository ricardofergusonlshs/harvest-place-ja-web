'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Loader2,
  MessageCircle,
  RefreshCcw,
  Send,
  User,
} from 'lucide-react';

import { useAuth } from '@/components/providers/auth-provider';
import {
  cleanOrderError,
  fetchAdminChatThreads,
  fetchThreadMessages,
  sendChatMessage,
  type SupportChatMessage,
  type SupportChatThread,
} from '@/lib/order-chat-services';

const REFRESH_MS = 4000;

export default function AdminChatPage() {
  const auth = useAuth() as {
    user: { id: string; email?: string | null } | null;
    isAdmin?: boolean;
    loading: boolean;
  };

  const [threads, setThreads] = useState<SupportChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) || null,
    [threads, selectedThreadId],
  );

  const loadThreads = useCallback(async () => {
    try {
      setNotice('');
      const rows = await fetchAdminChatThreads(50);
      setThreads(rows);

      if (!selectedThreadId && rows.length) {
        setSelectedThreadId(rows[0].id);
      }
    } catch (error) {
      setNotice(cleanOrderError(error));
    } finally {
      setLoadingThreads(false);
    }
  }, [selectedThreadId]);

  const loadMessages = useCallback(async () => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }

    try {
      setLoadingMessages(true);
      const rows = await fetchThreadMessages(selectedThreadId);
      setMessages(rows);
    } catch (error) {
      setNotice(cleanOrderError(error));
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    if (auth.loading) return;

    void loadThreads();

    const timer = window.setInterval(() => {
      void loadThreads();
    }, REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [auth.loading, loadThreads]);

  useEffect(() => {
    void loadMessages();

    const timer = window.setInterval(() => {
      void loadMessages();
    }, REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [loadMessages]);

  async function handleSend() {
    if (!selectedThreadId || !messageText.trim()) return;

    try {
      setSending(true);
      setNotice('');

      await sendChatMessage({
        threadId: selectedThreadId,
        senderId: auth.user?.id || null,
        senderRole: 'admin',
        body: messageText,
      });

      setMessageText('');
      await loadMessages();
      await loadThreads();
    } catch (error) {
      setNotice(cleanOrderError(error));
    } finally {
      setSending(false);
    }
  }

  if (auth.loading) {
    return (
      <main className="min-h-screen bg-[#FAF8F0] px-4 py-10 text-[#183B28]">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-white p-8 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="mt-3 font-black">Loading admin inbox...</p>
        </div>
      </main>
    );
  }

  if (!auth.user || !auth.isAdmin) {
    return (
      <main className="min-h-screen bg-[#FAF8F0] px-4 py-10 text-[#183B28]">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-sm">
          <Inbox className="mx-auto h-10 w-10 text-[#2D6741]" />
          <h1 className="mt-4 text-3xl font-black">Admin inbox</h1>
          <p className="mt-2 text-sm font-semibold text-[#5F6A62]">
            Please sign in with an admin account to view customer conversations.
          </p>
          <Link
            href="/auth?redirect=/admin/chat"
            className="mt-6 inline-flex rounded-full bg-[#2D6741] px-6 py-3 text-sm font-black text-white"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F0] px-4 py-6 text-[#183B28] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1450px]">
        <div className="mb-5 rounded-[2rem] bg-[#183B28] p-6 text-white shadow-[0_20px_65px_rgba(24,59,40,0.16)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#DFA75A]">
                Admin inbox
              </p>
              <h1 className="mt-2 text-4xl font-black">Customer Messages</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-white/75">
                See customer conversations, order questions, delivery updates, and support messages in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void loadThreads();
                void loadMessages();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#183B28]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {notice ? (
          <div className="mb-4 rounded-3xl border border-[#F2C772] bg-[#FFF4D8] px-5 py-4 text-sm font-black text-[#8A5A00]">
            {notice}
          </div>
        ) : null}

        <div className="grid min-h-[680px] overflow-hidden rounded-[2rem] border border-[#D8E5D4] bg-white shadow-[0_20px_65px_rgba(24,59,40,0.08)] lg:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="border-b border-[#D8E5D4] bg-[#F4F9F2] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#D8E5D4] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">Threads</h2>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#2D6741]">
                  {threads.length}
                </span>
              </div>
            </div>

            <div className="max-h-[590px] overflow-y-auto p-3">
              {loadingThreads ? (
                <div className="rounded-3xl bg-white p-5 text-sm font-black text-[#5F6A62]">
                  Loading conversations...
                </div>
              ) : null}

              {!loadingThreads && !threads.length ? (
                <div className="rounded-3xl bg-white p-5 text-sm font-black text-[#5F6A62]">
                  No customer conversations yet.
                </div>
              ) : null}

              {threads.map((thread) => {
                const active = thread.id === selectedThreadId;

                return (
                  <button
                    type="button"
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={[
                      'mb-2 w-full rounded-3xl border p-4 text-left transition',
                      active
                        ? 'border-[#2D6741] bg-white shadow-sm'
                        : 'border-transparent bg-white/70 hover:bg-white',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
                        <User className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-black">
                          {thread.customer_name || thread.customer_email || 'Customer'}
                        </span>
                        <span className="mt-1 block truncate text-xs font-bold text-[#5F6A62]">
                          {thread.subject || 'Support chat'}
                        </span>
                        <span className="mt-2 block truncate text-xs font-semibold text-[#5F6A62]">
                          {thread.last_message || 'No messages yet'}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-[680px] flex-col">
            <div className="border-b border-[#D8E5D4] p-5">
              {selectedThread ? (
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">
                      {selectedThread.customer_name || selectedThread.customer_email || 'Customer'}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-[#5F6A62]">
                      {selectedThread.customer_email || 'No email'}{' '}
                      {selectedThread.order_id ? `• Order #HPJ-${selectedThread.order_id.slice(0, 6).toUpperCase()}` : ''}
                    </p>
                  </div>

                  {selectedThread.order_id ? (
                    <Link
                      href={`/orders/${selectedThread.order_id}`}
                      className="rounded-full border border-[#D8E5D4] px-4 py-2 text-sm font-black text-[#183B28] hover:bg-[#F4F9F2]"
                    >
                      View order
                    </Link>
                  ) : null}
                </div>
              ) : (
                <h2 className="text-2xl font-black">Select a conversation</h2>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-[#FFFEFC] p-5">
              {loadingMessages ? (
                <div className="flex items-center gap-2 text-sm font-black text-[#5F6A62]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading messages...
                </div>
              ) : null}

              {!selectedThread ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <MessageCircle className="mx-auto h-12 w-12 text-[#2D6741]" />
                    <p className="mt-4 text-xl font-black">Choose a customer thread</p>
                  </div>
                </div>
              ) : null}

              {selectedThread && !loadingMessages && !messages.length ? (
                <div className="rounded-3xl border border-dashed border-[#D8E5D4] bg-white p-6 text-center text-sm font-black text-[#5F6A62]">
                  No messages yet. Send the first reply.
                </div>
              ) : null}

              <div className="grid gap-3">
                {messages.map((message) => {
                  const admin = message.sender_role === 'admin';

                  return (
                    <div
                      key={message.id}
                      className={`flex ${admin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={[
                          'max-w-[78%] rounded-3xl px-5 py-3 text-sm font-semibold leading-6',
                          admin
                            ? 'bg-[#2D6741] text-white'
                            : 'border border-[#D8E5D4] bg-white text-[#183B28]',
                        ].join(' ')}
                      >
                        <p>{message.body}</p>
                        <p className={admin ? 'mt-2 text-[10px] text-white/65' : 'mt-2 text-[10px] text-[#5F6A62]'}>
                          {message.created_at ? new Date(message.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#D8E5D4] bg-white p-4">
              <div className="flex gap-3">
                <textarea
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Type a reply to the customer..."
                  className="min-h-14 flex-1 resize-none rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] px-5 py-4 text-sm font-bold outline-none focus:border-[#2D6741]"
                  disabled={!selectedThread || sending}
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!selectedThread || !messageText.trim() || sending}
                  className="inline-flex min-w-28 items-center justify-center gap-2 rounded-3xl bg-[#2D6741] px-5 py-3 text-sm font-black text-white transition hover:bg-[#183B28] disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
