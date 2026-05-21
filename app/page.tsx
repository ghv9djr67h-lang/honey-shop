"use client";

import { useEffect, useMemo, useState } from "react";

const PRODUCTS = [
  { kg: 1, price: 39000, label: "1кг" },
  { kg: 2, price: 78000, label: "2кг" },
  { kg: 3, price: 117000, label: "3кг" },
] as const;

const PRODUCT_NAME = "Олон цэцгийн 100% цэвэр зөгийн бал";

const PRODUCT_IMAGES = [
  {
    alt: "ТИТЭМ зөгийн бал — үндсэн зураг",
    gradient: "from-amber-400 via-amber-500 to-orange-600",
    label: "Үндсэн",
  },
  {
    alt: "ТИТЭМ зөгийн бал — савлагаа",
    gradient: "from-yellow-300 via-amber-400 to-amber-600",
    label: "Савлагаа",
  },
  {
    alt: "ТИТЭМ зөгийн бал — байгалийн",
    gradient: "from-orange-300 via-amber-500 to-yellow-600",
    label: "Байгалийн",
  },
  {
    alt: "ТИТЭМ зөгийн бал — чанар",
    gradient: "from-amber-200 via-orange-400 to-amber-700",
    label: "Чанар",
  },
] as const;

const FEATURES = ["100% цэвэр", "Байгалийн", "Монгол"] as const;

const STEPS = [
  "Бараа сонгох",
  "Төлбөр төлөх",
  "Хүргэлтийн мэдээлэл",
  "Баярлалаа",
] as const;

const BANK_ACCOUNT =
  process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "[BANK_ACCOUNT_PLACEHOLDER]";

const POLL_INTERVAL_MS = 3000;

type Step = 1 | 2 | 3 | 4;

function formatMNT(amount: number) {
  return `${amount.toLocaleString("mn-MN")}₮`;
}

