const PRODUCT_NAME = "Олон цэцгийн 100% цэвэр зөгийн бал";

type OrderConfirmationParams = {
  to: string;
  name: string;
  orderId: string;
  quantityKg: number;
  amount: number;
  address: string;
};

function formatOrderNumber(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function formatMNT(amount: number) {
  return `${amount.toLocaleString("mn-MN")}₮`;
}

function buildConfirmationBody(params: OrderConfirmationParams) {
  const orderNumber = formatOrderNumber(params.orderId);
  return `Сайн байна уу ${params.name}!
Таны захиалга баталгаажлаа.
Захиалгын дугаар: ${orderNumber}
Бүтээгдэхүүн: ${PRODUCT_NAME} ${params.quantityKg}кг
Дүн: ${formatMNT(params.amount)}
Хүргэлтийн хаяг: ${params.address}
Удахгүй хүргэлт хийгдэх болно. Баярлалаа!`;
}

export async function sendOrderConfirmationEmail(
  params: OrderConfirmationParams,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "ТИТЭМ <onboarding@resend.dev>";

  const subject = "🍯 ТИТЭМ - Захиалга баталгаажлаа";
  const text = buildConfirmationBody(params);

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping confirmation email to", params.to);
    console.info("Email preview:\n", text);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Confirmation email failed:", errorBody);
    throw new Error("Баталгаажуулах имэйл илгээхэд алдаа гарлаа");
  }
}
