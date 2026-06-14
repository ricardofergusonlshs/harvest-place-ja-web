'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import {
  fetchMyChatMessages,
  getOrCreateMyChatThread,
  sendCustomerChatMessage,
  subscribeToThreadMessages,
  type SupportChatMessage,
  type SupportChatThread,
} from '@/lib/live-chat';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function shortTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  } catch {
    return '';
  }
}

export default function LiveChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<SupportChatThread | null>(null);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!open || !user) return;

    let mounted = true;
    let cleanup: (() => void) | undefined;

    async function startChat() {
      setLoading(true);
      setError('');
      try {
        const activeThread = await getOrCreateMyChatThread();
        if (!mounted) return;
        setThread(activeThread);

        const loadedMessages = await fetchMyChatMessages(activeThread.id);
        if (!mounted) return;
        setMessages(loadedMessages);

        cleanup = subscribeToThreadMessages(
          activeThread.id,
          (message: SupportChatMessage) => {
            setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
          },
          setError
        );
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Live chat failed to load.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    startChat();

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, [messages, open]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!thread || sending) return;

    const value = text.trim();
    if (!value) return;

    setSending(true);
    setError('');
    try {
      const sent = await sendCustomerChatMessage(thread.id, value);
      setMessages((current) => (current.some((item) => item.id === sent.id) ? current : [...current, sent]));
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  }

  const subtitle = useMemo(() => {
    if (!user) return 'Sign in to chat with admin';
    if (loading) return 'Connecting to admin support...';
    return 'Usually replies as soon as possible';
  }, [loading, user]);

  return (
    <div className="fixed bottom-24 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open ? (
        <div className="mb-4 flex h-[min(620px,calc(100vh-120px))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-[28px] border border-[#D8E5D4] bg-[#FFFDF7] shadow-[0_24px_70px_rgba(24,59,40,0.24)]">
          <div className="flex items-center justify-between border-b border-[#D8E5D4] bg-[#183B28] px-5 py-4 text-white">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#DFA75A]" />
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#DFA75A]">Live support</p>
              </div>
              <h2 className="mt-1 font-serif text-2xl font-black">Chat with admin</h2>
              <p className="mt-1 text-xs font-semibold text-white/70">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close live chat"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
                <MessageCircle className="h-7 w-7" />
              </div>
              <h3 className="mt-5 font-serif text-2xl font-black text-[#183B28]">Sign in to start chat</h3>
              <p className="mt-3 text-sm leading-6 text-[#5F6A62]">Customers can speak with the admin team after signing in.</p>
              <Link
                href="/auth"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#183B28] px-6 text-sm font-black text-white shadow-sm transition hover:bg-[#2D6741]"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[#FAF8F0] px-4 py-4">
                {loading ? (
                  <div className="grid h-full place-items-center text-[#5F6A62]">
                    <Loader2 className="h-7 w-7 animate-spin" />
                  </div>
                ) : hasMessages ? (
                  messages.map((message) => {
                    const fromCustomer = message.sender_role === 'customer';
                    return (
                      <div key={message.id} className={cx('flex', fromCustomer ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cx(
                            'max-w-[82%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm',
                            fromCustomer ? 'rounded-br-md bg-[#183B28] text-white' : 'rounded-bl-md border border-[#D8E5D4] bg-white text-[#183B28]'
                          )}
                        >
                          <p>{message.body}</p>
                          <p className={cx('mt-1 text-[10px] font-bold', fromCustomer ? 'text-white/55' : 'text-[#5F6A62]/70')}>{shortTime(message.created_at)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="grid h-full place-items-center text-center">
                    <div>
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 font-serif text-xl font-black text-[#183B28]">Start a conversation</h3>
                      <p className="mt-2 max-w-[260px] text-sm leading-6 text-[#5F6A62]">Ask about orders, produce availability, delivery, or your weekly box.</p>
                    </div>
                  </div>
                )}
              </div>

              {error ? <p className="border-t border-[#F3D3D3] bg-[#FFF2F2] px-4 py-2 text-xs font-bold text-[#B42318]">{error}</p> : null}

              <form onSubmit={handleSend} className="border-t border-[#D8E5D4] bg-[#FFFDF7] p-3">
                <div className="flex items-end gap-2 rounded-[22px] border border-[#D8E5D4] bg-white p-2 shadow-sm">
                  <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Type your message..."
                    rows={1}
                    maxLength={1500}
                    className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm font-semibold text-[#183B28] outline-none placeholder:text-[#5F6A62]/55"
                  />
                  <button
                    type="submit"
                    disabled={!thread || sending || !text.trim()}
                    className="grid h-11 w-11 place-items-center rounded-full bg-[#2D6741] text-white transition hover:bg-[#183B28] disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label="Send message"
                  >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#183B28] text-white shadow-[0_18px_45px_rgba(24,59,40,0.35)] transition hover:-translate-y-0.5 hover:bg-[#2D6741]"
        aria-label="Open live chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
