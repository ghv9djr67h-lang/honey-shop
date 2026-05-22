"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PRODUCTS = [
  { kg: 1, price: 39000, label: "1кг" },
  { kg: 2, price: 78000, label: "2кг" },
  { kg: 3, price: 117000, label: "3кг" },
] as const;

const PRODUCT_NAME = "Уулын олон цэцгийн 100% цэвэр зөгийн бал";
const TAGLINE = "Байгалийн цэвэр · Өвөр Монгол · Шууд үйлдвэрлэгчээс";

const STEPS = ["Бараа сонгох", "Төлбөр", "Хүргэлтийн мэдээлэл", "Баярлалаа"] as const;

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
  const [selectedKg, setSelectedKg] = useState<number>(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = useMemo(
    () => PRODUCTS.find((p) => p.kg === selectedKg)?.price ?? 0,
    [selectedKg],
  );

  useEffect(() => {
    if (step !== 2 || !orderId) return;

    let active = true;

    async function checkPayment() {
      try {
        const res = await fetch(`/api/orders?order_id=${orderId}`);
        const data = await res.json();
        if (!active || !res.ok) return;
        if (data.order?.payment_status === "paid") setStep(3);
      } catch {
        // retry on next interval
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
      if (!response.ok) throw new Error(data.error ?? "Захиалга үүсгэхэд алдаа гарлаа");

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
      const payload: Record<string, string> = {
        order_id: orderId,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
      };

      if (customerEmail.trim()) {
        payload.customer_email = customerEmail.trim();
      }

      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Баталгаажуулахад алдаа гарлаа");

      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-full honeycomb-bg">
      {/* Warm ambient gradient overlay */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#fff8ed]/80 via-[#fdf6e8]/60 to-[#f5e6c8]/40" />

      <div className="relative z-10 flex min-h-full flex-col">
        <BrandHeader />

        {step === 1 && <HeroSection />}

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <StepIndicator current={step} />

          {error && (
            <div className="mt-6 rounded-2xl border border-red-300/50 bg-red-50/90 px-5 py-4 text-sm text-red-800 backdrop-blur-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <Step1SizeSelect
              selectedKg={selectedKg}
              setSelectedKg={setSelectedKg}
              totalAmount={totalAmount}
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
              isSubmitting={isSubmitting}
              onSubmit={handleStep3Submit}
            />
          )}

          {step === 4 && <Step4ThankYou orderId={orderId} />}
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

/* ─── Header ─── */

function BrandHeader() {
  return (
    <header className="relative border-b border-[#d4a017]/20 bg-gradient-to-r from-[#3d2314] via-[#5c3a1e] to-[#3d2314] shadow-lg shadow-[#3d2314]/30">
      <div className="absolute inset-0 honeycomb-bg-dark opacity-40" />
      <div className="relative mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Hex logo with bee */}
          <div className="relative">
            <div
              className="flex h-14 w-14 items-center justify-center bg-gradient-to-br from-[#f5d061] via-[#d4a017] to-[#b8860b] shadow-lg shadow-[#d4a017]/40"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            >
              <span className="bee-float text-2xl">🐝</span>
            </div>
            <div
              className="absolute -inset-1 -z-10 bg-[#d4a017]/30"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-wide text-[#f5d061]">ТИТЭМ</h1>
            <p className="text-xs tracking-widest text-[#e8c878]/80 uppercase">Premium Honey</p>
          </div>
        </div>
        <Link
          href="/admin/login"
          className="text-xs text-[#e8c878]/50 transition hover:text-[#f5d061]"
        >
          Нэвтрэх
        </Link>
      </div>
    </header>
  );
}

/* ─── Hero ─── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[#d4a017]/15 bg-gradient-to-b from-[#fdf6e8] to-[#fff8ed]">
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#d4a017]/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#b8860b]/10 blur-3xl" />

      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
          {/* Product image placeholder */}
          <div className="relative mb-6 sm:mb-0 sm:shrink-0">
            <div
              className="flex h-36 w-36 items-center justify-center bg-gradient-to-br from-[#f5d061]/30 via-[#d4a017]/20 to-[#b8860b]/30 shadow-inner sm:h-44 sm:w-44"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            >
              <span className="text-6xl drop-shadow-lg sm:text-7xl">🍯</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full bg-[#d4a017]/20 blur-sm" />
          </div>

          <div>
            <p className="mb-2 font-serif text-sm font-medium tracking-[0.25em] text-[#b8860b] uppercase">
              Байгалийн бэлэг
            </p>
            <h2 className="font-serif text-2xl font-bold leading-tight text-[#3d2314] sm:text-3xl">
              {PRODUCT_NAME}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#7c4a03]/80">{TAGLINE}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {["100% цэвэр", "Байгалийн", "Өвөр Монгол"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#d4a017]/30 bg-white/60 px-3 py-1 text-xs font-medium text-[#7c4a03] backdrop-blur-sm"
                >
                  ✦ {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Honeycomb step indicator ─── */

function HexStep({
  num,
  done,
  active,
}: {
  num: number;
  done: boolean;
  active: boolean;
}) {
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center text-xs font-bold transition-all duration-300 ${
        done
          ? "bg-gradient-to-br from-[#d4a017] to-[#b8860b] text-white shadow-md shadow-[#d4a017]/40"
          : active
            ? "bg-gradient-to-br from-[#f5d061] to-[#d4a017] text-[#3d2314] shadow-lg shadow-[#d4a017]/50 ring-2 ring-[#f5d061]/60"
            : "bg-[#fdf6e8] text-[#d4a017]/50 border border-[#d4a017]/20"
      }`}
      style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
    >
      {done ? "✓" : num}
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((label, i) => {
          const num = (i + 1) as Step;
          const done = num < current;
          const active = num === current;
          return (
            <div key={label} className="flex flex-1 flex-col items-center">
              <HexStep num={num} done={done} active={active} />
              <span
                className={`mt-2.5 hidden text-center text-[10px] font-medium leading-tight sm:block ${
                  active ? "text-[#7c4a03]" : "text-[#d4a017]/60"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-[#d4a017]/15">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#f5d061] via-[#d4a017] to-[#b8860b] transition-all duration-700 ease-out"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Step 1 ─── */

function Step1SizeSelect({
  selectedKg,
  setSelectedKg,
  totalAmount,
  isSubmitting,
  onSubmit,
}: {
  selectedKg: number;
  setSelectedKg: (kg: number) => void;
  totalAmount: number;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SectionTitle>Бараа сонгох</SectionTitle>

      <div className={panelClass}>
        <p className="mb-5 text-center font-serif text-sm text-[#7c4a03]/70">
          Тоо хэмжээ сонгоно уу
        </p>
        <div className="grid grid-cols-3 gap-4">
          {PRODUCTS.map((product) => {
            const selected = selectedKg === product.kg;
            return (
              <button
                key={product.kg}
                type="button"
                onClick={() => setSelectedKg(product.kg)}
                className={`honey-drip group relative pt-2 transition-all duration-300 ${
                  selected ? "selected honey-glow -translate-y-1" : "hover:-translate-y-0.5"
                }`}
              >
                <div
                  className={`relative flex flex-col items-center justify-center px-2 py-5 transition-all ${
                    selected
                      ? "bg-gradient-to-b from-[#f5d061] via-[#e8a820] to-[#d4a017] text-[#3d2314] shadow-xl shadow-[#d4a017]/30"
                      : "border border-[#d4a017]/25 bg-gradient-to-b from-white to-[#fdf6e8] text-[#7c4a03] hover:border-[#d4a017]/50 hover:shadow-md"
                  }`}
                  style={{
                    clipPath:
                      "polygon(50% 0%, 95% 20%, 95% 80%, 50% 100%, 5% 80%, 5% 20%)",
                  }}
                >
                  {selected && (
                    <div className="crystal-shine pointer-events-none absolute inset-0 opacity-60" />
                  )}
                  <span className="relative font-serif text-xl font-bold">{product.label}</span>
                  <span
                    className={`relative mt-1 text-sm font-semibold ${selected ? "text-[#3d2314]/90" : "text-[#b8860b]"}`}
                  >
                    {formatMNT(product.price)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#d4a017]/25 bg-gradient-to-r from-[#fdf6e8] to-[#fff8ed] px-5 py-4">
          <span className="font-medium text-[#7c4a03]">Нийт дүн</span>
          <span className="font-serif text-2xl font-bold gold-text">{formatMNT(totalAmount)}</span>
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
      <SectionTitle>Төлбөр</SectionTitle>

      <div className={panelClass}>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#7c4a03]/70">Бүтээгдэхүүн</dt>
            <dd className="text-right font-medium text-[#3d2314]">{PRODUCT_NAME}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#7c4a03]/70">Хэмжээ</dt>
            <dd className="font-medium text-[#3d2314]">{selectedKg}кг</dd>
          </div>
          <div className="flex justify-between border-t border-[#d4a017]/20 pt-3">
            <dt className="font-semibold text-[#7c4a03]">Нийт дүн</dt>
            <dd className="font-serif text-xl font-bold gold-text">{formatMNT(totalAmount)}</dd>
          </div>
        </dl>
      </div>

      {/* QPay */}
      <div className={`${panelClass} border-blue-200/60`}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-black text-white shadow-md">
            QP
          </div>
          <div>
            <h3 className="font-serif font-semibold text-[#3d2314]">QPay</h3>
            <p className="text-xs text-[#7c4a03]/70">Апп-аар шууд төлнө</p>
          </div>
        </div>

        <div className="mx-auto mb-4 flex h-36 w-36 items-center justify-center rounded-2xl border-2 border-dashed border-blue-200/80 bg-blue-50/50">
          <div className="text-center">
            <div className="mx-auto mb-2 grid h-14 w-14 grid-cols-3 gap-0.5">
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

        <p className="mb-3 text-center font-serif text-2xl font-bold gold-text">
          {formatMNT(totalAmount)}
        </p>

        <button type="button" className={secondaryBtnClass}>
          QPay-аар төлөх
        </button>

        {orderId && (
          <p className="mt-3 text-center text-[10px] text-[#d4a017]/60">
            Захиалгын дугаар: {formatOrderNumber(orderId)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4a017]/40 to-transparent" />
        <span className="font-serif text-xs font-medium text-[#b8860b]">эсвэл</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4a017]/40 to-transparent" />
      </div>

      {/* Bank transfer */}
      <div className={`${panelClass} border-[#d4a017]/40 bg-gradient-to-br from-[#fdf6e8] to-[#f5e6c8]/50`}>
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center bg-gradient-to-br from-[#d4a017] to-[#7c4a03] text-xs font-bold text-white shadow-md"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
          >
            ТДБ
          </div>
          <div>
            <h3 className="font-serif font-semibold text-[#3d2314]">Дансаар шилжүүлэх</h3>
            <p className="text-xs text-[#7c4a03]/70">Худалдаа Хөгжлийн Банк (ТДБ)</p>
          </div>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="text-[#7c4a03]/70">Дансны дугаар</dt>
            <dd className="font-mono font-semibold text-[#3d2314]">{BANK_ACCOUNT}</dd>
          </div>
          <div className="flex flex-col gap-0.5 border-t border-[#d4a017]/20 pt-3 sm:flex-row sm:justify-between">
            <dt className="text-[#7c4a03]/70">Шилжүүлэх дүн</dt>
            <dd className="font-serif text-2xl font-bold gold-text">{formatMNT(totalAmount)}</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl border border-red-300/40 bg-red-50/80 px-4 py-3 text-center backdrop-blur-sm">
          <p className="text-sm font-semibold text-red-800">
            Яг {formatMNT(totalAmount)} төгрөг шилжүүлнэ үү
          </p>
        </div>
      </div>

      <div className={`${panelClass} flex items-center justify-center gap-3 py-4`}>
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#d4a017]/30 border-t-[#d4a017]" />
        <p className="text-sm text-[#7c4a03]">Төлбөр баталгажихыг хүлээж байна...</p>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300/60 bg-gray-50/80 p-4 backdrop-blur-sm">
        <p className="mb-3 text-center text-xs text-gray-500">🧪 Зөвхөн тест</p>
        <button type="button" onClick={onSkipPaymentTest} className={testBtnClass}>
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
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SectionTitle>Хүргэлтийн мэдээлэл</SectionTitle>

      <div className="rounded-2xl border border-emerald-400/40 bg-emerald-50/80 px-5 py-4 text-center backdrop-blur-sm">
        <p className="text-sm font-medium text-emerald-800">✓ Төлбөр амжилттай баталгаажлаа</p>
      </div>

      <div className={`${panelClass} space-y-4`}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[#7c4a03]">Нэр *</span>
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
          <span className="mb-1.5 block text-sm font-medium text-[#7c4a03]">Утас *</span>
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
          <span className="mb-1.5 block text-sm font-medium text-[#7c4a03]">И-мэйл</span>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="И-мэйл (заавал биш)"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[#7c4a03]">
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

      <div className={`${panelClass} p-8`}>
        <div
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center bg-gradient-to-br from-[#f5d061] via-[#d4a017] to-[#b8860b] text-3xl text-white shadow-xl shadow-[#d4a017]/40"
          style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
        >
          ✓
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#3d2314]">Захиалга баталгаажлаа!</h2>
        <p className="mt-3 text-sm text-[#7c4a03]/80">Удахгүй хүргэлт хийгдэх болно</p>

        <div className="mt-8 rounded-2xl border border-[#d4a017]/30 bg-gradient-to-br from-[#fdf6e8] to-[#f5e6c8]/50 px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-widest text-[#b8860b]">
            Захиалгын дугаар
          </p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-widest gold-text">
            #{formatOrderNumber(orderId)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Footer ─── */

function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-[#d4a017]/20 honeycomb-bg-dark">
      <div className="absolute inset-0 bg-gradient-to-t from-[#2a1810] to-[#3d2314]/95" />
      <div className="relative px-4 py-10 text-center sm:px-6">
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="text-lg">🐝</span>
          <span className="font-serif text-lg font-bold text-[#f5d061]">ТИТЭМ</span>
        </div>
        <p className="text-sm text-[#e8c878]/60">
          © {new Date().getFullYear()} ТИТЭМ · Байгалийн цэвэр зөгийн бал
        </p>
        <p className="mt-1 text-xs text-[#e8c878]/40">Бүх эрх хамгаалагдсан</p>
      </div>
    </footer>
  );
}

/* ─── Shared styles ─── */

const panelClass =
  "rounded-2xl border border-[#d4a017]/20 bg-white/70 p-5 shadow-lg shadow-[#d4a017]/10 backdrop-blur-sm sm:p-6";

const inputClass =
  "w-full rounded-xl border border-[#d4a017]/25 bg-[#fff8ed]/80 px-4 py-3 text-[#3d2314] placeholder:text-[#d4a017]/40 outline-none transition focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20";

const primaryBtnClass =
  "w-full rounded-2xl bg-gradient-to-r from-[#f5d061] via-[#d4a017] to-[#b8860b] px-8 py-4 font-serif text-lg font-semibold text-[#3d2314] shadow-xl shadow-[#d4a017]/30 transition-all hover:from-[#f5d061] hover:via-[#e8a820] hover:to-[#d4a017] hover:shadow-2xl hover:shadow-[#d4a017]/40 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryBtnClass =
  "w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-blue-800 hover:shadow-lg";

const testBtnClass =
  "w-full rounded-xl border-2 border-gray-300/60 bg-white/80 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-50";

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-center font-serif text-sm font-bold uppercase tracking-[0.25em] text-[#b8860b]">
      {children}
    </h2>
  );
}
