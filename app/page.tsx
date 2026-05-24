"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const PRODUCTS = [
  { kg: 1, price: 39000, label: "1кг", imageId: "product-1kg", popular: false },
  { kg: 2, price: 78000, label: "2кг", imageId: "product-2kg", popular: true },
  { kg: 3, price: 117000, label: "3кг", imageId: "product-3kg", popular: false },
];

const PRODUCT_NAME = "Уулын олон цэцгийн 100% цэвэр зөгийн бал";
const SUBTITLE = "Өвөр Монголын байгалийн бэлэг";

const FEATURES = [
  {
    icon: "🍯",
    title: "100% Байгалийн цэвэр",
    desc: "Химийн бодис, нэмлэгүй цэвэр зөгийн бал",
  },
  {
    icon: "📦",
    title: "Өвөр Монголоос шууд",
    desc: "Шууд үйлдвэрүүнээс найдвартай хүргэнэ",
  },
  {
    icon: "🚚",
    title: "УБ хотод үнэгүй хүргэлт",
    desc: "Таны цагийг хэмнэж, үнэгүй хүргэж өгнө",
  },
] as const;

const BANK_ACCOUNT =
  process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "[BANK_ACCOUNT_PLACEHOLDER]";

const POLL_INTERVAL_MS = 3000;
const PAYMENT_TIMEOUT_SEC = 600;

type Step = 1 | 2 | 3 | 4;
type PaymentTab = "qpay" | "bank";

function formatMNT(amount: number) {
  return `${amount.toLocaleString("mn-MN")}₮`;
}

