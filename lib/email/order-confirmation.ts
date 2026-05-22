import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  await resend.emails.send({
    from: "ТИТЭМ <onboarding@resend.dev>",
    to: email,
    subject: "🍯 ТИТЭМ - Захиалга баталгаажлаа",
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
