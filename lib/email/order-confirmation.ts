import { Resend } from "resend";

const FROM = "ТИТЭМ <onboarding@resend.dev>";
const ADMIN_EMAIL = "enhmaa@acnation.net";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY is missing");
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
  logLabel: string;
}) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    if (error) {
      console.error(`[${payload.logLabel}] Resend error:`, error);
      throw new Error(error.message ?? "Resend email failed");
    }

    console.log(`[${payload.logLabel}] Resend success:`, data);
    return data;
  } catch (err) {
    console.error(`[${payload.logLabel}] Exception:`, err);
    throw err;
  }
}

export async function sendOrderConfirmation({
  email,
  name,
  orderId,
  quantity,
  total,
  address,
}: {
  email: string;
  name: string;
  orderId: string;
  quantity: number;
  total: number;
  address: string;
}) {
  console.log("[sendOrderConfirmation] called", {
    email,
    name,
    orderId,
    quantity,
    total,
    hasApiKey: Boolean(process.env.RESEND_API_KEY),
  });

  return sendEmail({
    to: email,
    subject: "🍯 ТИТЭМ - Захиалга баталгаажлаа",
    logLabel: "sendOrderConfirmation",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #d97706;">🍯 ТИТЭМ</h2>
        <p>Сайн байна уу, <strong>${name}</strong>!</p>
        <p>Таны захиалга амжилттай баталгаажлаа.</p>
        <hr/>
        <p><strong>Захиалгын дугаар:</strong> ${orderId.slice(0, 8)}</p>
        <p><strong>Бүтээгдэхүүн:</strong> Олон цэцгийн 100% цэвэр зөгийн бал ${quantity}кг</p>
        <p><strong>Дүн:</strong> ${total.toLocaleString()}₮</p>
        <p><strong>Хүргэлтийн хаяг:</strong> ${address}</p>
        <hr/>
        <p>Удахгүй хүргэлт хийгдэх болно. Баярлалаа! 🙏</p>
        <p style="color: #d97706;"><strong>ТИТЭМ</strong> - Байгалийн цэвэр зөгийн бал</p>
      </div>
    `,
  });
}

export async function sendAdminOrderNotification({
  name,
  phone,
  quantity,
  total,
  address,
  email,
}: {
  name: string;
  phone: string;
  quantity: number;
  total: number;
  address: string;
  email?: string;
}) {
  const emailDisplay = email?.trim() || "имэйл байхгүй";

  console.log("[sendAdminOrderNotification] called", {
    to: ADMIN_EMAIL,
    name,
    phone,
    quantity,
    total,
    email: emailDisplay,
    hasApiKey: Boolean(process.env.RESEND_API_KEY),
  });

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: "🆕 Шинэ захиалга баталгаажлаа",
    logLabel: "sendAdminOrderNotification",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #d97706;">🆕 Шинэ захиалга</h2>
        <p><strong>Захиалагч:</strong> ${name}</p>
        <p><strong>Утас:</strong> ${phone}</p>
        <p><strong>Бүтээгдэхүүн:</strong> ${quantity}кг</p>
        <p><strong>Дүн:</strong> ${total.toLocaleString()}₮</p>
        <p><strong>Хүргэлтийн хаяг:</strong> ${address}</p>
        <p><strong>Имэйл:</strong> ${emailDisplay}</p>
      </div>
    `,
  });
}
