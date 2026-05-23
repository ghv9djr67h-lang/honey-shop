import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Та "ТИТЭМ" зөгийн балын дэлгүүрийн туслах чатбот юм. Зөвхөн монгол хэлээр хариулна.

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

type MessengerEvent = {
  sender: { id: string };
  message?: { text?: string; is_echo?: boolean };
};

async function callClaude(userMessage: string): Promise<string> {
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
      system: SYSTEM_PROMPT,
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

async function sendInstagramMessage(recipientId: string, text: string) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    console.error("[webhook] INSTAGRAM_ACCESS_TOKEN is missing");
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${recipientId}/messages?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        messaging_type: "RESPONSE",
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("[webhook] Instagram send error:", err);
  }
}

async function handleMessage(
  event: MessengerEvent,
  platform: "page" | "instagram",
) {
  if (event.message?.is_echo) return;

  const senderId = event.sender.id;
  const text = event.message?.text?.trim();
  if (!text) return;

  console.log("[webhook] message from", senderId, ":", text);

  const reply = await callClaude(text);
  if (platform === "instagram") {
    await sendInstagramMessage(senderId, reply);
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

    if (body.object !== "page" && body.object !== "instagram") {
      return NextResponse.json({ status: "not a supported event" });
    }

    const platform = body.object as "page" | "instagram";
    const entries = body.entry ?? [];

    for (const entry of entries) {
      const messagingEvents: MessengerEvent[] = entry.messaging ?? [];
      for (const event of messagingEvents) {
        await handleMessage(event, platform);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[webhook] POST error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
