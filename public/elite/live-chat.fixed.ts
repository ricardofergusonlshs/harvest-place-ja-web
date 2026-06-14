'use client';

import { getSupabaseBrowserClient } from './supabase/client';

export type ChatThreadStatus = 'open' | 'waiting' | 'resolved' | 'closed';
export type ChatSenderRole = 'customer' | 'admin';

export type SupportChatThread = {
  id: string;
  customer_id: string;
  customer_email: string | null;
  customer_name: string | null;
  subject: string;
  status: ChatThreadStatus;
  last_message: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

export type SupportChatMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: ChatSenderRole;
  body: string;
  is_read: boolean;
  created_at: string;
};

type RealtimeInsertPayload<T> = {
  new: T;
};

function rows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

function cleanMessage(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 1500);
}

async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!data.user) throw new Error('Please sign in to use live chat.');

  return data.user;
}

export async function getOrCreateMyChatThread(): Promise<SupportChatThread> {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentUser();

  const { data: existing, error: existingError } = await supabase
    .from('support_chat_threads')
    .select('*')
    .eq('customer_id', user.id)
    .in('status', ['open', 'waiting', 'resolved'])
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing as SupportChatThread;

  const metadata = user.user_metadata || {};
  const customerName =
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : null;

  const { data: created, error: createError } = await supabase
    .from('support_chat_threads')
    .insert({
      customer_id: user.id,
      customer_email: user.email ?? null,
      customer_name: customerName,
      subject: 'Customer support chat',
      status: 'open',
    })
    .select('*')
    .single();

  if (createError) throw createError;

  return created as SupportChatThread;
}

export async function fetchMyChatMessages(
  threadId: string
): Promise<SupportChatMessage[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('support_chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return rows<SupportChatMessage>(data);
}

export async function sendCustomerChatMessage(
  threadId: string,
  body: string
): Promise<SupportChatMessage> {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentUser();
  const message = cleanMessage(body);

  if (!message) throw new Error('Please type a message first.');

  const { data, error } = await supabase
    .from('support_chat_messages')
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      sender_role: 'customer',
      body: message,
    })
    .select('*')
    .single();

  if (error) throw error;

  return data as SupportChatMessage;
}

export async function fetchAdminChatThreads(): Promise<SupportChatThread[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('support_chat_threads')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (error) throw error;

  return rows<SupportChatThread>(data);
}

export async function fetchAdminChatMessages(
  threadId: string
): Promise<SupportChatMessage[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('support_chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return rows<SupportChatMessage>(data);
}

export async function sendAdminChatMessage(
  threadId: string,
  body: string
): Promise<SupportChatMessage> {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentUser();
  const message = cleanMessage(body);

  if (!message) throw new Error('Please type a reply first.');

  const { data, error } = await supabase
    .from('support_chat_messages')
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      sender_role: 'admin',
      body: message,
    })
    .select('*')
    .single();

  if (error) throw error;

  return data as SupportChatMessage;
}

export async function updateAdminChatStatus(
  threadId: string,
  status: ChatThreadStatus
) {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from('support_chat_threads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', threadId);

  if (error) throw error;
}

export function subscribeToThreadMessages(
  threadId: string,
  onMessage: (message: SupportChatMessage) => void,
  onError?: (message: string) => void
) {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel(`support-chat-thread-${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'support_chat_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload: RealtimeInsertPayload<SupportChatMessage>) => {
        onMessage(payload.new);
      }
    )
    .subscribe((status: string) => {
      if (status === 'CHANNEL_ERROR') {
        onError?.('Live chat connection failed. Refresh the page and try again.');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToAdminChatChanges(
  onChange: () => void,
  onError?: (message: string) => void
) {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel('support-chat-admin')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'support_chat_threads' },
      () => onChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'support_chat_messages' },
      () => onChange()
    )
    .subscribe((status: string) => {
      if (status === 'CHANNEL_ERROR') {
        onError?.('Admin live chat connection failed. Refresh the page and try again.');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