function formatOrderNumber(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [selectedKg, setSelectedKg] = useState<number>(2);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSecondsLeft, setPaymentSecondsLeft] = useState(PAYMENT_TIMEOUT_SEC);

  const totalAmount = useMemo(
    () => PRODUCTS.find((p) => p.kg === selectedKg)?.price ?? 0,
    [selectedKg],
  );

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }, []);

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
          scrollTo("checkout-section");
        }
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
  }, [step, orderId, scrollTo]);

  useEffect(() => {
    if (step !== 2) return;

    setPaymentSecondsLeft(PAYMENT_TIMEOUT_SEC);
    const timer = setInterval(() => {
      setPaymentSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, orderId]);

  async function handleOrder() {
    if (step !== 1) return;
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
      setTimeout(() => scrollTo("checkout-section"), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeliverySubmit(e: React.FormEvent) {
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

  function handleGoHome() {
    setStep(1);
    setOrderId("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setDeliveryAddress("");
    setError(null);
    scrollTo("hero");
  }

  return (
    <div className="relative min-h-full bg-[#0A0A0A]">
      {/* ─── SECTION 1: HERO ─── */}
      <section
        id="hero"
        className="relative flex min-h-screen flex-col bg-[#0A0A0A]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#111111] via-[#0A0A0A] to-[#0A0A0A]" />

        <div className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 sm:py-8">
          <button
            type="button"
            onClick={() => scrollTo("hero")}
            className="font-serif text-xl font-bold tracking-[0.2em] text-[#E8A020] sm:text-2xl"
          >
            ТИТЭМ
          </button>

          <div className="relative">
            <button
              type="button"
              aria-label="Цэс нээх"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-[#C9A084]/30 transition hover:border-[#E8A020]/60"
            >
              <span className={`block h-0.5 w-5 bg-[#E8A020] transition ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-5 bg-[#E8A020] transition ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 bg-[#E8A020] transition ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 min-w-[180px] rounded-xl border border-[#C9A084]/25 bg-[#1A1A1A] py-2 shadow-xl">
                <button type="button" onClick={() => scrollTo("products")} className="block w-full px-4 py-2.5 text-left text-sm text-white/80 hover:text-[#F4C842]">
                  Бүтээгдэхүүн
                </button>
                <button type="button" onClick={() => scrollTo("features")} className="block w-full px-4 py-2.5 text-left text-sm text-white/80 hover:text-[#F4C842]">
                  Давуу тал
                </button>
                {step >= 2 && (
                  <button type="button" onClick={() => scrollTo("checkout-section")} className="block w-full px-4 py-2.5 text-left text-sm text-white/80 hover:text-[#F4C842]">
                    Захиалга
                  </button>
                )}
                <Link
                  href="/admin/login"
                  className="block px-4 py-2.5 text-left text-sm text-[#C9A084]/60 hover:text-[#F4C842]"
                  onClick={() => setMenuOpen(false)}
                >
                  Нэвтрэх
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 mx-auto flex flex-1 w-full max-w-6xl flex-col items-center gap-10 px-6 pb-24 pt-4 sm:flex-row sm:items-center sm:gap-16 sm:px-10 sm:pb-32">
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-serif text-[clamp(4rem,15vw,9rem)] font-bold leading-[0.9] tracking-tight gold-gradient-text">
              ТИТЭМ
            </h1>
            <p className="mt-6 max-w-lg font-serif text-lg text-white/90 sm:text-xl">
              {PRODUCT_NAME}
            </p>
            <p className="mt-3 text-sm tracking-wide text-[#C9A084]/80 sm:text-base">
              {SUBTITLE}
            </p>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div
              id="hero-image"
              className="gold-shimmer relative flex h-64 w-64 items-center justify-center rounded-2xl border border-[#C9A084]/30 sm:h-80 sm:w-80"
            >
              <span className="text-6xl opacity-40">🥄</span>
              <p className="absolute bottom-4 text-[10px] uppercase tracking-widest text-[#C9A084]/50">
                Зураг оруулах
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollTo("products")}
          aria-label="Доош гүйлгэх"
          className="scroll-bounce absolute bottom-8 left-1/2 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-[#C9A084]/40 text-[#E8A020] transition hover:border-[#E8A020] hover:bg-[#E8A020]/10"
        >
          ↓
        </button>
      </section>

      {/* ─── SECTION 2: PRODUCT SELECTION ─── */}
      <section id="products" className="bg-[#111111] px-4 py-20 sm:px-6">
        <p className="mb-12 text-center text-xs font-semibold tracking-[0.35em] text-[#E8A020]">
          → СОНГОХ ХЭМЖЭЭ ←
        </p>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-5">
          {PRODUCTS.map((product) => {
            const selected = selectedKg === product.kg;
            return (
              <div
                key={product.kg}
                className={`product-card relative flex flex-col rounded-2xl bg-[#1A1A1A] p-5 sm:p-6 ${
                  selected ? "selected" : ""
                } ${product.popular && !selected ? "popular" : ""}`}
              >
                {product.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#F4C842] to-[#E8A020] px-3 py-1 text-[9px] font-bold tracking-wide text-[#0A0A0A] sm:text-[10px]">
                    ИХ ХАМГИЙН ИХ СОНГОЛТ
                  </span>
                )}

                <p className="text-center font-serif text-3xl font-bold text-[#F4C842] sm:text-4xl">
                  {product.label}
                </p>
                <p className="mt-1 text-center text-lg font-semibold text-[#E8A020]">
                  {formatMNT(product.price)}
                </p>

                <div
                  id={product.imageId}
                  className="gold-shimmer mx-auto my-6 flex h-36 w-full max-w-[140px] items-center justify-center rounded-xl border border-[#C9A084]/20"
                >
                  <span className="text-4xl opacity-30">🍯</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedKg(product.kg)}
                  className={`mt-auto w-full rounded-xl py-3 text-sm font-bold tracking-wider transition ${
                    selected
                      ? "gold-gradient-bg text-[#0A0A0A] shadow-lg shadow-[#E8A020]/25"
                      : "border border-[#C9A084]/40 bg-[#1C1C1C] text-[#F4C842] hover:border-[#E8A020]/60"
                  }`}
                >
                  СОНГОХ
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── SECTION 3: FEATURES ─── */}
      <section id="features" className="bg-[#0A0A0A] px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[#C9A084]/25 bg-[#1A1A1A] p-6 transition hover:border-[#E8A020]/50 hover:shadow-[0_0_24px_rgba(232,160,32,0.12)]"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-[#F4C842]">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-6">
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        </div>
      )}

      {/* ─── SECTION 4: STICKY ORDER BUTTON ─── */}
      {step === 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#C9A084]/20 bg-[#0A0A0A]/95 p-4 backdrop-blur-md">
          <button
            type="button"
            onClick={handleOrder}
            disabled={isSubmitting}
            className="btn-pulse gold-btn mx-auto block w-full max-w-5xl rounded-xl py-4 text-sm font-bold tracking-[0.15em] text-[#0A0A0A] sm:text-base"
          >
            {isSubmitting
              ? "ИЛГЭЭЖ БАЙНА..."
              : `ЗАХИАЛАХ — ${formatMNT(totalAmount)} →`}
          </button>
        </div>
      )}

      {/* ─── SECTION 5: CHECKOUT (3 columns) ─── */}
      {step >= 2 && (
        <section
          id="checkout-section"
          className="border-t border-[#C9A084]/15 bg-[#111111] px-4 py-16 pb-28 sm:px-6 sm:py-20"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
            <PaymentColumn
              active={step === 2}
              done={step > 2}
              orderId={orderId}
              selectedKg={selectedKg}
              totalAmount={totalAmount}
              secondsLeft={paymentSecondsLeft}
              onSkipPaymentTest={() => setStep(3)}
            />

            <DeliveryColumn
              active={step === 3}
              done={step > 3}
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              customerEmail={customerEmail}
              setCustomerEmail={setCustomerEmail}
              deliveryAddress={deliveryAddress}
              setDeliveryAddress={setDeliveryAddress}
              isSubmitting={isSubmitting}
              onSubmit={handleDeliverySubmit}
            />

            <SuccessColumn
              active={step === 4}
              orderId={orderId}
              onGoHome={handleGoHome}
            />
          </div>
        </section>
      )}

      {/* ─── FOOTER ─── */}
      <footer className={`border-t border-[#C9A084]/10 bg-[#0A0A0A] px-4 py-10 text-center ${step === 1 ? "pb-28" : ""}`}>
        <span className="mb-3 block text-xl">🐝</span>
        <p className="text-xs text-white/40">
          © 2026 ТИТЭМ. Бүх эрх хуулиар хамгаалагдсан.
        </p>
      </footer>
    </div>
  );
}

/* ─── Payment Column ─── */

function PaymentColumn({
  active,
  done,
  orderId,
  selectedKg,
  totalAmount,
  secondsLeft,
  onSkipPaymentTest,
}: {
  active: boolean;
  done: boolean;
  orderId: string;
  selectedKg: number;
  totalAmount: number;
  secondsLeft: number;
  onSkipPaymentTest: () => void;
}) {
  const [tab, setTab] = useState<PaymentTab>("qpay");

  return (
    <div
      className={`checkout-col rounded-2xl border border-[#C9A084]/25 bg-[#1A1A1A] p-6 ${
        active ? "active" : done ? "done" : ""
      }`}
    >
      <p className="mb-1 text-[10px] font-bold tracking-[0.3em] text-[#C9A084]/60">
        01
      </p>
      <h2 className="mb-6 font-serif text-xl font-semibold text-[#F4C842]">
        ТӨЛБӨР ТӨЛӨХ
      </h2>

      {done && (
        <div className="mb-4 rounded-lg border border-[#E8A020]/30 bg-[#E8A020]/10 px-4 py-3 text-center text-sm text-[#F4C842]">
          ✓ Төлбөр баталгаажсан
        </div>
      )}

      <div className="mb-5 flex rounded-lg border border-[#C9A084]/20 p-1">
        <button
          type="button"
          onClick={() => setTab("qpay")}
          className={`flex-1 rounded-md py-2 text-[10px] font-bold tracking-wider transition sm:text-xs ${
            tab === "qpay"
              ? "gold-gradient-bg text-[#0A0A0A]"
              : "text-[#C9A084]/70 hover:text-[#F4C842]"
          }`}
        >
          QPAY QR
        </button>
        <button
          type="button"
          onClick={() => setTab("bank")}
          className={`flex-1 rounded-md py-2 text-[10px] font-bold tracking-wider transition sm:text-xs ${
            tab === "bank"
              ? "gold-gradient-bg text-[#0A0A0A]"
              : "text-[#C9A084]/70 hover:text-[#F4C842]"
          }`}
        >
          БАНК ШИЛЖҮҮЛЭГ
        </button>
      </div>

      {tab === "qpay" ? (
        <>
          <div className="mx-auto mb-4 flex h-40 w-40 items-center justify-center rounded-xl border border-dashed border-[#C9A084]/30 bg-[#111111]">
            <div className="text-center">
              <div className="mx-auto mb-2 grid h-14 w-14 grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${i % 2 === 0 ? "bg-[#E8A020]" : "bg-[#C9A084]"}`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-[#C9A084]/60">QR код</p>
            </div>
          </div>

          <p className="mb-3 text-center font-serif text-2xl font-bold gold-gradient-text">
            {formatMNT(totalAmount)}
          </p>

          <button type="button" className="gold-btn w-full rounded-xl py-3 text-sm font-bold text-[#0A0A0A]">
            QPay-аар төлөх
          </button>
        </>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-white/50">Данс</span>
            <span className="font-mono font-semibold text-white">{BANK_ACCOUNT}</span>
          </div>
          <div className="flex justify-between gap-2 border-t border-[#C9A084]/15 pt-3">
            <span className="text-white/50">Дүн</span>
            <span className="font-serif text-xl font-bold gold-gradient-text">
              {formatMNT(totalAmount)}
            </span>
          </div>
          <p className="rounded-lg border border-[#E8A020]/30 bg-[#E8A020]/10 px-3 py-2 text-center text-xs text-[#F4C842]">
            Яг {formatMNT(totalAmount)} шилжүүлнэ үү
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-[#C9A084]/20 bg-[#111111] px-4 py-3">
        {active && (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#C9A084]/30 border-t-[#E8A020]" />
        )}
        <p className="text-xs text-[#C9A084]">
          {active
            ? `${formatCountdown(secondsLeft)} Төлбөр хүлээж байна...`
            : done
              ? "Төлбөр амжилттай"
              : "—"}
        </p>
      </div>

      {orderId && (
        <p className="mt-3 text-center text-[10px] text-[#C9A084]/40">
          #{formatOrderNumber(orderId)} · {selectedKg}кг
        </p>
      )}

      {active && (
        <div className="mt-4 rounded-lg border border-dashed border-white/10 p-3">
          <p className="mb-2 text-center text-[10px] text-white/30">🧪 Зөвхөн тест</p>
          <button
            type="button"
            onClick={onSkipPaymentTest}
            className="w-full rounded-lg border border-white/15 py-2 text-xs text-white/50 transition hover:border-[#E8A020]/40 hover:text-[#F4C842]"
          >
            Төлбөр баталгаажуулах (тест)
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Delivery Column ─── */

function DeliveryColumn({
  active,
  done,
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
  active: boolean;
  done: boolean;
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
    <div
      className={`checkout-col rounded-2xl border border-[#C9A084]/25 bg-[#1A1A1A] p-6 ${
        active ? "active" : done ? "done" : ""
      }`}
    >
      <p className="mb-1 text-[10px] font-bold tracking-[0.3em] text-[#C9A084]/60">
        02
      </p>
      <h2 className="mb-6 font-serif text-xl font-semibold text-[#F4C842]">
        ХҮРГЭЛТИЙН МЭДЭЭЛЭЛ
      </h2>

      {done && (
        <div className="mb-4 rounded-lg border border-[#E8A020]/30 bg-[#E8A020]/10 px-4 py-3 text-center text-sm text-[#F4C842]">
          ✓ Мэдээлэл илгээгдсэн
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[#C9A084]/80">
            Нэр *
          </span>
          <input
            type="text"
            required
            disabled={!active}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Таны нэр"
            className="dark-input w-full rounded-xl px-4 py-3 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[#C9A084]/80">
            Утасны дугаар *
          </span>
          <input
            type="tel"
            required
            disabled={!active}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="9911xxxx"
            className="dark-input w-full rounded-xl px-4 py-3 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[#C9A084]/80">
            И-мэйл
          </span>
          <input
            type="email"
            disabled={!active}
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="И-мэйл (заавал биш)"
            className="dark-input w-full rounded-xl px-4 py-3 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[#C9A084]/80">
            Хаяг *
          </span>
          <textarea
            required
            rows={3}
            disabled={!active}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Хот, дүүрэг, хороо, байр, тоот..."
            className="dark-input w-full resize-none rounded-xl px-4 py-3 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={!active || isSubmitting}
          className="gold-btn w-full rounded-xl py-3.5 text-sm font-bold tracking-wider text-[#0A0A0A]"
        >
          {isSubmitting ? "ИЛГЭЭЖ БАЙНА..." : "ҮРГЭЛЖЛҮҮЛЭХ →"}
        </button>
      </form>
    </div>
  );
}

/* ─── Success Column ─── */

function SuccessColumn({
  active,
  orderId,
  onGoHome,
}: {
  active: boolean;
  orderId: string;
  onGoHome: () => void;
}) {
  return (
    <div
      className={`checkout-col rounded-2xl border border-[#C9A084]/25 bg-[#1A1A1A] p-6 ${
        active ? "active" : ""
      }`}
    >
      <p className="mb-1 text-[10px] font-bold tracking-[0.3em] text-[#C9A084]/60">
        03
      </p>
      <h2 className="mb-6 font-serif text-xl font-semibold text-[#F4C842]">
        ЗАХИАЛГА АМЖИЛТТАЙ
      </h2>

      {active ? (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="check-animate mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#F4C842] bg-[#E8A020]/15 text-3xl text-[#F4C842]">
            ✓
          </div>
          <p className="font-serif text-lg text-white/90">
            Таны захиалга амжилттай баталгаажлаа!
          </p>
          {orderId && (
            <p className="mt-4 font-mono text-sm tracking-widest text-[#E8A020]">
              #{formatOrderNumber(orderId)}
            </p>
          )}
          <button
            type="button"
            onClick={onGoHome}
            className="gold-btn mt-8 w-full rounded-xl py-3.5 text-sm font-bold tracking-wider text-[#0A0A0A]"
          >
            НҮҮР ХУУДАС РУУ
          </button>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-white/30">
          Захиалга дууссаны дараа энд харагдана
        </p>
      )}
    </div>
  );
}
