'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
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
  secureCheckout,
  validateCouponForCheckout,
} from '@/lib/services';
import { formatJmd } from '@/lib/format';

const steps = ['Contact', 'Delivery', 'Payment', 'Review'] as const;

type Step = typeof steps[number];

type CheckoutResult = {
  orderId?: string;
  order_id?: string;
  id?: string;
  order?: {
    id?: string;
  };
};

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

export default function CheckoutPage() {
  const { user } = useAuth();
  const { lines, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState<Step>('Contact');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('Kingston/St. Andrew');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [notes, setNotes] = useState('');

  const [couponCode, setCouponCode] = useState(() =>
    typeof window === 'undefined'
      ? ''
      : localStorage.getItem('harvest-place-ja-pending-coupon') || ''
  );

  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const deliveryFee = fulfillmentType === 'delivery' ? 800 : 0;

  const total = useMemo(
    () => Math.max(0, subtotal + deliveryFee - discount),
    [subtotal, deliveryFee, discount]
  );

  const points = Math.floor(total / 100);

  function validateStep(nextStep?: Step) {
    setError('');

    if (step === 'Contact' && (!fullName.trim() || !phone.trim())) {
      setError('Please add your name and phone number.');
      return false;
    }

    if (step === 'Delivery' && fulfillmentType === 'delivery' && !address.trim()) {
      setError('Please add a delivery address.');
      return false;
    }

    if (nextStep) setStep(nextStep);

    return true;
  }

  async function applyCoupon() {
    setError('');
    setMessage('');

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
    } catch (err) {
      setDiscount(0);
      setError(err instanceof Error ? err.message : 'Coupon could not be applied.');
    }
  }

  async function submit() {
    setError('');
    setMessage('');

    if (!user) {
      router.push('/auth?redirect=/checkout&next=/checkout');
      return;
    }

    if (!lines.length) {
      setError('Your box is empty. Please add products before checkout.');
      return;
    }

    if (!fullName.trim() || !phone.trim()) {
      setStep('Contact');
      setError('Please add your name and phone number.');
      return;
    }

    if (fulfillmentType === 'delivery' && !address.trim()) {
      setStep('Delivery');
      setError('Please add a delivery address.');
      return;
    }

    setLoading(true);

    try {
      const result = await secureCheckout({
        cartLines: lines,
        fullName: fullName.trim(),
        phone: phone.trim(),
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
          'Your order may have been created, but no order ID was returned. Please check Orders or contact support.'
        );
      }

      clearCart();

      if (typeof window !== 'undefined') {
        localStorage.removeItem('harvest-place-ja-pending-coupon');
      }

      router.replace(`/orders/${encodeURIComponent(orderId)}?success=true`);
      router.refresh();
    } catch (err) {
      console.error('Checkout failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Checkout failed. Please review your order and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (!lines.length) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
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
      </main>
    );
  }

  return (
    <main className="bg-[linear-gradient(180deg,#fffdf7_0%,#F4F9F2_42%,#fffdf7_100%)]">
      <section className="mx-auto max-w-[1350px] px-4 py-8 sm:px-6 lg:px-10">
        <SectionHeader
          eyebrow="Secure checkout"
          title="Complete your harvest order"
          subtitle="Your stock is checked securely before the order is placed. Choose pickup or delivery, then review your order."
        />

        {!user ? (
          <Card className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="gold">Login required</Badge>
              <p className="mt-2 text-sm font-bold text-farm-muted">
                Sign in to place an order and track your harvest box.
              </p>
            </div>

            <Button href="/auth?redirect=/checkout&next=/checkout">
              Sign in to checkout
            </Button>
          </Card>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-3xl border border-farm-danger/20 bg-red-50 p-4 text-sm font-black text-farm-danger">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-5 rounded-3xl border border-farm-primary/20 bg-farm-primarySoft p-4 text-sm font-black text-farm-primary">
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
              onClick={() => setStep(item)}
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          <Card className="p-6">
            {step === 'Contact' ? (
              <div>
                <StepTitle
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Contact details"
                  text="Tell the farm team who the order is for."
                />

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="Full name" value={fullName} onChange={setFullName} />
                  <Field label="Phone" value={phone} onChange={setPhone} />
                </div>

                <NextRow next="Delivery" validate={validateStep} />
              </div>
            ) : null}

            {step === 'Delivery' ? (
              <div>
                <StepTitle
                  icon={<Truck className="h-5 w-5" />}
                  title="Pickup or delivery"
                  text="Choose how you want to receive your fresh box."
                />

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <ChoiceCard
                    active={fulfillmentType === 'pickup'}
                    title="Pickup"
                    text="Collect from the market team."
                    onClick={() => setFulfillmentType('pickup')}
                  />

                  <ChoiceCard
                    active={fulfillmentType === 'delivery'}
                    title="Delivery"
                    text="Islandwide delivery to your address."
                    onClick={() => setFulfillmentType('delivery')}
                  />
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {fulfillmentType === 'delivery' ? (
                    <>
                      <Field
                        label="Delivery zone"
                        value={deliveryZone}
                        onChange={setDeliveryZone}
                      />

                      <Field
                        label="Delivery address"
                        value={address}
                        onChange={setAddress}
                      />
                    </>
                  ) : null}

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
                  />
                </div>

                <NextRow next="Payment" validate={validateStep} />
              </div>
            ) : null}

            {step === 'Payment' ? (
              <div>
                <StepTitle
                  icon={<CreditCard className="h-5 w-5" />}
                  title="Payment and coupon"
                  text="Choose a payment option and validate your coupon if you have one."
                />

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-black text-farm-primaryDark">
                    Payment method
                    <select
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                      className="rounded-2xl border border-farm-border bg-white p-3 text-sm font-bold outline-none focus:border-farm-primary"
                    >
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="cash_on_pickup">Cash on pickup</option>
                      <option value="card">Card</option>
                    </select>
                  </label>

                  {paymentMethod === 'bank_transfer' ? (
                    <Field
                      label="Bank reference"
                      value={bankReference}
                      onChange={setBankReference}
                    />
                  ) : null}

                  <div className="flex gap-2 md:col-span-2">
                    <input
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                      placeholder="Coupon code"
                      className="min-w-0 flex-1 rounded-full border border-farm-border px-4 py-3 text-sm font-bold outline-none focus:border-farm-primary"
                    />

                    <Button variant="secondary" onClick={applyCoupon}>
                      Apply
                    </Button>
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

                <label className="mt-6 grid gap-2 text-sm font-black text-farm-primaryDark">
                  Order notes
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="min-h-32 rounded-2xl border border-farm-border bg-white p-3 text-sm font-bold outline-none focus:border-farm-primary"
                    placeholder="Pickup or delivery instructions"
                  />
                </label>

                <div className="mt-6 grid gap-3 rounded-3xl border border-farm-border bg-white p-4 text-sm font-bold text-farm-muted">
                  <div className="flex justify-between gap-4">
                    <span>Fulfillment</span>
                    <span className="capitalize">{fulfillmentType}</span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Scheduled</span>
                    <span>
                      {scheduledDate || 'Flexible'} {scheduledTime || ''}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Payment</span>
                    <span>{paymentMethod.replaceAll('_', ' ')}</span>
                  </div>
                </div>

                <Button
                  onClick={submit}
                  disabled={loading || !user}
                  className="mt-6 w-full"
                >
                  {loading ? 'Securing order...' : 'Place secure order'}
                </Button>
              </div>
            ) : null}
          </Card>

          <aside className="space-y-5">
            <Card className="sticky top-32 h-fit p-6">
              <Badge tone="dark">
                <LockKeyhole className="h-3 w-3" /> Protected checkout
              </Badge>

              <h2 className="mt-4 text-2xl font-black text-farm-primaryDark">
                Order summary
              </h2>

              <div className="mt-5 grid gap-3">
                {lines.map((line) => (
                  <div key={line.product.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-farm-primarySoft">
                      <Image
                        src={line.product.image_url || '/logo.png'}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-farm-primaryDark">
                        {line.product.name}
                      </p>

                      <p className="text-xs font-bold text-farm-muted">
                        {line.quantity} × {formatJmd(effectivePrice(line.product))}
                      </p>
                    </div>

                    <p className="text-sm font-black text-farm-primaryDark">
                      {formatJmd(effectivePrice(line.product) * line.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 border-t border-farm-border pt-5 text-sm font-bold text-farm-muted">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatJmd(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{formatJmd(deliveryFee)}</span>
                </div>

                {discount > 0 ? (
                  <div className="flex justify-between text-farm-success">
                    <span>Discount</span>
                    <span>-{formatJmd(discount)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between text-farm-success">
                  <span>Loyalty preview</span>
                  <span>{points} pts</span>
                </div>

                <div className="flex justify-between border-t border-farm-border pt-3 text-xl font-black text-farm-primaryDark">
                  <span>Total</span>
                  <span>{formatJmd(total)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="grid gap-3 text-sm font-bold text-farm-muted">
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
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </main>
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
          ? 'border-farm-primary bg-white shadow-card'
          : 'border-farm-border bg-white/70 hover:bg-white'
      )}
    >
      <span
        className={cn(
          'grid h-8 w-8 place-items-center rounded-full text-xs font-black',
          done
            ? 'bg-farm-primary text-white'
            : active
              ? 'bg-farm-accentSoft text-farm-warning'
              : 'bg-farm-primarySoft text-farm-primary'
        )}
      >
        {done ? '✓' : index}
      </span>

      <span className="mt-2 block text-sm font-black text-farm-primaryDark">
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
      <div className="grid h-12 w-12 place-items-center rounded-full bg-farm-primarySoft text-farm-primary">
        {icon}
      </div>

      <h2 className="mt-4 text-2xl font-black text-farm-primaryDark">
        {title}
      </h2>

      <p className="mt-2 text-sm font-semibold text-farm-muted">{text}</p>
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
      <Button onClick={() => validate(next)}>Continue</Button>
    </div>
  );
}

function ChoiceCard({
  active,
  title,
  text,
  onClick,
}: {
  active: boolean;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-3xl border p-5 text-left transition',
        active
          ? 'border-farm-primary bg-farm-primarySoft shadow-card'
          : 'border-farm-border bg-white hover:border-farm-primary/35'
      )}
    >
      <p className="font-black text-farm-primaryDark">{title}</p>
      <p className="mt-1 text-sm font-semibold text-farm-muted">{text}</p>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-farm-primaryDark">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-farm-border bg-white p-3 text-sm font-bold outline-none focus:border-farm-primary"
      />
    </label>
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
      <span className="grid h-9 w-9 place-items-center rounded-full bg-farm-primarySoft text-farm-primary">
        {icon}
      </span>

      <span>{text}</span>
    </div>
  );
}