function formatOrderNumber(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [selectedKg, setSelectedKg] = useState<number>(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = useMemo(
    () => PRODUCTS.find((p) => p.kg === selectedKg)?.price ?? 0,
    [selectedKg],
  );

  // Poll payment status on step 2 — advances to step 3 when webhook marks order paid
  useEffect(() => {
    if (step !== 2 || !orderId) return;

    let active = true;

    async function checkPayment() {
      try {
        const res = await fetch(`/api/orders?order_id=${orderId}`);
        const data = await res.json();
        if (!active || !res.ok) return;

        if (data.order?.payment_status === "paid") {
          setStep(3);
        }
      } catch {
        // silently retry on next interval
      }
    }

    checkPayment();
    const interval = setInterval(checkPayment, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [step, orderId]);

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity_kg: selectedKg,
          total_amount: totalAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Захиалга үүсгэхэд алдаа гарлаа");
      }

      setOrderId(data.order_id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          delivery_address: deliveryAddress,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Баталгаажуулахад алдаа гарлаа");
      }

      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-full bg-[#FFFBF5]">
      <BrandHeader />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <StepIndicator current={step} />

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {step === 1 && (
          <Step1ProductSelect
            galleryIndex={galleryIndex}
            setGalleryIndex={setGalleryIndex}
            selectedKg={selectedKg}
            setSelectedKg={setSelectedKg}
            isSubmitting={isSubmitting}
            onSubmit={handleStep1Submit}
          />
        )}

        {step === 2 && (
          <Step2Payment
            orderId={orderId}
            selectedKg={selectedKg}
            totalAmount={totalAmount}
            onSkipPaymentTest={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3Delivery
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            customerEmail={customerEmail}
            setCustomerEmail={setCustomerEmail}
            deliveryAddress={deliveryAddress}
            setDeliveryAddress={setDeliveryAddress}
            notes={notes}
            setNotes={setNotes}
            isSubmitting={isSubmitting}
            onSubmit={handleStep3Submit}
          />
        )}

        {step === 4 && <Step4ThankYou orderId={orderId} />}
      </main>

      <footer className="border-t border-amber-100 py-8 text-center text-sm text-amber-600">
        © {new Date().getFullYear()} ТИТЭМ · Бүх эрх хамгаалагдсан
      </footer>
    </div>
  );
}

/* ─── Header ─── */

function BrandHeader() {
  return (
    <header className="border-b border-amber-200/50 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-4 sm:px-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-300/40">
          <span className="text-base font-black text-white">T</span>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-amber-600">
            Premium Honey
          </p>
          <h1 className="text-xl font-bold tracking-wide text-amber-950">ТИТЭМ</h1>
        </div>
      </div>
    </header>
  );
}

/* ─── Step indicator ─── */

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => {
          const num = (i + 1) as Step;
          const done = num < current;
          const active = num === current;
          return (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  done
                    ? "bg-amber-500 text-white"
                    : active
                      ? "bg-amber-600 text-white ring-4 ring-amber-200"
                      : "bg-amber-100 text-amber-400"
                }`}
              >
                {done ? "✓" : num}
              </div>
              <span
                className={`mt-2 hidden text-center text-[10px] font-medium leading-tight sm:block ${
                  active ? "text-amber-800" : "text-amber-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative mt-3 h-1 rounded-full bg-amber-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Step 1 ─── */

function Step1ProductSelect({
  galleryIndex,
  setGalleryIndex,
  selectedKg,
  setSelectedKg,
  isSubmitting,
  onSubmit,
}: {
  galleryIndex: number;
  setGalleryIndex: (i: number) => void;
  selectedKg: number;
  setSelectedKg: (kg: number) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <SectionTitle>Бараа сонгох</SectionTitle>

      {/* Gallery */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg shadow-amber-200/30 ring-1 ring-amber-200/60">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${PRODUCT_IMAGES[galleryIndex].gradient}`}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-7xl drop-shadow-lg">🍯</span>
          <span className="mt-3 rounded-full bg-white/25 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {PRODUCT_IMAGES[galleryIndex].label}
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            setGalleryIndex(
              (galleryIndex - 1 + PRODUCT_IMAGES.length) % PRODUCT_IMAGES.length,
            )
          }
          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-amber-800 shadow"
          aria-label="Өмнөх зураг"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() =>
            setGalleryIndex((galleryIndex + 1) % PRODUCT_IMAGES.length)
          }
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-amber-800 shadow"
          aria-label="Дараагийн зураг"
        >
          ›
        </button>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {PRODUCT_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setGalleryIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === galleryIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"
              }`}
              aria-label={`Зураг ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PRODUCT_IMAGES.map((img, i) => (
          <button
            key={img.label}
            type="button"
            onClick={() => setGalleryIndex(i)}
            className={`aspect-square overflow-hidden rounded-lg bg-gradient-to-br ${img.gradient} ring-2 transition ${
              i === galleryIndex ? "ring-amber-500" : "ring-transparent opacity-60"
            }`}
            aria-label={img.alt}
          >
            <span className="flex h-full items-center justify-center text-xl">🍯</span>
          </button>
        ))}
      </div>

      {/* Product info */}
      <div>
        <h2 className="text-2xl font-bold text-amber-950">{PRODUCT_NAME}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-800/80">
          Байгалийн цэвэр, химийн бодис агуулаагүй, шууд үйлдвэрлэгчээс
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <span
              key={f}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
            >
              ✦ {f}
            </span>
          ))}
        </div>
      </div>

      {/* Package selection */}
      <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-amber-950">Савлагаа сонгох</h3>
        <div className="grid grid-cols-3 gap-3">
          {PRODUCTS.map((product) => {
            const selected = selectedKg === product.kg;
            return (
              <button
                key={product.kg}
                type="button"
                onClick={() => setSelectedKg(product.kg)}
                className={`rounded-xl border-2 p-3 text-center transition ${
                  selected
                    ? "border-amber-500 bg-amber-50 shadow-sm"
                    : "border-amber-100 hover:border-amber-300"
                }`}
              >
                <span className="block text-base font-bold text-amber-900">
                  {product.label}
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-amber-600">
                  {formatMNT(product.price)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className={primaryBtnClass}>
        {isSubmitting ? "Илгээж байна..." : "Захиалах"}
      </button>
    </form>
  );
}

/* ─── Step 2 ─── */

function Step2Payment({
  orderId,
  selectedKg,
  totalAmount,
  onSkipPaymentTest,
}: {
  orderId: string;
  selectedKg: number;
  totalAmount: number;
  onSkipPaymentTest: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionTitle>Төлбөр төлөх</SectionTitle>

      {/* Order summary */}
      <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-amber-600">Бүтээгдэхүүн</dt>
            <dd className="text-right font-medium text-amber-950">{PRODUCT_NAME}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-amber-600">Хэмжээ</dt>
            <dd className="font-medium text-amber-950">{selectedKg}кг</dd>
          </div>
          <div className="flex justify-between border-t border-amber-100 pt-3">
            <dt className="font-semibold text-amber-800">Нийт дүн</dt>
            <dd className="text-xl font-bold text-amber-600">{formatMNT(totalAmount)}</dd>
          </div>
        </dl>
      </div>

      {/* QPay option */}
      <div className="rounded-2xl border-2 border-blue-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
            QP
          </div>
          <div>
            <h3 className="font-semibold text-amber-950">QPay</h3>
            <p className="text-xs text-amber-600">Апп-аар шууд төлнө</p>
          </div>
        </div>

        <div className="mx-auto mb-4 flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50">
          <div className="text-center">
            <div className="mx-auto mb-2 grid h-16 w-16 grid-cols-3 gap-0.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-sm ${i % 2 === 0 ? "bg-blue-800" : "bg-blue-600"}`}
                />
              ))}
            </div>
            <p className="text-[10px] text-blue-500">QR код</p>
          </div>
        </div>

        <p className="mb-3 text-center text-2xl font-bold text-amber-600">
          {formatMNT(totalAmount)}
        </p>

        <button
          type="button"
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          QPay-аар төлөх
        </button>

        {orderId && (
          <p className="mt-3 text-center text-[10px] text-amber-400">
            Захиалгын дугаар: {formatOrderNumber(orderId)}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-amber-200" />
        <span className="text-xs font-medium text-amber-400">эсвэл</span>
        <div className="h-px flex-1 bg-amber-200" />
      </div>

      {/* Bank transfer option */}
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-xs font-bold text-white">
            ТДБ
          </div>
          <div>
            <h3 className="font-semibold text-amber-950">Дансаар шилжүүлэх</h3>
            <p className="text-xs text-amber-600">Худалдаа Хөгжлийн Банк (ТДБ)</p>
          </div>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="text-amber-600">Дансны дугаар</dt>
            <dd className="font-mono font-semibold text-amber-900">{BANK_ACCOUNT}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between border-t border-amber-200 pt-3">
            <dt className="text-amber-600">Шилжүүлэх дүн</dt>
            <dd className="text-2xl font-bold text-amber-600">{formatMNT(totalAmount)}</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-red-800">
            Яг {formatMNT(totalAmount)} төгрөг шилжүүлнэ үү
          </p>
        </div>
      </div>

      {/* Waiting for payment confirmation */}
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-amber-100 bg-white px-5 py-4">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
        <p className="text-sm text-amber-700">Төлбөр баталгажихыг хүлээж байна...</p>
      </div>

      {/* Test-only skip — remove before production */}
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
        <p className="mb-3 text-center text-xs text-gray-500">
          🧪 Зөвхөн хөгжүүлэлтийн орчинд
        </p>
        <button
          type="button"
          onClick={onSkipPaymentTest}
          className="w-full rounded-xl border-2 border-gray-300 bg-white py-3 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-100"
        >
          Төлбөр баталгаажуулах (тест)
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3 ─── */

function Step3Delivery({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  deliveryAddress,
  setDeliveryAddress,
  notes,
  setNotes,
  isSubmitting,
  onSubmit,
}: {
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SectionTitle>Хүргэлтийн мэдээлэл</SectionTitle>

      <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-center">
        <p className="text-sm font-medium text-green-800">✓ Төлбөр амжилттай баталгаажлаа</p>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-amber-800">Нэр *</span>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Таны нэр"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-amber-800">Утас *</span>
          <input
            type="tel"
            required
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="9911xxxx"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-amber-800">Имэйл *</span>
          <input
            type="email"
            required
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="email@example.com"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-amber-800">
            Хүргэлтийн хаяг *
          </span>
          <textarea
            required
            rows={3}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Хот, дүүрэг, хороо, байр, тоот..."
            className={`${inputClass} resize-none`}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-amber-800">
            Нэмэлт тэмдэглэл
          </span>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Хүргэлтийн цаг, нэмэлт мэдээлэл..."
            className={`${inputClass} resize-none`}
          />
        </label>
      </div>

      <button type="submit" disabled={isSubmitting} className={primaryBtnClass}>
        {isSubmitting ? "Илгээж байна..." : "Баталгаажуулах"}
      </button>
    </form>
  );
}

/* ─── Step 4 ─── */

function Step4ThankYou({ orderId }: { orderId: string }) {
  return (
    <div className="space-y-6 text-center">
      <SectionTitle>Баярлалаа</SectionTitle>

      <div className="rounded-3xl border border-amber-100 bg-white p-8 shadow-lg shadow-amber-100/50">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-3xl text-white shadow-md">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-amber-950">Захиалга баталгаажлаа!</h2>
        <p className="mt-3 text-sm text-amber-700">Удахгүй хүргэлт хийгдэх болно</p>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-600">
            Захиалгын дугаар
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-amber-900">
            #{formatOrderNumber(orderId)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared styles ─── */

const inputClass =
  "w-full rounded-xl border border-amber-100 bg-[#FFFBF5] px-4 py-3 text-amber-950 placeholder:text-amber-300 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/60";

const primaryBtnClass =
  "w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-amber-300/40 transition hover:from-amber-600 hover:to-amber-700 disabled:cursor-not-allowed disabled:opacity-60";

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-amber-600">
      {children}
    </h2>
  );
}
