'use client';

import Link from 'next/link';
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  Minimize2,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

import { useAuth } from '@/components/providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  fetchMyChatMessages,
  getOrCreateMyChatThread,
  sendCustomerChatMessage,
  subscribeToThreadMessages,
  type SupportChatMessage,
  type SupportChatThread,
} from '@/lib/live-chat';

const MAX_MESSAGE_LENGTH = 1500;

const quickReplies = [
  'I need help with my order.',
  'Is this item available?',
  'I want to ask about delivery.',
  'I need help with my weekly box.',
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function shortTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

function containsOffPlatformContact(message: string) {
  const text = message.toLowerCase();
  const phonePattern = /(\+?\d[\d\s().-]{6,}\d)/;
  const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const linkPattern =
    /(https?:\/\/|www\.|\.com|\.net|\.org|\.co|wa\.me|whatsapp|instagram|facebook|tiktok|telegram)/i;
  const socialHandlePattern = /(^|\s)@[a-z0-9._-]{3,}/i;
  const blockedPhrases = [
    'call me',
    'text me',
    'whatsapp me',
    'send your number',
    'my number',
    'outside the app',
    'outside the website',
    'contact me directly',
    'message me directly',
    'dm me',
  ];

  return (
    phonePattern.test(text) ||
    emailPattern.test(text) ||
    linkPattern.test(text) ||
    socialHandlePattern.test(text) ||
    blockedPhrases.some((phrase) => text.includes(phrase))
  );
}

function sortMessages(messages: SupportChatMessage[]) {
  return [...messages].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();

    return aTime - bTime;
  });
}

