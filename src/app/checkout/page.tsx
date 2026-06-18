'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Copy,
  CreditCard,
  Gift,
  Home,
  LockKeyhole,
  MapPin,
  MessageSquareText,
  PackageCheck,
  Phone,
  ReceiptText,
  ShieldCheck,
  ShoppingBasket,
  Truck,
  UserRound,
  WalletCards,
} from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionHeader,
  cn,
} from '@/components/ui';
import { useAuth } from '@/components/providers/auth-provider';
import { useCart } from '@/components/providers/cart-provider';
import { effectivePrice } from '@/lib/product';
import {
  fetchCurrentCustomerProfile,
  secureCheckout,
  validateCouponForCheckout,
} from '@/lib/services';
import { formatJmd } from '@/lib/format';

const steps = ['Contact', 'Delivery', 'Payment', 'Review'] as const;

type Step = (typeof steps)[number];

type CheckoutResult = {
  orderId?: string;
  order_id?: string;
  id?: string;
  order?: {
    id?: string;
  };
};

const DELIVERY_FEE = 1000;
const CHECKOUT_NOTE_KEY = 'hpj_box_customer_note';
const CHECKOUT_NAME_KEY = 'hpj_checkout_customer_name';
const CHECKOUT_PHONE_KEY = 'hpj_checkout_customer_phone';
const PENDING_COUPON_KEY = 'harvest-place-ja-pending-coupon';

const ST_ELIZABETH_DELIVERY_AREAS = [
  'Santa Cruz',
  'Junction',
  'Black River',
  'Malvern',
  'Treasure Beach',
  'Other nearby St. Elizabeth area',
] as const;

const DELIVERY_ZONE_DEFAULT = ST_ELIZABETH_DELIVERY_AREAS[0];

function getCheckoutOrderId(result: unknown) {
  const checkoutResult = result as CheckoutResult | null;

  return (
    checkoutResult?.orderId ||
    checkoutResult?.order_id ||
    checkoutResult?.id ||
    checkoutResult?.order?.id ||
    ''
  );
}

