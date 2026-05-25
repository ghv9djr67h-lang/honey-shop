"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SiteContent } from "@/lib/site-content";

const PRODUCTS = [
  { kg: 1, price: 39000, label: "1кг", imageId: "product-1kg", popular: false },
  { kg: 2, price: 78000, label: "2кг", imageId: "product-2kg", popular: true },
  { kg: 3, price: 117000, label: "3кг", imageId: "product-3kg", popular: false },
];

function buildFeatures(content: SiteContent) {
  return [
    {
      id: "pure",
      title: "100% Байгалийн цэвэр",
      desc: content.about_text,
    },
    {
      id: "direct",
      title: "Өвөр Монголоос шууд",
      desc: "Шууд үйлдвэрүүнээс найдвартай хүргэнэ",
    },
    {
      id: "delivery",
      title: "УБ хотод үнэгүй хүргэлт",
      desc: content.delivery_text,
    },
  ] as const;
}

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

export function HomePage({ content }: { content: SiteContent }) {
  const features = useMemo(() => buildFeatures(content), [content]);
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
    <div className="min-h-full bg-[#faf8f4] pb-8 text-[#1a1208]">
      {menuOpen && (
        <button
          type="button"
          aria-label="Цэс хаах"
          className="menu-backdrop"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="page-wrap fade-in">
        {/* Header */}
        <header className="site-header">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => scrollTo("hero")}
                className="site-logo font-display text-[#1a1208]"
              >
                ТИТЭМ
              </button>
              <p className="font-body mt-2 text-xs font-light tracking-[1px] text-[#1a1208] opacity-70 sm:text-sm sm:tracking-[2px]">
                Цэвэр Зөгийн Бал
              </p>
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="Цэс нээх"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center font-body text-xs tracking-[2px] text-[#1a1208] opacity-50 uppercase hover:opacity-100"
              >
                Цэс
              </button>
              {menuOpen && (
                <div className="menu-panel absolute right-0 top-11 z-20 min-w-[180px] py-1">
                  <button type="button" onClick={() => scrollTo("products")} className="block w-full px-4 py-3 text-left font-body text-sm text-[#1a1208] opacity-80 hover:opacity-100">
                    Бүтээгдэхүүн
                  </button>
                  <button type="button" onClick={() => scrollTo("features")} className="block w-full px-4 py-3 text-left font-body text-sm text-[#1a1208] opacity-80 hover:opacity-100">
                    Давуу тал
                  </button>
                  {step >= 2 && (
                    <button type="button" onClick={() => scrollTo("checkout-section")} className="block w-full px-4 py-3 text-left font-body text-sm text-[#1a1208] opacity-80 hover:opacity-100">
                      Захиалга
                    </button>
                  )}
                  <Link href="/admin/login" className="block px-4 py-3 text-left font-body text-sm text-[#1a1208] opacity-50 hover:opacity-100" onClick={() => setMenuOpen(false)}>
                    Нэвтрэх
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <StepIndicator current={step} />

        {/* Hero copy */}
        <section id="hero" className="fade-in">
          <p className="font-body text-sm leading-relaxed break-words text-[#1a1208]">{content.hero_title}</p>
          <p className="font-body mt-2 text-sm font-light leading-relaxed break-words text-[#1a1208] opacity-70">{content.hero_subtitle}</p>
          <p className="font-display mt-4 text-xl text-[#c8740a] sm:text-2xl">{content.hero_price}</p>
          <div id="hero-image" className="mt-6 flex h-40 items-center justify-center border border-[#e8dfd0] bg-white">
            <span className="font-body text-xs tracking-[2px] text-[#1a1208] opacity-40 uppercase">Зураг</span>
          </div>
        </section>

        <hr className="site-divider" />

        {/* Products */}
        <section id="products" className="fade-in space-y-3">
          <p className="font-body text-xs tracking-[2px] text-[#1a1208] opacity-50 uppercase">Сонгох хэмжээ</p>
          {PRODUCTS.map((product) => {
            const selected = selectedKg === product.kg;
            return (
              <div key={product.kg} className={`product-card ${selected ? "selected" : ""}`}>
                {product.popular && (
                  <span className="popular-badge mb-3">Хамгийн их сонголт</span>
                )}
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-2xl text-[#1a1208]">{product.label}</span>
                  <span className="font-body text-lg font-medium text-[#c8740a]">{formatMNT(product.price)}</span>
                </div>
                <div id={product.imageId} className="my-4 flex h-24 items-center justify-center border border-[#e8dfd0] bg-white">
                  <span className="font-body text-xs text-[#1a1208] opacity-40">Зураг</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedKg(product.kg)}
                  className="btn-select !py-3"
                >
                  {selected ? "СОНГОЛТ" : "СОНГОХ"}
                </button>
              </div>
            );
          })}
        </section>

        <hr className="site-divider" />

        {/* Features */}
        <section id="features" className="fade-in grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {features.map((f) => (
            <div key={f.id}>
              <FeatureIcon id={f.id} />
              <h3 className="font-display mt-3 text-base text-[#1a1208]">{f.title}</h3>
              <p className="font-body mt-2 text-[13px] leading-relaxed text-[#1a1208] opacity-75">{f.desc}</p>
            </div>
          ))}
        </section>

        {error && (
          <div className="section-gap rounded border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Sticky order */}
      {step === 1 && (
        <div className="bottom-bar fixed bottom-0 left-0 right-0 z-50 px-4 py-3 sm:px-5 sm:py-4">
          <button type="button" onClick={handleOrder} disabled={isSubmitting} className="btn-primary mx-auto block w-full max-w-[560px]">
            {isSubmitting ? "ИЛГЭЭЖ БАЙНА..." : `ЗАХИАЛАХ — ${formatMNT(totalAmount)} →`}
          </button>
        </div>
      )}

      {/* Checkout */}
      {step >= 2 && (
        <section id="checkout-section" className="page-wrap section-gap fade-in pb-[calc(7rem+env(safe-area-inset-bottom))]">
          <PaymentColumn
            active={step === 2}
            done={step > 2}
            orderId={orderId}
            selectedKg={selectedKg}
            totalAmount={totalAmount}
            secondsLeft={paymentSecondsLeft}
            onSkipPaymentTest={() => setStep(3)}
          />
          <hr className="site-divider" />
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
          <hr className="site-divider" />
          <SuccessColumn active={step === 4} orderId={orderId} selectedKg={selectedKg} totalAmount={totalAmount} productName={content.hero_title} onGoHome={handleGoHome} />
        </section>
      )}

      <footer
        className={`page-wrap section-gap pb-10 text-center ${step === 1 ? "pb-[calc(7rem+env(safe-area-inset-bottom))]" : "pb-[calc(2.5rem+env(safe-area-inset-bottom))]"}`}
      >
        <p className="font-body text-xs text-[#1a1208] opacity-50">
          {content.footer_text}
        </p>
        <p className="font-body mt-3 text-xs text-[#1a1208] opacity-50">
          📞 {content.contact_phone}
        </p>
        <p style={{ fontSize: "12px", color: "#888", marginTop: "16px" }}>
          © 2026 Акүйста нэйшн ХХК. Бүх эрх хуулиар хамгаалагдсан.
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
    <div className={`checkout-col panel-card ${active ? "active" : done ? "done" : ""}`}>
      <p className="field-label mb-1">01 — Төлбөр</p>
      <h2 className="font-display mb-6 text-xl text-[#1a1208]">Төлбөр төлөх</h2>

      {done && (
        <p className="mb-4 font-body text-sm text-[var(--accent)]">✓ Төлбөр баталгаажсан</p>
      )}

      <div className="tab-row mb-6 flex">
        <button type="button" onClick={() => setTab("qpay")} className={`tab-pill ${tab === "qpay" ? "active" : ""}`}>
          QPay QR
        </button>
        <button type="button" onClick={() => setTab("bank")} className={`tab-pill ${tab === "bank" ? "active" : ""}`}>
          Банк шилжүүлэг
        </button>
      </div>

      {tab === "qpay" ? (
        <>
          <div className="mb-6 flex h-40 items-center justify-center rounded border border-[#e8dfd0] bg-white">
            <div className="text-center">
              <div className="mx-auto mb-2 grid h-14 w-14 grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={`${i % 2 === 0 ? "bg-[#e8dfd0]" : "bg-[#f0e8d8]"}`} />
                ))}
              </div>
              <p className="font-body text-xs text-[#1a1208] opacity-50">QR код</p>
            </div>
          </div>
          <p className="mb-4 text-center font-display text-2xl text-[#c8740a]">{formatMNT(totalAmount)}</p>
          <button type="button" className="btn-primary w-full !px-6">QPay-аар төлөх</button>
        </>
      ) : (
        <div className="space-y-3 rounded border border-[#e8dfd0] bg-white p-4 font-body text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-[#1a1208] opacity-60">Данс</span>
            <span className="font-mono text-[#1a1208]">{BANK_ACCOUNT}</span>
          </div>
          <div className="flex justify-between gap-2 border-t border-[#e8dfd0] pt-3">
            <span className="text-[#1a1208] opacity-60">Дүн</span>
            <span className="font-medium text-[#c8740a]">{formatMNT(totalAmount)}</span>
          </div>
          <p className="pt-2 text-center text-xs text-[#1a1208] opacity-70">
            Яг {formatMNT(totalAmount)} шилжүүлнэ үү
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 font-body text-xs text-[#1a1208] opacity-70">
        {active && <span className="inline-block h-3 w-3 animate-spin rounded-full border border-[#e8dfd0] border-t-[#c8740a]" />}
        {active ? `${formatCountdown(secondsLeft)} Төлбөр хүлээж байна...` : done ? "Төлбөр амжилттай" : "—"}
      </div>

      {orderId && (
        <p className="mt-3 font-body text-xs text-[#1a1208] opacity-50">
          #{formatOrderNumber(orderId)} · {selectedKg}кг
        </p>
      )}

      {active && (
        <div className="mt-6 border-t border-[#e8dfd0] pt-4">
          <p className="mb-2 text-center font-body text-xs text-[#1a1208] opacity-40">Зөвхөн тест</p>
          <button type="button" onClick={onSkipPaymentTest} className="btn-secondary w-full !text-xs">
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
    <div className={`checkout-col panel-card ${active ? "active" : done ? "done" : ""}`}>
      <p className="field-label mb-1">02 — Хүргэлт</p>
      <h2 className="font-display mb-6 text-xl text-[#1a1208]">Хүргэлтийн мэдээлэл</h2>

      {done && (
        <p className="mb-4 font-body text-sm text-[var(--accent)]">✓ Мэдээлэл илгээгдсэн</p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="field-label">Нэр *</span>
          <input type="text" required disabled={!active} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Таны нэр" className="field-input" />
        </label>
        <label className="block">
          <span className="field-label">Утасны дугаар *</span>
          <input type="tel" required disabled={!active} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="9911xxxx" className="field-input" />
        </label>
        <label className="block">
          <span className="field-label">И-мэйл</span>
          <input type="email" disabled={!active} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="И-мэйл (заавал биш)" className="field-input" />
        </label>
        <label className="block">
          <span className="field-label">Хаяг *</span>
          <textarea required rows={3} disabled={!active} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Хот, дүүрэг, хороо, байр, тоот..." className="field-input resize-none" />
        </label>
        <button type="submit" disabled={!active || isSubmitting} className="btn-primary w-full">
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
  selectedKg,
  totalAmount,
  productName,
  onGoHome,
}: {
  active: boolean;
  orderId: string;
  selectedKg: number;
  totalAmount: number;
  productName: string;
  onGoHome: () => void;
}) {
  return (
    <div className={`checkout-col panel-card ${active ? "active" : ""}`}>
      {active ? (
        <div>
          <h2 className="checkout-title font-display text-[#1a1208]">Баярлалаа</h2>
          <hr className="site-divider !mt-6 !mb-8" />
          <p className="font-body mb-6 text-sm text-[#1a1208] opacity-75">
            Таны захиалга амжилттай баталгаажлаа
          </p>
          {orderId && (
            <table className="summary-table">
              <tbody>
                <tr>
                  <th>Захиалгын дугаар</th>
                  <td className="font-mono">#{formatOrderNumber(orderId)}</td>
                </tr>
                <tr>
                  <th>Хэмжээ</th>
                  <td>{selectedKg}кг</td>
                </tr>
                <tr>
                  <th>Нийт дүн</th>
                  <td className="font-medium text-[var(--accent)]">{formatMNT(totalAmount)}</td>
                </tr>
                <tr>
                  <th>Бүтээгдэхүүн</th>
                  <td className="text-[#1a1208] opacity-75">{productName}</td>
                </tr>
              </tbody>
            </table>
          )}
          <button type="button" onClick={onGoHome} className="btn-primary mt-8 w-full">
            НҮҮР ХУУДАС РУУ
          </button>
        </div>
      ) : (
        <div>
          <p className="field-label mb-1">03 — Баталгаажуулалт</p>
          <p className="font-body py-8 text-sm text-[#1a1208] opacity-40">
            Захиалга дууссаны дараа энд харагдана
          </p>
        </div>
      )}
    </div>
  );
}

const STEP_LABELS = ["Сонгох", "Төлбөр", "Хүргэлт", "Баярлалаа"] as const;

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="step-row">
      {STEP_LABELS.map((label, i) => {
        const num = (i + 1) as Step;
        const done = num < current;
        const active = num === current;
        return (
          <div key={label} className={`step-node ${done ? "done" : ""}`}>
            <div className={`step-circle ${done ? "done" : ""} ${active ? "active" : ""}`}>
              {done ? "✓" : num}
            </div>
            <span className={`step-name ${active ? "active" : ""}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function FeatureIcon({ id }: { id: string }) {
  const stroke = "#1a1208";
  if (id === "pure") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3C8 8 5 11 5 14a7 7 0 1014 0c0-3-3-6-7-11z" stroke={stroke} strokeWidth="1.5" />
      </svg>
    );
  }
  if (id === "direct") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="8" width="16" height="12" rx="1" stroke={stroke} strokeWidth="1.5" />
        <path d="M4 11h16" stroke={stroke} strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 12h14M13 7l5 5-5 5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
