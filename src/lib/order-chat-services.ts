import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export type OrderCustomer = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export type CustomerOrder = {
  id: string;
  customer_id: string | null;
  order_status: string | null;
  fulfillment_type: string | null;
  delivery_address: string | null;
  payment_status: string | null;
  subtotal: number | null;
  delivery_fee: number | null;
  total: number | null;
  created_at: string | null;
  customer?: OrderCustomer | null;
};

export type SupportChatThread = {
  id: string;
  customer_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  order_id: string | null;
  subject: string | null;
  status: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type SupportChatMessage = {
  id: string;
  thread_id: string;
  sender_id: string | null;
  sender_role: 'customer' | 'admin' | 'system' | string;
  body: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

export function cleanOrderError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const record = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [
      record.message,
      record.details,
      record.hint,
      record.code ? `Code: ${String(record.code)}` : null,
    ]
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);

    if (parts.length) return parts.join(' • ');

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return 'Something went wrong. Please try again.';
}

export function customerDisplayName(customer?: OrderCustomer | null) {
  return customer?.full_name?.trim() || customer?.email?.trim() || 'Customer';
}

export function orderTotal(order: CustomerOrder) {
  return Number(order.total ?? 0);
}

export async function fetchOrdersWithCustomers(limit = 100) {
  const supabase = getSupabaseBrowserClient();

  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'id, customer_id, order_status, fulfillment_type, delivery_address, payment_status, subtotal, delivery_fee, total, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const rows = (orders || []) as CustomerOrder[];

  const customerIds = Array.from(
    new Set(rows.map((order) => order.customer_id).filter(Boolean) as string[])
  );

  if (!customerIds.length) return rows;

  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select('id, user_id, full_name, email, phone, address')
    .in('id', customerIds);

  if (customerError) throw new Error(customerError.message);

  const customerMap = new Map(
    ((customers || []) as OrderCustomer[]).map((customer) => [customer.id, customer])
  );

  return rows.map((order) => ({
    ...order,
    customer: order.customer_id ? customerMap.get(order.customer_id) || null : null,
  }));
}

export async function fetchOrderWithCustomer(orderId: string) {
  const supabase = getSupabaseBrowserClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      'id, customer_id, order_status, fulfillment_type, delivery_address, payment_status, subtotal, delivery_fee, total, created_at'
    )
    .eq('id', orderId)
    .single();

  if (error) throw new Error(error.message);

  const typedOrder = order as CustomerOrder;

  if (!typedOrder.customer_id) {
    return { ...typedOrder, customer: null };
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, user_id, full_name, email, phone, address')
    .eq('id', typedOrder.customer_id)
    .maybeSingle();

  if (customerError) throw new Error(customerError.message);

  return {
    ...typedOrder,
    customer: (customer as OrderCustomer | null) || null,
  };
}

export async function updateOrderAdminFields(
  orderId: string,
  updates: {
    order_status?: string;
    payment_status?: string;
    fulfillment_type?: string;
  }
) {
  const supabase = getSupabaseBrowserClient();

  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined && value !== '')
  );

  const { data, error } = await supabase
    .from('orders')
    .update(cleanUpdates)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function fetchAdminChatThreads(limit = 50) {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('support_chat_threads')
    .select(
      'id, customer_id, customer_email, customer_name, order_id, subject, status, last_message, last_message_at, created_at, updated_at'
    )
    .order('last_message_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data || []) as SupportChatThread[];
}

export async function fetchThreadMessages(threadId: string) {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('support_chat_messages')
    .select('id, thread_id, sender_id, sender_role, body, is_read, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []) as SupportChatMessage[];
}

export async function sendChatMessage(params: {
  threadId: string;
  senderId: string | null;
  senderRole: 'customer' | 'admin' | 'system';
  body: string;
}) {
  const supabase = getSupabaseBrowserClient();
  const message = params.body.trim();

  if (!message) throw new Error('Please type a message first.');

  const { data, error } = await supabase
    .from('support_chat_messages')
    .insert({
      thread_id: params.threadId,
      sender_id: params.senderId,
      sender_role: params.senderRole,
      body: message,
      is_read: false,
    })
    .select('id, thread_id, sender_id, sender_role, body, is_read, created_at')
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from('support_chat_threads')
    .update({
      last_message: message,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.threadId);

  return data as SupportChatMessage;
}

export async function openOrCreateOrderThread(orderId: string) {
  const supabase = getSupabaseBrowserClient();
  const order = await fetchOrderWithCustomer(orderId);
  const customer = order.customer;

  const customerUserId = customer?.user_id || null;
  const customerName = customerDisplayName(customer);
  const customerEmail = customer?.email || null;

  const { data: existing, error: existingError } = await supabase
    .from('support_chat_threads')
    .select(
      'id, customer_id, customer_email, customer_name, order_id, subject, status, last_message, last_message_at, created_at, updated_at'
    )
    .eq('order_id', orderId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing as SupportChatThread;

  const { data, error } = await supabase
    .from('support_chat_threads')
    .insert({
      customer_id: customerUserId,
      customer_email: customerEmail,
      customer_name: customerName,
      order_id: orderId,
      subject: `Order #HPJ-${orderId.slice(0, 6).toUpperCase()}`,
      status: 'open',
      last_message: 'Order support thread created.',
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(
      'id, customer_id, customer_email, customer_name, order_id, subject, status, last_message, last_message_at, created_at, updated_at'
    )
    .single();

  if (error) throw new Error(error.message);

  return data as SupportChatThread;
}
