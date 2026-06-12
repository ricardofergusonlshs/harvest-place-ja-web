export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonMap | JsonValue[];
export type JsonMap = Record<string, unknown>;

export type HomeHeroSlide = {
  id?: string;
  position: number;
  image_url?: string | null;
  title: string;
  subtitle: string;
  is_active: boolean;
  updated_at?: string | null;
};

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  unit?: string | null;
  image_url?: string | null;
  is_available: boolean;
  stock_quantity: number;
  created_at?: string | null;

  category: string;
  is_organic: boolean;
  is_local: boolean;
  harvest_date?: string | null;

  farmer_id?: string | null;
  farmer_name?: string | null;
  farm_name?: string | null;
  parish?: string | null;

  approval_status: string;
  platform_commission_percent: number;

  original_price?: number | null;
  discount_price?: number | null;
  discount_percent?: number | null;
  discount_label?: string | null;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
  is_discount_active: boolean;

  product_status: string;
  ready_soon: boolean;
  estimated_ready_date?: string | null;
  expected_stock_quantity?: number | null;

  is_deal_of_day: boolean;
  deal_rank: number;

  subscribe_save_enabled: boolean;
  subscribe_save_discount_percent: number;
};

export type CartLine = {
  product: Product;
  quantity: number;
  subscribeSave?: boolean;
};

export type SecureCartLineQuote = {
  product: Product;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type SecureCartQuote = {
  lines: SecureCartLineQuote[];
  subtotal: number;
  unavailableMessage?: string | null;
};

export type CustomerProfile = {
  id: string;
  full_name: string;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  user_id?: string | null;
  email?: string | null;
};

export type OrderCustomer = {
  full_name?: string | null;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
};

export type FarmOrder = {
  id: string;
  customer_id?: string | null;
  email?: string | null;

  order_status?: string | null;
  status?: string | null;

  fulfillment_type?: string | null;
  subtotal?: number | null;
  delivery_fee?: number | null;
  discount_amount?: number | null;
  discount_code?: string | null;
  total?: number | null;

  payment_status?: string | null;
  payment_method?: string | null;
  bank_reference?: string | null;

  delivery_status?: string | null;
  delivery_address?: string | null;
  delivery_zone?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;

  notes?: string | null;
  created_at?: string | null;

  customers?: OrderCustomer | null;
  order_items?: OrderDetailsItem[] | null;
};

export type OrderDetailsItem = {
  id?: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price?: number | null;
  line_total: number;
  farmer_id?: string | null;
  farmer_name?: string | null;
  farm_name?: string | null;
};

export type FarmNotification = {
  id: string;
  title: string;
  message: string;
  type?: string | null;
  read?: boolean | null;
  is_read?: boolean | null;
  order_id?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  created_at?: string | null;
};

export type LoyaltySummary = {
  points: number;
  lifetime_points?: number;
  tier?: string;
};

export type ProductTraceRecord = {
  id: string;
  product_id?: string | null;
  product_name?: string | null;
  trace_code?: string | null;
  farm_name?: string | null;
  farmer_name?: string | null;
  parish?: string | null;
  harvest_date?: string | null;
  packed_at?: string | null;
  freshness_note?: string | null;
  handling_notes?: string | null;
  created_at?: string | null;
};

export type CustomerProductSubscription = {
  id: string;
  user_id?: string | null;
  email?: string | null;
  product_id: string;
  product_name: string;
  status: string;
  cadence?: string | null;
  quantity?: number | null;
  subscribe_save_discount_percent?: number | null;
  created_at?: string | null;
};

export type FarmerProfile = {
  id: string;
  user_id: string;
  email: string;
  farm_name: string;
  farmer_name: string;
  phone: string;
  parish: string;
  address: string;
  bio: string;
  verification_status: string;
  payout_method: string;
  payout_details: string;
  created_at?: string | null;
};

export type FarmerPayout = {
  id: string;
  farmer_id: string;
  order_id: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  payout_status: string;
  payout_method?: string | null;
  payout_reference?: string | null;
  released_at?: string | null;
  created_at?: string | null;
};

export type FarmerOrderSummary = {
  order_id: string;
  product_name: string;
  quantity: number;
  line_total: number;
  farmer_earning_amount: number;
  farmer_id?: string | null;
  created_at?: string | null;
};

export type Coupon = {
  id: string;
  code: string;
  discount_type: 'fixed' | 'percent' | string;
  discount_value: number;
  minimum_order?: number | null;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number | null;
  description?: string | null;
  created_at?: string | null;
};

export type CouponValidationResult = {
  valid: boolean;
  message: string;
  coupon_id?: string | null;
  code?: string | null;
  discount_type?: string | null;
  discount_value?: number | null;
  discount_amount: number;
  original_total: number;
  final_total: number;
};

export type SupportTicket = {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_reply?: string | null;
  user_id?: string | null;
  created_at?: string | null;
};

export type ProductReview = {
  id: string;
  product_id: string;
  product_name?: string | null;
  user_id?: string | null;
  customer_name?: string | null;
  email?: string | null;
  rating: number;
  comment: string;
  created_at?: string | null;
  products?: { name?: string | null } | null;
};

export type AuditLogEntry = {
  id?: string;
  action?: string | null;
  table_name?: string | null;
  record_id?: string | null;
  admin_email?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};