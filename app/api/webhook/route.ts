import { NextRequest, NextResponse } from "next/server";

const INSTAGRAM_SYSTEM_PROMPT = `Та "ТИТЭМ" зөгийн балын дэлгүүрийн туслах чатбот юм. Зөвхөн монгол хэлээр хариулна.

БҮТЭЭГДЭХҮҮН:
- Нэр: Уулын олон цэцгийн 100% цэвэр зөгийн бал
- Үйлдвэрлэгч: Өвөр Монгол
- 1кг = 39,000₮
- 2кг = 78,000₮
- 3кг = 117,000₮

ШИМ ТЭЖЭЭЛ (100г тутамд):
- Энерги: 1462кЖ (17%)
- Уураг: 0г
- Өөх тос: 0г
- Нүүрс ус: 85.7г (29%)
- Натри: 0мг

ОНЦЛОГ:
- 100% байгалийн цэвэр, химийн бодис агуулаагүй
- Сархинаг (зөгийн балны болорших) нь байгалийн хэвийн үзэгдэл — чанарт нөлөөлдөггүй, хэрэглэхэд аюулгүй
- Шууд үйлдвэрлэгчээс

ЗАХИАЛГА:
- Захиалга өгөхийг хүсвэл honey.acnation.net вэбсайт руу чиглүүлнэ

ХҮРГЭЛТ:
- Улаанбаатар А бүс дотор хүргэлт үнэгүй
- Захиалгийг оройн нь цуглуулж маргааш хүргэлтийн компаниар хийгдэнэ
- Хүргэлтийн хаяг, нэр, утас заавал шаардлагатай

ХОЛБОО БАРИХ:
- Утас: +976 9666 5040
- Имэйл: enhmaa@acnation.net
- Вэбсайт: honey.acnation.net

Та найрсаг, товч, ойлгомжтой хариул. Үнэ, бүтээгдэхүүн, захиалга, хүргэлтийн талаарх асуултад тусална.`;

const FACEBOOK_SYSTEM_PROMPT = `Чи "Титэм" брэндийн байгалийн цэвэр үүрэн зөгийн балны туслах chatbot юм. Монгол хэлээр хэрэглэгчтэй дотно, богино, тус болохуйцаар ярина. Хэт албан ёсны биш, найрсаг өнгө аясаар хариул.

БҮТЭЭГДЭХҮҮН: Титэм — Байгалийн Цэвэр Сархинагтай Зөгийн Бал
Гарал: Өвөр Монголын уулын олон цэцгийн бал (Цагаан будаа, Алтан цэцэг, Ямаан хошуу, Гурвалжин будаа, Бэр цэцэг)
Онцлог: Ямар ч нэмэлт боловсруулалтгүй, байгалийн анхны байдлаараа. Фермент, идэвхт бодис бүрэн хадгалагдсан. Сархинаг (лав) зажлахад таатай.

ҮНЭ: 1кг = 39,000₮ (зөвхөн 1кг баглаа — 2кг авбал 2 ширхэг)

ЗАХИАЛГА: honey.acnation.net эсвэл энэ чат
ХҮРГЭЛТ: Өнөөдөр захиалбал маргааш өдөртөө хүрнэ (08:00-д хүргэлтийн компанид өгдөг)
ТӨЛБӨР: Банкны шилжүүлэг эсвэл QPay
УТАС: 9666-5040

ХЭРЭГЛЭХ: 40°C-ээс доош дулаан усанд уусгах / шууд зажлах (лавыг хуруу болгох) / тараг, талхтай хольж идэх
АНХААРАЛ: 1 насны хүүхдэд өгч болохгүй. Буцалсан усанд хийж болохгүй. Өдөрт 20-30г.

Мэдэхгүй зүйл асуувал: 9666-5040 руу залгахыг санал болго.`;

type MessengerEvent = {
  sender: { id: string };
  recipient?: { id: string };
  message?: { text?: string; is_echo?: boolean };
};

const INSTAGRAM_BUSINESS_ACCOUNT_ID = "17841433358656876";

async function callClaudeInstagram(userMessage: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[webhook] ANTHROPIC_API_KEY is missing");
    return "Уучлаарай, одоогоор хариулж чадахгүй байна. Дараа дахин оролдоно уу.";
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: INSTAGRAM_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[webhook] Claude API error:", err);
    return "Уучлаарай, алдаа гарлаа. Та дахин оролдоно уу.";
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  return typeof text === "string" ? text : "Уучлаарай, хариулж чадахгүй байна.";
}

async function callClaudeFacebook(userMessage: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[webhook] ANTHROPIC_API_KEY is missing");
    return "Уучлаарай, дахин оролдоно уу.";
  }

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 500,
      system: FACEBOOK_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!claudeRes.ok) {
    const err = await claudeRes.text();
    console.error("[webhook] Claude API error (Facebook):", err);
    return "Уучлаарай, дахин оролдоно уу.";
  }

  const claudeData = await claudeRes.json();
  return claudeData.content?.[0]?.text || "Уучлаарай, дахин оролдоно уу.";
}

async function sendFacebookMessage(recipientId: string, text: string) {
  const pageToken = process.env.PAGE_ACCESS_TOKEN;
  if (!pageToken) {
    console.error("[webhook] PAGE_ACCESS_TOKEN is missing");
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/me/messages?access_token=${pageToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("[webhook] Facebook send error:", err);
  }
}

async function sendInstagramMessage(
  instagramBusinessAccountId: string,
  recipientId: string,
  text: string,
) {
  const token = process.env.PAGE_ACCESS_TOKEN?.trim();
  console.log("[webhook] sending IG reply to:", recipientId);
  console.log("[webhook] IG business account:", instagramBusinessAccountId);
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${instagramBusinessAccountId}/messages?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    },
  );
  const result = await response.text();
  console.log("[webhook] IG reply result:", result);
}

async function handleMessage(
  event: MessengerEvent,
  platform: "page" | "instagram",
  entryId?: string,
) {
  if (event.message?.is_echo) return;

  const senderId = event.sender.id;
  const text = event.message?.text?.trim();
  if (!text) return;

  console.log(
    "[webhook] message from",
    senderId,
    platform === "instagram" ? "(instagram)" : "(facebook)",
    ":",
    text,
  );

  const reply =
    platform === "instagram"
      ? await callClaudeInstagram(text)
      : await callClaudeFacebook(text);
  if (platform === "instagram") {
    const instagramBusinessAccountId =
      event.recipient?.id ?? entryId ?? INSTAGRAM_BUSINESS_ACCOUNT_ID;
    await sendInstagramMessage(instagramBusinessAccountId, senderId, reply);
  } else {
    await sendFacebookMessage(senderId, reply);
  }
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("[webhook] verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.error("[webhook] verification failed");
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[webhook] body:", JSON.stringify(body));
    const pageToken = process.env.PAGE_ACCESS_TOKEN?.trim();
    console.log("[webhook] Page token prefix:", pageToken?.substring(0, 20));
    console.log("[webhook] Page token length:", pageToken?.length);

    if (body.object !== "page" && body.object !== "instagram") {
      return NextResponse.json({ status: "not a supported event" });
    }

    if (body.object === "instagram") {
      console.log("[webhook] Instagram entry:", JSON.stringify(body.entry));
    }

    const platform = body.object as "page" | "instagram";
    const entries = body.entry ?? [];

    for (const entry of entries) {
      const messagingEvents: MessengerEvent[] = entry.messaging ?? [];
      for (const event of messagingEvents) {
        await handleMessage(event, platform, entry.id);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[webhook] POST error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