function getStoredValue(key: string) {
  if (typeof window === 'undefined') return '';

  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function getNextFridayDateValue() {
  const date = new Date();
  const day = date.getDay();
  const friday = 5;
  let daysUntilFriday = (friday - day + 7) % 7;

  if (daysUntilFriday === 0) {
    daysUntilFriday = 7;
  }

  date.setDate(date.getDate() + daysUntilFriday);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${dayOfMonth}`;
}

function getDefaultPickupTime() {
  return '4:00 PM';
}

type SavedCustomerDetails = {
  full_name?: string | null;
  name?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  mobile?: string | null;
  address?: string | null;
  delivery_address?: string | null;
  email?: string | null;
};

function getUserMetadataValue(user: any, keys: string[]) {
  const metadata = user?.user_metadata || {};
  const appMetadata = user?.app_metadata || {};

  for (const key of keys) {
    const value = metadata[key] || appMetadata[key] || user?.[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function getEmailFallbackName(user: any) {
  if (typeof user?.email !== 'string' || !user.email.trim()) return '';

  return user.email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getUserFullName(user: any) {
  const name = getUserMetadataValue(user, [
    'full_name',
    'name',
    'display_name',
    'username',
    'customer_name',
  ]);

  if (name) return name;

  return getEmailFallbackName(user);
}

function getUserPhone(user: any) {
  return getUserMetadataValue(user, [
    'phone',
    'phone_number',
    'mobile',
    'mobile_number',
    'contact_number',
    'customer_phone',
    'whatsapp',
  ]);
}

async function fetchSavedCustomerDetails(user: any): Promise<SavedCustomerDetails | null> {
  if (!user) return null;

  try {
    const profile = await fetchCurrentCustomerProfile();

    if (profile) {
      return profile as SavedCustomerDetails;
    }
  } catch {
    // Profile is optional. Checkout still works with account metadata or saved local details.
  }

  return null;
}

function firstUsefulValue(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
}

function formatPaymentMethod(value: string) {
  return value.replaceAll('_', ' ');
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, '').trim();
}

function cartLineTotal(line: ReturnType<typeof useCart>['lines'][number]) {
  return Number(effectivePrice(line.product) || 0) * Number(line.quantity || 0);
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { lines, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState<Step>('Contact');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  const [fullName, setFullName] = useState(() => getStoredValue(CHECKOUT_NAME_KEY));
  const [phone, setPhone] = useState(() => getStoredValue(CHECKOUT_PHONE_KEY));
  const [address, setAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState<string>(DELIVERY_ZONE_DEFAULT);
  const [scheduledDate, setScheduledDate] = useState(() => getNextFridayDateValue());
  const [scheduledTime, setScheduledTime] = useState(() => getDefaultPickupTime());
  const [bankReference, setBankReference] = useState('');
  const [notes, setNotes] = useState(() => getStoredValue(CHECKOUT_NOTE_KEY));

  const [couponCode, setCouponCode] = useState(() => getStoredValue(PENDING_COUPON_KEY));
  const [discount, setDiscount] = useState(0);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function hydrateCustomerDetails() {
      if (!user) return;

      const accountName = getUserFullName(user);
      const accountPhone = getUserPhone(user);
      const emailFallbackName = getEmailFallbackName(user);

      setFullName((current) => current.trim() || accountName);
      setPhone((current) => current.trim() || accountPhone);

      const savedCustomer = await fetchSavedCustomerDetails(user);

      if (!mounted || !savedCustomer) return;

      const savedName = firstUsefulValue(savedCustomer.full_name, savedCustomer.name, accountName);
      const savedPhone = firstUsefulValue(savedCustomer.phone, savedCustomer.phone_number, savedCustomer.mobile, accountPhone);
      const savedAddress = firstUsefulValue(savedCustomer.address, savedCustomer.delivery_address);

      setFullName((current) => {
        const currentValue = current.trim();

        if (!currentValue) return savedName;
        if (emailFallbackName && currentValue.toLowerCase() === emailFallbackName.toLowerCase()) {
          return savedName || currentValue;
        }

        return currentValue;
      });

      setPhone((current) => current.trim() || savedPhone);
      setAddress((current) => current.trim() || savedAddress);
    }

    void hydrateCustomerDetails();

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (fullName.trim()) {
      window.localStorage.setItem(CHECKOUT_NAME_KEY, fullName.trim());
    }
  }, [fullName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (phone.trim()) {
      window.localStorage.setItem(CHECKOUT_PHONE_KEY, phone.trim());
    }
  }, [phone]);

  const deliveryFee = fulfillmentType === 'delivery' ? DELIVERY_FEE : 0;

  const total = useMemo(
    () => Math.max(0, subtotal + deliveryFee - discount),
    [subtotal, deliveryFee, discount],
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0),
    [lines],
  );

  const points = Math.floor(total / 100);

  const contactComplete = Boolean(fullName.trim() && normalizePhone(phone).length >= 7);
  const deliveryComplete = fulfillmentType === 'pickup' || Boolean(address.trim());
  const paymentComplete = paymentMethod !== 'bank_transfer' || Boolean(bankReference.trim());
  const checkoutReady = Boolean(user && lines.length && contactComplete && deliveryComplete);

  function resetMessages() {
    setError('');
    setMessage('');
  }

  function validateContact() {
    if (!fullName.trim()) {
      setStep('Contact');
      setError('Please add your full name. If it is saved on your account, it will appear automatically.');
      return false;
    }

    if (normalizePhone(phone).length < 7) {
      setStep('Contact');
      setError('Please add a valid phone number. It will be saved for the next checkout.');
      return false;
    }

    return true;
  }

  function validateDelivery() {
    if (fulfillmentType === 'delivery' && !address.trim()) {
      setStep('Delivery');
      setError('Please add a delivery address. Delivery is only available in St. Elizabeth around Santa Cruz, Junction, Black River, Malvern, and Treasure Beach.');
      return false;
    }

    return true;
  }

  function validatePayment() {
    if (paymentMethod === 'bank_transfer' && !bankReference.trim()) {
      setStep('Payment');
      setError('Please add the bank transfer reference, or choose cash on pickup if available.');
      return false;
    }

    return true;
  }

  function validateStep(nextStep?: Step) {
    resetMessages();

    if (step === 'Contact' && !validateContact()) return false;
    if (step === 'Delivery' && !validateDelivery()) return false;
    if (step === 'Payment' && !validatePayment()) return false;

    if (nextStep) setStep(nextStep);

    return true;
  }

  function goToStep(nextStep: Step) {
    resetMessages();

    const targetIndex = steps.indexOf(nextStep);
    const currentIndex = steps.indexOf(step);

    if (targetIndex <= currentIndex) {
      setStep(nextStep);
      return;
    }

    if (targetIndex >= 1 && !validateContact()) return;
    if (targetIndex >= 2 && !validateDelivery()) return;
    if (targetIndex >= 3 && !validatePayment()) return;

    setStep(nextStep);
  }

  async function applyCoupon() {
    resetMessages();

    if (!couponCode.trim()) {
      setMessage('Enter a coupon code to validate it.');
      return;
    }

    try {
      const result = await validateCouponForCheckout(couponCode, subtotal + deliveryFee);

      if (!result.valid) {
        throw new Error(result.message || 'Coupon is not valid.');
      }

      setDiscount(result.discount_amount || 0);
      setMessage(`${couponCode.trim().toUpperCase()} applied successfully.`);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PENDING_COUPON_KEY, couponCode.trim().toUpperCase());
      }
    } catch (err) {
      setDiscount(0);
      setError(err instanceof Error ? err.message : 'Coupon could not be applied.');
    }
  }

  async function copySummary() {
    const text = [
      'The Harvest Place Ja Checkout Summary',
      '',
      `Customer: ${fullName || 'Not added'}`,
      `Phone: ${phone || 'Not added'}`,
      `Fulfillment: ${fulfillmentType === 'delivery' ? 'St. Elizabeth delivery' : 'Pickup'}`,
      fulfillmentType === 'delivery' ? `Delivery area: ${deliveryZone}` : '',
      fulfillmentType === 'delivery' ? `Address: ${address || 'Not added'}` : 'Pickup: Farm/market pickup',
      `Scheduled: ${scheduledDate || 'Flexible'} ${scheduledTime || ''}`.trim(),
      '',
      ...lines.map((line) => {
        const price = Number(effectivePrice(line.product) || 0);
        return `${line.quantity} x ${line.product.name} @ ${formatJmd(price)} = ${formatJmd(cartLineTotal(line))}`;
      }),
      '',
      `Subtotal: ${formatJmd(subtotal)}`,
      `Delivery: ${formatJmd(deliveryFee)}`,
      discount > 0 ? `Discount: -${formatJmd(discount)}` : '',
      `Total: ${formatJmd(total)}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Could not copy the summary. Please try again.');
    }
  }

  async function submit() {
    resetMessages();

    if (!user) {
      router.push('/auth?redirect=/checkout&next=/checkout');
      return;
    }

    if (!lines.length) {
      setError('Your box is empty. Please add products before checkout.');
      return;
    }

    if (!validateContact()) return;
    if (!validateDelivery()) return;
    if (!validatePayment()) return;

    setLoading(true);

    try {
      const result = await secureCheckout({
        cartLines: lines,
        fullName: fullName.trim(),
        phone: normalizePhone(phone),
        email: user.email,
        address: address.trim(),
        fulfillmentType,
        deliveryZone,
        scheduledDate,
        scheduledTime,
        paymentMethod,
        bankReference: bankReference.trim(),
        notes: notes.trim(),
        couponCode: couponCode.trim() || undefined,
      });

      const orderId = getCheckoutOrderId(result);

      if (!orderId) {
        console.error('secureCheckout did not return an order id:', result);
        throw new Error(
          'Your order may have been created, but no order ID was returned. Please check Orders or contact support.',
        );
      }

      clearCart();

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CHECKOUT_NAME_KEY, fullName.trim());
        window.localStorage.setItem(CHECKOUT_PHONE_KEY, phone.trim());
        window.localStorage.removeItem(PENDING_COUPON_KEY);
        window.localStorage.removeItem(CHECKOUT_NOTE_KEY);
      }

      router.replace(`/orders/${encodeURIComponent(orderId)}?success=true`);
      router.refresh();
    } catch (err) {
      console.error('Checkout failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Checkout failed. Please review your order and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (!lines.length) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FAF8F0_0%,#F4F9F2_100%)] px-4 py-10">
        <section className="mx-auto max-w-5xl">
          <EmptyState
            title="Your box is empty"
            subtitle="Add fresh products before starting checkout."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button href="/shop">Shop now</Button>
                <Button href="/weekly-box" variant="secondary">
                  Build weekly box
                </Button>
              </div>
            }
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf7_0%,#F4F9F2_42%,#fffdf7_100%)] text-[#183B28]">
      <section className="mx-auto max-w-[1420px] px-4 py-8 sm:px-6 lg:px-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/my-box"
            className="inline-flex items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-4 py-2 text-sm font-black text-[#183B28] shadow-sm transition hover:bg-[#F4F9F2]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Box
          </Link>

          <button
            type="button"
            onClick={copySummary}
            className="inline-flex items-center gap-2 rounded-full border border-[#D8E5D4] bg-white px-4 py-2 text-sm font-black text-[#183B28] shadow-sm transition hover:bg-[#F4F9F2]"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied summary' : 'Copy summary'}
          </button>
        </div>

        <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-[#D8E5D4] bg-[#073F2A] p-6 text-white shadow-[0_28px_85px_rgba(7,63,42,0.22)] sm:p-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#2D6741]/55 blur-3xl" />
          <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#DFA75A]/20 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,63,42,0.92)_0%,rgba(7,63,42,0.78)_55%,rgba(7,63,42,0.52)_100%)]" />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF3D9] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#7A4F13] shadow-sm">
                <LockKeyhole className="h-3.5 w-3.5" />
                Secure checkout
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.055em] !text-[#FFFEFC] sm:text-5xl lg:text-6xl" style={{ color: "#FFFEFC", textShadow: "0 4px 24px rgba(0,0,0,0.24)" }}>
                Complete your harvest order
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 !text-white/90 sm:text-base" style={{ color: "rgba(255,255,255,0.9)" }}>
                Review your fresh box, choose pickup or delivery, confirm payment, and place your order securely.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <CheckoutHeroMetric label="Items" value={String(itemCount)} />
              <CheckoutHeroMetric label="Total" value={formatJmd(total)} />
              <CheckoutHeroMetric label="Loyalty" value={`${points} pts`} />
            </div>
          </div>
        </div>

        {!user ? (
          <Card className="mb-6 flex flex-col gap-4 border-[#DFA75A]/40 bg-[#FFF7E7] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="gold">Login required</Badge>
              <p className="mt-2 text-sm font-bold text-[#8B5D18]">
                Sign in to place an order and track your harvest box.
              </p>
            </div>

            <Button href="/auth?redirect=/checkout&next=/checkout">
              Sign in to checkout
            </Button>
          </Card>
        ) : null}

        {error ? (
          <div className="mb-5 flex gap-3 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {message ? (
          <div className="mb-5 rounded-3xl border border-[#2D6741]/20 bg-[#EAF5E7] p-4 text-sm font-black text-[#2D6741]">
            {message}
          </div>
        ) : null}

        <div className="mb-6 grid gap-2 sm:grid-cols-4">
          {steps.map((item, index) => (
            <StepButton
              key={item}
              label={item}
              index={index + 1}
              active={step === item}
              done={steps.indexOf(step) > index}
              onClick={() => goToStep(item)}
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="rounded-[2rem] border border-[#D8E5D4] bg-white p-6 shadow-[0_20px_70px_rgba(24,59,40,0.08)]">
            {step === 'Contact' ? (
              <div>
                <StepTitle
                  icon={<UserRound className="h-5 w-5" />}
                  title="Contact details"
                  text="Tell the farm team who the order is for. These details help with order confirmation and pickup/delivery."
                />

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="Full name" value={fullName} onChange={setFullName} autoComplete="name" />
                  <Field label="Phone" value={phone} onChange={setPhone} autoComplete="tel" />
                </div>

                {user?.email ? (
                  <div className="mt-5 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4 text-sm font-bold text-[#5F6A62]">
                    Signed in as <span className="font-black text-[#183B28]">{user.email}</span>. Name, phone, and saved customer address will be filled automatically when available.
                  </div>
                ) : null}

                <NextRow next="Delivery" validate={validateStep} />
              </div>
            ) : null}

            {step === 'Delivery' ? (
              <div>
                <StepTitle
                  icon={<Truck className="h-5 w-5" />}
                  title="Pickup or delivery"
                  text="Choose pickup or St. Elizabeth delivery. Delivery is only available around Santa Cruz, Junction, Black River, Malvern, and Treasure Beach at JMD $1,000. The date is automatically set to next Friday at 4:00 PM."
                />

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <ChoiceCard
                    active={fulfillmentType === 'pickup'}
                    icon={<Home className="h-5 w-5" />}
                    title="Pickup"
                    text="Collect from the market team."
                    meta="No delivery fee"
                    onClick={() => setFulfillmentType('pickup')}
                  />

                  <ChoiceCard
                    active={fulfillmentType === 'delivery'}
                    icon={<MapPin className="h-5 w-5" />}
                    title="St. Elizabeth delivery"
                    text="Santa Cruz, Junction, Black River, Malvern, Treasure Beach and nearby areas."
                    meta={`${formatJmd(DELIVERY_FEE)} delivery`}
                    onClick={() => setFulfillmentType('delivery')}
                  />
                </div>

                {fulfillmentType === 'delivery' ? (
                  <div className="mt-5 rounded-3xl border border-[#DFA75A]/40 bg-[#FFF7E7] p-4 text-sm font-bold leading-6 text-[#8B5D18]">
                    Delivery is only available in St. Elizabeth around Santa Cruz, Junction, Black River,
                    Malvern, Treasure Beach, and nearby areas. Delivery fee: {formatJmd(DELIVERY_FEE)}.
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {fulfillmentType === 'delivery' ? (
                    <>
                      <label className="grid gap-2 text-sm font-black text-[#183B28]">
                        Delivery area
                        <select
                          value={deliveryZone}
                          onChange={(event) => setDeliveryZone(event.target.value)}
                          className="rounded-2xl border border-[#D8E5D4] bg-white p-3 text-sm font-bold outline-none transition focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
                        >
                          {ST_ELIZABETH_DELIVERY_AREAS.map((area) => (
                            <option key={area} value={area}>
                              {area}
                            </option>
                          ))}
                        </select>
                      </label>

                      <Field
                        label="Delivery address / directions"
                        value={address}
                        onChange={setAddress}
                        placeholder="Example: district, landmark, house colour, or pickup point"
                        autoComplete="street-address"
                      />
                    </>
                  ) : (
                    <div className="rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4 md:col-span-2">
                      <p className="text-sm font-black text-[#183B28]">Pickup selected</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#5F6A62]">
                        The pickup time and location will be confirmed when the order is prepared. Delivery is only for selected St. Elizabeth areas.
                      </p>
                    </div>
                  )}

                  <Field
                    label="Scheduled date"
                    value={scheduledDate}
                    onChange={setScheduledDate}
                    type="date"
                  />

                  <Field
                    label="Scheduled time"
                    value={scheduledTime}
                    onChange={setScheduledTime}
                    placeholder="4:00 PM"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] px-4 py-3 text-sm font-bold text-[#5F6A62]">
                  <span>
                    Default schedule: next Friday at <span className="font-black text-[#183B28]">4:00 PM</span>.
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setScheduledDate(getNextFridayDateValue());
                      setScheduledTime(getDefaultPickupTime());
                    }}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#2D6741] shadow-sm transition hover:bg-[#EAF5E7]"
                  >
                    Reset to next Friday
                  </button>
                </div>

                <NextRow next="Payment" validate={validateStep} />
              </div>
            ) : null}

            {step === 'Payment' ? (
              <div>
                <StepTitle
                  icon={<WalletCards className="h-5 w-5" />}
                  title="Payment and coupon"
                  text="Choose a payment option and validate your coupon if you have one."
                />

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <PaymentChoice
                    active={paymentMethod === 'bank_transfer'}
                    title="Bank transfer"
                    text="Pay by bank transfer and enter the reference."
                    icon={<ReceiptText className="h-5 w-5" />}
                    onClick={() => setPaymentMethod('bank_transfer')}
                  />

                  <PaymentChoice
                    active={paymentMethod === 'cash_on_pickup'}
                    title="Cash on pickup"
                    text="Available for pickup orders."
                    icon={<WalletCards className="h-5 w-5" />}
                    disabled={fulfillmentType !== 'pickup'}
                    onClick={() => setPaymentMethod('cash_on_pickup')}
                  />

                  <PaymentChoice
                    active={paymentMethod === 'card'}
                    title="Card"
                    text="Coming soon for online payment."
                    icon={<CreditCard className="h-5 w-5" />}
                    disabled
                    onClick={() => undefined}
                  />

                  <div className="rounded-3xl border border-[#D8E5D4] bg-[#F4F9F2] p-4">
                    <p className="text-sm font-black text-[#183B28]">Current method</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-[#5F6A62]">
                      {formatPaymentMethod(paymentMethod)}
                    </p>
                  </div>

                  {paymentMethod === 'bank_transfer' ? (
                    <Field
                      label="Bank reference"
                      value={bankReference}
                      onChange={setBankReference}
                      placeholder="Example: Scotia transfer ref / receipt number"
                    />
                  ) : null}

                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-black text-[#183B28]">Coupon code</label>
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value)}
                        placeholder="Coupon code"
                        className="min-w-0 flex-1 rounded-full border border-[#D8E5D4] px-4 py-3 text-sm font-bold outline-none transition focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
                      />

                      <Button variant="secondary" onClick={applyCoupon}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>

                <NextRow next="Review" validate={validateStep} />
              </div>
            ) : null}

            {step === 'Review' ? (
              <div>
                <StepTitle
                  icon={<LockKeyhole className="h-5 w-5" />}
                  title="Review order"
                  text="Confirm your items, delivery details, and payment notes before placing your order."
                />

                <label className="mt-6 grid gap-2 text-sm font-black text-[#183B28]">
                  Order notes
                  <textarea
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value);

                      if (typeof window !== 'undefined') {
                        window.localStorage.setItem(CHECKOUT_NOTE_KEY, event.target.value);
                      }
                    }}
                    className="min-h-32 rounded-2xl border border-[#D8E5D4] bg-white p-3 text-sm font-bold outline-none transition focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
                    placeholder="Pickup or delivery instructions"
                  />
                </label>

                <div className="mt-6 grid gap-3 rounded-3xl border border-[#D8E5D4] bg-[#F7FBF5] p-4 text-sm font-bold text-[#5F6A62]">
                  <ReviewLine label="Contact" value={`${fullName || 'Missing name'} • ${phone || 'Missing phone'}`} />
                  <ReviewLine label="Fulfillment" value={fulfillmentType === 'delivery' ? 'St. Elizabeth delivery' : 'pickup'} capitalize />
                  {fulfillmentType === 'delivery' ? <ReviewLine label="Delivery area" value={deliveryZone} /> : null}
                  {fulfillmentType === 'delivery' ? <ReviewLine label="Address" value={address || 'Missing address'} /> : null}
                  <ReviewLine label="Scheduled" value={`${scheduledDate || 'Flexible'} ${scheduledTime || ''}`.trim()} />
                  <ReviewLine label="Payment" value={formatPaymentMethod(paymentMethod)} capitalize />
                  {paymentMethod === 'bank_transfer' ? <ReviewLine label="Bank reference" value={bankReference || 'Missing reference'} /> : null}
                </div>

                {!checkoutReady ? (
                  <div className="mt-5 rounded-3xl border border-[#DFA75A]/40 bg-[#FFF7E7] p-4 text-sm font-black text-[#8B5D18]">
                    Finish the required contact and delivery fields before placing the order.
                  </div>
                ) : null}

                <Button
                  onClick={submit}
                  disabled={loading || !user || !checkoutReady}
                  className="mt-6 w-full"
                >
                  {loading ? 'Securing order...' : 'Place secure order'}
                </Button>
              </div>
            ) : null}
          </Card>

          <aside className="space-y-5">
            <OrderSummary
              lines={lines}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              discount={discount}
              total={total}
              points={points}
              fulfillmentType={fulfillmentType}
            />

            <Card className="rounded-[1.75rem] border border-[#D8E5D4] bg-white p-5 shadow-[0_16px_45px_rgba(24,59,40,0.06)]">
              <div className="grid gap-3 text-sm font-bold text-[#5F6A62]">
                <Trust
                  icon={<ShieldCheck className="h-4 w-4" />}
                  text="Secure stock validation before order placement"
                />

                <Trust
                  icon={<PackageCheck className="h-4 w-4" />}
                  text="Freshly packed and quality checked"
                />

                <Trust
                  icon={<MapPin className="h-4 w-4" />}
                  text="Pickup or delivery across Jamaica"
                />

                <Trust
                  icon={<Phone className="h-4 w-4" />}
                  text="Order updates sent through your account"
                />
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}

function CheckoutHeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/18 bg-white/14 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#DFA75A]">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function OrderSummary({
  lines,
  subtotal,
  deliveryFee,
  discount,
  total,
  points,
  fulfillmentType,
}: {
  lines: ReturnType<typeof useCart>['lines'];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  points: number;
  fulfillmentType: 'pickup' | 'delivery';
}) {
  return (
    <Card className="sticky top-32 h-fit rounded-[1.9rem] border border-[#D8E5D4] bg-white p-6 shadow-[0_30px_85px_rgba(24,59,40,0.12)]">
      <Badge tone="dark">
        <LockKeyhole className="h-3 w-3" /> Protected checkout
      </Badge>

      <h2 className="mt-4 text-2xl font-black text-[#183B28]">
        Order summary
      </h2>

      <div className="mt-5 grid max-h-[380px] gap-3 overflow-y-auto pr-1">
        {lines.map((line) => {
          const image = line.product.image_url?.trim() || '/logo.png';

          return (
            <div key={line.product.id} className="flex items-center gap-3 rounded-2xl border border-[#D8E5D4] bg-[#FFFEFC] p-2">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#F4F9F2]">
                <Image
                  src={image}
                  alt={line.product.name}
                  fill
                  className="object-contain p-2"
                  unoptimized={image.startsWith('http')}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-[#183B28]">
                  {line.product.name}
                </p>

                <p className="text-xs font-bold text-[#5F6A62]">
                  {line.quantity} × {formatJmd(effectivePrice(line.product))}
                </p>
              </div>

              <p className="text-sm font-black text-[#183B28]">
                {formatJmd(cartLineTotal(line))}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 border-t border-[#D8E5D4] pt-5 text-sm font-bold text-[#5F6A62]">
        <SummaryLine label="Subtotal" value={formatJmd(subtotal)} />
        <SummaryLine label={fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'} value={fulfillmentType === 'delivery' ? formatJmd(deliveryFee) : 'Free'} />

        {discount > 0 ? (
          <SummaryLine label="Discount" value={`-${formatJmd(discount)}`} success />
        ) : null}

        <SummaryLine label="Loyalty preview" value={`${points} pts`} success />

        <div className="flex justify-between border-t border-[#D8E5D4] pt-3 text-xl font-black text-[#183B28]">
          <span>Total</span>
          <span>{formatJmd(total)}</span>
        </div>
      </div>
    </Card>
  );
}

function StepButton({
  label,
  index,
  active,
  done,
  onClick,
}: {
  label: string;
  index: number;
  active: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 text-left transition',
        active
          ? 'border-[#2D6741] bg-white shadow-[0_14px_35px_rgba(45,103,65,0.12)]'
          : 'border-[#D8E5D4] bg-white/70 hover:bg-white',
      )}
    >
      <span
        className={cn(
          'grid h-8 w-8 place-items-center rounded-full text-xs font-black',
          done
            ? 'bg-[#2D6741] text-white'
            : active
              ? 'bg-[#FFF3D9] text-[#8B5D18]'
              : 'bg-[#EAF5E7] text-[#2D6741]',
        )}
      >
        {done ? '✓' : index}
      </span>

      <span className="mt-2 block text-sm font-black text-[#183B28]">
        {label}
      </span>
    </button>
  );
}

function StepTitle({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
        {icon}
      </div>

      <h2 className="mt-4 text-2xl font-black text-[#183B28]">
        {title}
      </h2>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#5F6A62]">{text}</p>
    </div>
  );
}

function NextRow({
  next,
  validate,
}: {
  next: Step;
  validate: (next: Step) => boolean;
}) {
  return (
    <div className="mt-7 flex justify-end">
      <Button onClick={() => validate(next)}>
        Continue
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ChoiceCard({
  active,
  icon,
  title,
  text,
  meta,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  text: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-3xl border p-5 text-left transition',
        active
          ? 'border-[#2D6741] bg-[#EAF5E7] shadow-[0_14px_35px_rgba(45,103,65,0.12)]'
          : 'border-[#D8E5D4] bg-white hover:border-[#2D6741]/35',
      )}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#2D6741] shadow-sm">
        {icon}
      </span>

      <p className="mt-4 font-black text-[#183B28]">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-[#5F6A62]">{text}</p>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-[#8B5D18]">{meta}</p>
    </button>
  );
}

function PaymentChoice({
  active,
  disabled,
  title,
  text,
  icon,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  title: string;
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-3xl border p-5 text-left transition',
        active
          ? 'border-[#2D6741] bg-[#EAF5E7] shadow-[0_14px_35px_rgba(45,103,65,0.12)]'
          : 'border-[#D8E5D4] bg-white hover:border-[#2D6741]/35',
        disabled ? 'cursor-not-allowed opacity-50 hover:border-[#D8E5D4]' : '',
      )}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#F4F9F2] text-[#2D6741]">
        {icon}
      </span>

      <p className="mt-4 font-black text-[#183B28]">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-[#5F6A62]">{text}</p>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#183B28]">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[#D8E5D4] bg-white p-3 text-sm font-bold outline-none transition placeholder:text-[#5F6A62]/50 focus:border-[#2D6741] focus:ring-4 focus:ring-[#2D6741]/10"
      />
    </label>
  );
}

function ReviewLine({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span className={capitalize ? 'font-black capitalize text-[#183B28]' : 'font-black text-[#183B28]'}>
        {value}
      </span>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  success,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className={success ? 'flex justify-between text-[#2D6741]' : 'flex justify-between'}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Trust({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#EAF5E7] text-[#2D6741]">
        {icon}
      </span>

      <span>{text}</span>
    </div>
  );
}
