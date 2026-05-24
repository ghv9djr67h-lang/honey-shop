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
    <div className="luxury-bg luxury-honeycomb relative min-h-full">
      <LuxuryBackdrop />
      <SideDecorations />

      {/* ─── SECTION 1: HERO ─── */}
      <section
        id="hero"
        className="section-reveal relative flex min-h-screen flex-col"
      >
        <div className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 sm:py-8">
          <button
            type="button"
            onClick={() => scrollTo("hero")}
            className="font-display text-xl font-semibold tracking-[0.25em] text-[#f5d57a] sm:text-2xl"
          >
            ТИТЭМ
          </button>

          <div className="relative">
            <button
              type="button"
              aria-label="Цэс нээх"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-[rgba(200,168,75,0.3)] transition hover:border-[rgba(200,168,75,0.6)]"
            >
              <span className={`block h-0.5 w-5 bg-[#f5d57a] transition ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-5 bg-[#f5d57a] transition ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 bg-[#f5d57a] transition ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>

            {menuOpen && (
              <div className="glass-card absolute right-0 top-12 min-w-[180px] rounded-xl py-2 shadow-xl">
                <button type="button" onClick={() => scrollTo("products")} className="block w-full px-4 py-2.5 text-left font-body text-sm tracking-[2px] text-[rgba(220,200,150,0.85)] hover:text-[#f5d57a]">
                  Бүтээгдэхүүн
                </button>
                <button type="button" onClick={() => scrollTo("features")} className="block w-full px-4 py-2.5 text-left font-body text-sm tracking-[2px] text-[rgba(220,200,150,0.85)] hover:text-[#f5d57a]">
                  Давуу тал
                </button>
                {step >= 2 && (
                  <button type="button" onClick={() => scrollTo("checkout-section")} className="block w-full px-4 py-2.5 text-left font-body text-sm tracking-[2px] text-[rgba(220,200,150,0.85)] hover:text-[#f5d57a]">
                    Захиалга
                  </button>
                )}
                <Link
                  href="/admin/login"
                  className="block px-4 py-2.5 text-left font-body text-sm tracking-[2px] text-[rgba(200,168,75,0.6)] hover:text-[#f5d57a]"
                  onClick={() => setMenuOpen(false)}
                >
                  Нэвтрэх
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-12 px-6 pb-24 pt-4 sm:flex-row sm:items-center sm:gap-16 sm:px-10 sm:pb-32">
          <div className="flex-1 text-center sm:text-left">
            <p className="font-body text-xs tracking-[5px] text-[rgba(200,168,75,0.7)] uppercase">
              Premium Artisan Honey
            </p>
            <h1 className="font-display mt-4 text-[clamp(2rem,6vw,3.5rem)] font-bold leading-tight tracking-[3px] gold-gradient-text">
              ТИТЭМ ЦЭВЭР ЗӨГИЙН БАЛ
            </h1>
            <p className="font-body mt-6 max-w-lg text-lg tracking-[2px] text-[rgba(220,200,150,0.85)] sm:text-xl">
              {PRODUCT_NAME}
            </p>
            <p className="font-body mt-3 text-sm tracking-[3px] text-[rgba(200,168,75,0.65)] sm:text-base">
              {SUBTITLE}
            </p>
          </div>

          <div className="relative flex flex-1 items-center justify-center">
            <HoneyJarIllustration />
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollTo("products")}
          aria-label="Доош гүйлгэх"
          className="scroll-bounce absolute bottom-8 left-1/2 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-[rgba(200,168,75,0.4)] text-[#f5d57a] transition hover:border-[#f5d57a] hover:bg-[rgba(200,168,75,0.1)]"
        >
          ↓
        </button>
      </section>

      <GoldOrnament label="◆" />

      {/* ─── SECTION 2: PRODUCT SELECTION ─── */}
      <section id="products" className="section-reveal section-reveal-delay-1 relative z-10 px-4 py-20 sm:px-6">
        <p className="mb-12 text-center font-body text-xs font-semibold tracking-[5px] text-[#f5d57a]">
          → СОНГОХ ХЭМЖЭЭ ←
        </p>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-5">
          {PRODUCTS.map((product) => {
            const selected = selectedKg === product.kg;
            return (
              <div
                key={product.kg}
                className={`product-card glass-card relative flex flex-col rounded-2xl p-5 sm:p-6 ${
                  selected ? "selected" : ""
                } ${product.popular && !selected ? "popular" : ""}`}
              >
                {product.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full gold-gradient-bg px-3 py-1 font-body text-[9px] font-bold tracking-[3px] text-[#0d0b2e] sm:text-[10px]">
                    ИХ ХАМГИЙН ИХ СОНГОЛТ
                  </span>
                )}

                <p className="text-center font-display text-3xl font-bold tracking-[2px] text-[#f5d57a] sm:text-4xl">
                  {product.label}
                </p>
                <p className="mt-1 text-center font-body text-lg font-semibold tracking-[2px] text-[#e8b84b]">
                  {formatMNT(product.price)}
                </p>

                <div
                  id={product.imageId}
                  className="mx-auto my-6 flex h-36 w-full max-w-[140px] items-center justify-center rounded-xl border border-[rgba(200,168,75,0.2)] bg-[rgba(255,255,255,0.04)]"
                >
                  <span className="text-4xl opacity-40">🍯</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedKg(product.kg)}
                  className={`mt-auto w-full rounded-xl py-3 font-body text-sm font-bold tracking-[3px] transition ${
                    selected
                      ? "gold-btn shadow-lg shadow-[rgba(245,213,122,0.25)]"
                      : "border border-[rgba(200,168,75,0.3)] bg-[rgba(255,255,255,0.05)] text-[#f5d57a] hover:border-[rgba(200,168,75,0.55)]"
                  }`}
                >
                  СОНГОХ
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <GoldOrnament label="◆" />

      {/* ─── SECTION 3: FEATURES ─── */}
      <section id="features" className="section-reveal section-reveal-delay-2 relative z-10 px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass-card rounded-2xl p-6 transition hover:border-[rgba(200,168,75,0.35)]"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-display mt-4 text-lg font-semibold tracking-[2px] text-[#f5d57a]">
                {f.title}
              </h3>
              <p className="font-body mt-2 text-sm leading-relaxed tracking-[1px] text-[rgba(220,200,150,0.75)]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-4 sm:px-6">
          <div className="rounded-xl border border-red-400/40 bg-red-950/30 px-5 py-4 font-body text-sm text-red-300">
            {error}
          </div>
        </div>
      )}

      {/* ─── SECTION 4: STICKY ORDER BUTTON ─── */}
      {step === 1 && (
        <div className="bottom-bar fixed bottom-0 left-0 right-0 z-50 p-4">
          <button
            type="button"
            onClick={handleOrder}
            disabled={isSubmitting}
            className="btn-pulse gold-btn mx-auto block w-full max-w-5xl rounded-xl py-4 font-body text-sm font-bold sm:text-base"
          >
            {isSubmitting
              ? "ИЛГЭЭЖ БАЙНА..."
              : `ЗАХИАЛАХ — ${formatMNT(totalAmount)} →`}
          </button>
        </div>
      )}

      <GoldOrnament label="◆" />

      {/* ─── SECTION 5: CHECKOUT (3 columns) ─── */}
      {step >= 2 && (
        <section
          id="checkout-section"
          className="section-reveal section-reveal-delay-3 relative z-10 border-t border-[rgba(200,168,75,0.2)] px-4 py-16 pb-28 sm:px-6 sm:py-20"
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
      <footer className={`relative z-10 border-t border-[rgba(200,168,75,0.2)] px-4 py-10 text-center ${step === 1 ? "pb-28" : ""}`}>
        <span className="mb-3 block text-xl">🐝</span>
        <p className="font-body text-xs tracking-[2px] text-[rgba(200,168,75,0.5)]">
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
      className={`checkout-col glass-card rounded-2xl p-6 ${
        active ? "active" : done ? "done" : ""
      }`}
    >
      <p className="mb-1 font-body text-[10px] font-bold tracking-[5px] text-[rgba(200,168,75,0.6)]">
        01
      </p>
      <h2 className="mb-6 font-display text-xl font-semibold tracking-[3px] text-[#f5d57a]">
        ТӨЛБӨР ТӨЛӨХ
      </h2>

      {done && (
        <div className="mb-4 rounded-lg border border-[rgba(200,168,75,0.35)] bg-[rgba(200,168,75,0.1)] px-4 py-3 text-center font-body text-sm tracking-[2px] text-[#f5d57a]">
          ✓ Төлбөр баталгаажсан
        </div>
      )}

      <div className="mb-5 flex rounded-lg border border-[rgba(200,168,75,0.2)] bg-[rgba(255,255,255,0.04)] p-1">
        <button
          type="button"
          onClick={() => setTab("qpay")}
          className={`flex-1 rounded-md py-2 font-body text-[10px] font-bold tracking-[3px] transition sm:text-xs ${
            tab === "qpay"
              ? "gold-gradient-bg text-[#0d0b2e]"
              : "text-[rgba(200,168,75,0.7)] hover:text-[#f5d57a]"
          }`}
        >
          QPAY QR
        </button>
        <button
          type="button"
          onClick={() => setTab("bank")}
          className={`flex-1 rounded-md py-2 font-body text-[10px] font-bold tracking-[3px] transition sm:text-xs ${
            tab === "bank"
              ? "gold-gradient-bg text-[#0d0b2e]"
              : "text-[rgba(200,168,75,0.7)] hover:text-[#f5d57a]"
          }`}
        >
          БАНК ШИЛЖҮҮЛЭГ
        </button>
      </div>

      {tab === "qpay" ? (
        <>
          <div className="mx-auto mb-4 flex h-40 w-40 items-center justify-center rounded-xl border border-dashed border-[rgba(200,168,75,0.3)] bg-[rgba(13,11,46,0.5)]">
            <div className="text-center">
              <div className="mx-auto mb-2 grid h-14 w-14 grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${i % 2 === 0 ? "bg-[#e8b84b]" : "bg-[#c8a84b]"}`}
                  />
                ))}
              </div>
              <p className="font-body text-[10px] tracking-[2px] text-[rgba(200,168,75,0.6)]">QR код</p>
            </div>
          </div>

          <p className="mb-3 text-center font-display text-2xl font-bold tracking-[2px] gold-gradient-text">
            {formatMNT(totalAmount)}
          </p>

          <button type="button" className="gold-btn w-full rounded-xl py-3 font-body text-sm font-bold">
            QPay-аар төлөх
          </button>
        </>
      ) : (
        <div className="space-y-3 font-body text-sm tracking-[1px]">
          <div className="flex justify-between gap-2">
            <span className="text-[rgba(220,200,150,0.6)]">Данс</span>
            <span className="font-mono font-semibold text-[rgba(220,200,150,0.9)]">{BANK_ACCOUNT}</span>
          </div>
          <div className="flex justify-between gap-2 border-t border-[rgba(200,168,75,0.15)] pt-3">
            <span className="text-[rgba(220,200,150,0.6)]">Дүн</span>
            <span className="font-display text-xl font-bold gold-gradient-text">
              {formatMNT(totalAmount)}
            </span>
          </div>
          <p className="rounded-lg border border-[rgba(200,168,75,0.3)] bg-[rgba(200,168,75,0.08)] px-3 py-2 text-center text-xs tracking-[2px] text-[#f5d57a]">
            Яг {formatMNT(totalAmount)} шилжүүлнэ үү
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-[rgba(200,168,75,0.2)] bg-[rgba(13,11,46,0.4)] px-4 py-3">
        {active && (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[rgba(200,168,75,0.3)] border-t-[#f5d57a]" />
        )}
        <p className="font-body text-xs tracking-[2px] text-[rgba(200,168,75,0.85)]">
          {active
            ? `${formatCountdown(secondsLeft)} Төлбөр хүлээж байна...`
            : done
              ? "Төлбөр амжилттай"
              : "—"}
        </p>
      </div>

      {orderId && (
        <p className="mt-3 text-center font-body text-[10px] tracking-[2px] text-[rgba(200,168,75,0.45)]">
          #{formatOrderNumber(orderId)} · {selectedKg}кг
        </p>
      )}

      {active && (
        <div className="mt-4 rounded-lg border border-dashed border-[rgba(200,168,75,0.15)] p-3">
          <p className="mb-2 text-center font-body text-[10px] tracking-[2px] text-[rgba(200,168,75,0.35)]">🧪 Зөвхөн тест</p>
          <button
            type="button"
            onClick={onSkipPaymentTest}
            className="w-full rounded-lg border border-[rgba(200,168,75,0.2)] py-2 font-body text-xs tracking-[2px] text-[rgba(220,200,150,0.55)] transition hover:border-[rgba(200,168,75,0.45)] hover:text-[#f5d57a]"
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
      className={`checkout-col glass-card rounded-2xl p-6 ${
        active ? "active" : done ? "done" : ""
      }`}
    >
      <p className="mb-1 font-body text-[10px] font-bold tracking-[5px] text-[rgba(200,168,75,0.6)]">
        02
      </p>
      <h2 className="mb-6 font-display text-xl font-semibold tracking-[3px] text-[#f5d57a]">
        ХҮРГЭЛТИЙН МЭДЭЭЛЭЛ
      </h2>

      {done && (
        <div className="mb-4 rounded-lg border border-[rgba(200,168,75,0.35)] bg-[rgba(200,168,75,0.1)] px-4 py-3 text-center font-body text-sm tracking-[2px] text-[#f5d57a]">
          ✓ Мэдээлэл илгээгдсэн
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block font-body text-xs font-medium tracking-[2px] text-[rgba(200,168,75,0.8)]">
            Нэр *
          </span>
          <input
            type="text"
            required
            disabled={!active}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Таны нэр"
            className="dark-input w-full rounded-xl px-4 py-3 font-body text-sm tracking-[1px]"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-body text-xs font-medium tracking-[2px] text-[rgba(200,168,75,0.8)]">
            Утасны дугаар *
          </span>
          <input
            type="tel"
            required
            disabled={!active}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="9911xxxx"
            className="dark-input w-full rounded-xl px-4 py-3 font-body text-sm tracking-[1px]"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-body text-xs font-medium tracking-[2px] text-[rgba(200,168,75,0.8)]">
            И-мэйл
          </span>
          <input
            type="email"
            disabled={!active}
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="И-мэйл (заавал биш)"
            className="dark-input w-full rounded-xl px-4 py-3 font-body text-sm tracking-[1px]"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-body text-xs font-medium tracking-[2px] text-[rgba(200,168,75,0.8)]">
            Хаяг *
          </span>
          <textarea
            required
            rows={3}
            disabled={!active}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Хот, дүүрэг, хороо, байр, тоот..."
            className="dark-input w-full resize-none rounded-xl px-4 py-3 font-body text-sm tracking-[1px]"
          />
        </label>

        <button
          type="submit"
          disabled={!active || isSubmitting}
          className="gold-btn w-full rounded-xl py-3.5 font-body text-sm font-bold"
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
      className={`checkout-col glass-card rounded-2xl p-6 ${
        active ? "active" : ""
      }`}
    >
      <p className="mb-1 font-body text-[10px] font-bold tracking-[5px] text-[rgba(200,168,75,0.6)]">
        03
      </p>
      <h2 className="mb-6 font-display text-xl font-semibold tracking-[3px] text-[#f5d57a]">
        ЗАХИАЛГА АМЖИЛТТАЙ
      </h2>

      {active ? (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="check-animate mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#f5d57a] bg-[rgba(200,168,75,0.12)] text-3xl text-[#f5d57a] shadow-[0_0_40px_rgba(245,213,122,0.25)]">
            ✓
          </div>
          <p className="font-display text-lg tracking-[2px] text-[rgba(220,200,150,0.9)]">
            Таны захиалга амжилттай баталгаажлаа!
          </p>
          {orderId && (
            <p className="mt-4 font-mono text-sm tracking-[4px] text-[#e8b84b]">
              #{formatOrderNumber(orderId)}
            </p>
          )}
          <button
            type="button"
            onClick={onGoHome}
            className="gold-btn mt-8 w-full rounded-xl py-3.5 font-body text-sm font-bold"
          >
            НҮҮР ХУУДАС РУУ
          </button>
        </div>
      ) : (
        <p className="py-8 text-center font-body text-sm tracking-[2px] text-[rgba(200,168,75,0.35)]">
          Захиалга дууссаны дараа энд харагдана
        </p>
      )}
    </div>
  );
}

/* ─── Decorative components ─── */

const STAR_POSITIONS = [
  { top: "8%", left: "12%", delay: "0s" },
  { top: "15%", left: "78%", delay: "0.8s" },
  { top: "32%", left: "5%", delay: "1.4s" },
  { top: "45%", left: "92%", delay: "0.3s" },
  { top: "58%", left: "18%", delay: "2s" },
  { top: "72%", left: "85%", delay: "1.1s" },
  { top: "88%", left: "45%", delay: "0.5s" },
  { top: "22%", left: "55%", delay: "1.7s" },
  { top: "65%", left: "62%", delay: "2.3s" },
  { top: "40%", left: "35%", delay: "0.9s" },
];

function LuxuryBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="glow-orb-purple absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full" />
      <div className="glow-orb-navy absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full" />
      <div className="glow-orb-gold absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      {STAR_POSITIONS.map((star, i) => (
        <span
          key={i}
          className="star-dot"
          style={{
            top: star.top,
            left: star.left,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}

function SideDecorations() {
  return (
    <>
      <div className="side-deco left-4 hidden lg:flex">
        <div className="side-deco-line" />
        <span className="side-deco-hex">⬡</span>
        <div className="side-deco-line" />
      </div>
      <div className="side-deco right-4 hidden lg:flex">
        <div className="side-deco-line" />
        <span className="side-deco-hex">⬡</span>
        <div className="side-deco-line" />
      </div>
    </>
  );
}

function GoldOrnament({ label }: { label: string }) {
  return (
    <div className="gold-ornament relative z-10 py-6">
      <span className="gold-ornament-diamond">{label}</span>
    </div>
  );
}

function HoneyJarIllustration() {
  return (
    <div id="hero-image" className="relative jar-float">
      <span className="sparkle sparkle-1 absolute -left-4 top-8 text-lg text-[#f5d57a]">✦</span>
      <span className="sparkle sparkle-2 absolute -right-2 top-16 text-sm text-[#e8b84b]">✦</span>
      <span className="sparkle sparkle-3 absolute bottom-20 -left-6 text-base text-[#f5d57a]">✦</span>
      <span className="sparkle sparkle-4 absolute bottom-8 right-0 text-lg text-[#c8a84b]">✦</span>

      <svg
        viewBox="0 0 200 280"
        className="h-64 w-52 drop-shadow-[0_0_40px_rgba(245,213,122,0.25)] sm:h-80 sm:w-64"
        aria-hidden
      >
        <defs>
          <linearGradient id="jarGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
          <linearGradient id="honeyFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5d57a" />
            <stop offset="50%" stopColor="#e8b84b" />
            <stop offset="100%" stopColor="#c8a84b" />
          </linearGradient>
          <linearGradient id="lidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c8a84b" />
            <stop offset="100%" stopColor="#8a6a2b" />
          </linearGradient>
        </defs>

        {/* Jar body */}
        <path
          d="M 55 90 L 50 240 Q 50 265 100 265 Q 150 265 150 240 L 145 90 Z"
          fill="url(#jarGlass)"
          stroke="rgba(200,168,75,0.5)"
          strokeWidth="2"
        />
        {/* Honey fill */}
        <path
          d="M 58 140 L 54 238 Q 54 258 100 258 Q 146 258 146 238 L 142 140 Z"
          fill="url(#honeyFill)"
          opacity="0.9"
        />
        {/* Lid */}
        <rect x="48" y="72" width="104" height="22" rx="4" fill="url(#lidGrad)" stroke="rgba(200,168,75,0.6)" strokeWidth="1.5" />
        <rect x="88" y="58" width="24" height="16" rx="3" fill="url(#lidGrad)" stroke="rgba(200,168,75,0.5)" strokeWidth="1" />
        {/* Label band */}
        <rect x="62" y="175" width="76" height="36" rx="2" fill="rgba(13,11,46,0.5)" stroke="rgba(200,168,75,0.4)" strokeWidth="1" />
        <text x="100" y="192" textAnchor="middle" fill="#f5d57a" fontSize="8" fontFamily="serif" letterSpacing="2">
          ТИТЭМ
        </text>
        <text x="100" y="204" textAnchor="middle" fill="rgba(220,200,150,0.8)" fontSize="5" fontFamily="serif">
          ЗӨГИЙН БАЛ
        </text>
        {/* Honey drip */}
        <ellipse cx="100" cy="268" rx="8" ry="4" fill="#e8b84b" opacity="0.7" />
        <path
          className="honey-drip"
          d="M 100 265 Q 100 278 100 285 Q 95 290 100 295 Q 105 290 100 285 Q 100 278 100 265"
          fill="#f5d57a"
          opacity="0.85"
        />
        {/* Shine */}
        <path d="M 68 110 Q 72 180 70 220" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