export default function LiveChatWidget() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [thread, setThread] = useState<SupportChatThread | null>(null);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [safetyWarning, setSafetyWarning] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionMissing, setSessionMissing] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const hasMessages = messages.length > 0;
  const remainingCharacters = MAX_MESSAGE_LENGTH - text.length;
  const isNearLimit = remainingCharacters <= 120;
  const shouldBlockMessage = containsOffPlatformContact(text);

  const sortedMessages = useMemo(() => sortMessages(messages), [messages]);

  const lastAdminMessage = useMemo(() => {
    return [...messages].reverse().find((message) => message.sender_role !== 'customer') || null;
  }, [messages]);

  useEffect(() => {
    if (!open) return;

    setUnreadCount(0);
    setMinimized(false);
  }, [open]);

  useEffect(() => {
    if (!open || !user) return;

    let mounted = true;
    let cleanup: (() => void) | undefined;

    async function startChat() {
      setLoading(true);
      setError('');
      setSafetyWarning('');
      setSessionMissing(false);

      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!data.session) {
          setThread(null);
          setMessages([]);
          setSessionMissing(true);
          setError('Your sign-in session has expired. Please sign in again to use live chat.');
          return;
        }

        const activeThread = await getOrCreateMyChatThread();

        if (!mounted) return;

        setThread(activeThread);

        const loadedMessages = await fetchMyChatMessages(activeThread.id);

        if (!mounted) return;

        setMessages(sortMessages(loadedMessages));

        cleanup = subscribeToThreadMessages(
          activeThread.id,
          (message: SupportChatMessage) => {
            setMessages((current) => {
              if (current.some((item) => item.id === message.id)) return current;

              if (!open && message.sender_role !== 'customer') {
                setUnreadCount((count) => Math.min(99, count + 1));
              }

              return sortMessages([...current, message]);
            });
          },
          (message: string) => {
            if (message.toLowerCase().includes('auth session missing')) {
              setSessionMissing(true);
              setThread(null);
              setError('Your sign-in session has expired. Please sign in again to use live chat.');
              return;
            }

            setError(message);
          },
        );
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Live chat failed to load.';

          if (message.toLowerCase().includes('auth session missing')) {
            setSessionMissing(true);
            setThread(null);
            setError('Your sign-in session has expired. Please sign in again to use live chat.');
          } else {
            setError(message);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void startChat();

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [open, user]);

  useEffect(() => {
    if (!open || minimized) return;

    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [messages, open, minimized]);

  useEffect(() => {
    if (!open || minimized) return;

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [open, minimized]);

  const subtitle = useMemo(() => {
    if (!user) return 'Sign in to chat with admin';
    if (sessionMissing) return 'Sign in again to reconnect support';
    if (loading) return 'Connecting to admin support...';
    if (lastAdminMessage) return `Last admin reply ${shortTime(lastAdminMessage.created_at)}`;
    return 'Usually replies as soon as possible';
  }, [lastAdminMessage, loading, sessionMissing, user]);

  function openWidget() {
    setOpen(true);
    setMinimized(false);
    setUnreadCount(0);
  }

  function closeWidget() {
    setOpen(false);
    setMinimized(false);
  }

  function toggleMinimize() {
    setMinimized((value) => !value);
  }

  async function handleSend(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!thread || sending || sessionMissing) return;

    const value = text.trim();

    setSafetyWarning('');

    if (!value) return;

    if (containsOffPlatformContact(value)) {
      setSafetyWarning(
        'For safety, please keep phone numbers, WhatsApp, emails, social handles, and outside links out of chat. The admin team can help you here.',
      );
      return;
    }

    setSending(true);
    setError('');

    try {
      const sent = await sendCustomerChatMessage(thread.id, value);

      setMessages((current) => {
        if (current.some((item) => item.id === sent.id)) return current;
        return sortMessages([...current, sent]);
      });

      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return;

    event.preventDefault();
    void handleSend();
  }

  function setQuickReply(value: string) {
    setText(value);
    setSafetyWarning('');

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  return (
    <div className="fixed bottom-24 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open ? (
        <div
          className={cx(
            'mb-4 flex w-[calc(100vw-2rem)] max-w-[410px] flex-col overflow-hidden rounded-[30px] border border-[#D8E5D4] bg-[#FFFDF7] shadow-[0_24px_70px_rgba(24,59,40,0.24)] transition-all',
            minimized ? 'h-auto' : 'h-[min(660px,calc(100vh-120px))]',
          )}
        >
          <div className="relative overflow-hidden border-b border-[#D8E5D4] bg-[#073F2A] px-5 py-4 text-white">
            <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full bg-[#2D6741]/80 blur-3xl" />
            <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-[#DFA75A]/20 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FFF3D9] text-[#7A4F13]">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#DFA75A]">
                    Secure live support
                  </p>
                </div>

                <h2 className="mt-2 font-serif text-2xl font-black">
                  Chat with admin
                </h2>

                <p className="mt-1 text-xs font-semibold leading-5 text-white/75">
                  {subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMinimize}
                  aria-label={minimized ? 'Expand live chat' : 'Minimize live chat'}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20"
                >
                  <Minimize2 className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={closeWidget}
                  aria-label="Close live chat"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase tracking-[0.12em] text-white/80">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-2 py-2">
                Secure
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-2 py-2">
                Orders
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-2 py-2">
                Produce
              </div>
            </div>
          </div>

          {!minimized ? (
            !user ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
                  <MessageCircle className="h-7 w-7" />
                </div>

                <h3 className="mt-5 font-serif text-2xl font-black text-[#183B28]">
                  Sign in to start chat
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#5F6A62]">
                  Customers can speak with the admin team after signing in.
                </p>

                <Link
                  href="/auth?redirect=/"
                  className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#183B28] px-6 text-sm font-black text-white shadow-sm transition hover:bg-[#2D6741]"
                >
                  Sign in
                </Link>
              </div>
            ) : sessionMissing ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[#FFF3D9] text-[#8B5D18]">
                  <ShieldCheck className="h-7 w-7" />
                </div>

                <h3 className="mt-5 font-serif text-2xl font-black text-[#183B28]">
                  Reconnect live support
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#5F6A62]">
                  Your page still shows your account, but the secure Supabase session for chat is missing. Sign in again to reconnect chat safely.
                </p>

                <Link
                  href="/auth?redirect=/"
                  className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#183B28] px-6 text-sm font-black text-white shadow-sm transition hover:bg-[#2D6741]"
                >
                  Sign in again
                </Link>
              </div>
            ) : (
              <>
                <div
                  ref={listRef}
                  className="flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_100%)] px-4 py-4"
                >
                  {loading ? (
                    <div className="grid h-full place-items-center text-[#5F6A62]">
                      <div className="text-center">
                        <Loader2 className="mx-auto h-7 w-7 animate-spin" />
                        <p className="mt-3 text-sm font-bold">Connecting live support...</p>
                      </div>
                    </div>
                  ) : hasMessages ? (
                    sortedMessages.map((message) => {
                      const fromCustomer = message.sender_role === 'customer';

                      return (
                        <div
                          key={message.id}
                          className={cx('flex', fromCustomer ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cx(
                              'max-w-[84%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm',
                              fromCustomer
                                ? 'rounded-br-md bg-[#183B28] text-white'
                                : 'rounded-bl-md border border-[#D8E5D4] bg-white text-[#183B28]',
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>

                            <div
                              className={cx(
                                'mt-2 flex items-center gap-1 text-[10px] font-bold',
                                fromCustomer ? 'text-white/58' : 'text-[#5F6A62]/75',
                              )}
                            >
                              {fromCustomer ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                              <span>{shortTime(message.created_at)}</span>
                            </div>
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

                        <h3 className="mt-4 font-serif text-xl font-black text-[#183B28]">
                          Start a conversation
                        </h3>

                        <p className="mt-2 max-w-[280px] text-sm leading-6 text-[#5F6A62]">
                          Ask about orders, produce availability, delivery, or your weekly box.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {!loading ? (
                  <div className="border-t border-[#D8E5D4] bg-[#FFFDF7] px-4 py-3">
                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {quickReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => setQuickReply(reply)}
                          className="shrink-0 rounded-full border border-[#D8E5D4] bg-[#F4F9F2] px-3 py-2 text-xs font-black text-[#183B28] transition hover:bg-[#EAF5E7]"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {safetyWarning ? (
                  <p className="border-t border-[#F3D3D3] bg-[#FFF7E7] px-4 py-2 text-xs font-bold leading-5 text-[#8B5D18]">
                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                    {safetyWarning}
                  </p>
                ) : null}

                {error ? (
                  <p className="border-t border-[#F3D3D3] bg-[#FFF2F2] px-4 py-2 text-xs font-bold text-[#B42318]">
                    {error}
                  </p>
                ) : null}

                <form onSubmit={handleSend} className="border-t border-[#D8E5D4] bg-[#FFFDF7] p-3">
                  <div className="flex items-end gap-2 rounded-[22px] border border-[#D8E5D4] bg-white p-2 shadow-sm">
                    <textarea
                      ref={inputRef}
                      value={text}
                      onChange={(event) => {
                        setText(event.target.value);
                        setSafetyWarning('');
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      rows={1}
                      maxLength={MAX_MESSAGE_LENGTH}
                      className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm font-semibold text-[#183B28] outline-none placeholder:text-[#5F6A62]/55"
                    />

                    <button
                      type="submit"
                      disabled={!thread || sending || sessionMissing || !text.trim() || shouldBlockMessage}
                      className="grid h-11 w-11 place-items-center rounded-full bg-[#2D6741] text-white transition hover:bg-[#183B28] disabled:cursor-not-allowed disabled:opacity-45"
                      aria-label="Send message"
                    >
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold text-[#5F6A62]">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#2D6741]" />
                      Keep chat inside the platform.
                    </span>

                    <span className={cx(isNearLimit && 'text-[#8B5D18]')}>
                      {remainingCharacters}
                    </span>
                  </div>
                </form>
              </>
            )
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={openWidget}
        className="relative ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#183B28] text-white shadow-[0_18px_45px_rgba(24,59,40,0.35)] transition hover:-translate-y-0.5 hover:bg-[#2D6741]"
        aria-label="Open live chat"
      >
        <MessageCircle className="h-6 w-6" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#DFA75A] px-1 text-[10px] font-black leading-none text-[#183B28] ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#DFA75A] text-[#183B28] ring-2 ring-white">
            <Sparkles className="h-3 w-3" />
          </span>
        )}
      </button>
    </div>
  );
}
