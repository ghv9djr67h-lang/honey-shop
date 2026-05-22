import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Та "ТИТЭМ" зөгийн балын дэлгүүрийн туслах чатбот юм. Зөвхөн монгол хэлээр хариулна.

БҮТЭЭДЭХҮҮН:
- Нэр: Олон цэцгийн 100% цэвэр зөгийн бал
- 1кг = 39,000₮
- 2кг = 78,000₮
- 3кг = 117,000₮
- Байгалийн цэвэр, химийн бодис агуулаагүй, шууд үйлдвэрлэгчээс

ЗАХИАЛАХ:
- Захиалга өгөхийг хүсвэл вэбсайт руу чиглүүлнэ (захиалгын хуудас).
- Захиалгын алхмууд: багц сонгох → төлбөр төлөх (QPay эсвэл дансаар) → хүргэлтийн мэдээлэл оруулах.

ХҮРГЭЛТ:
- Улаанбаатар хотод хүргэнэ.
- Захиалга баталгаажсаны дараа удахгүй хүргэнэ.
- Хүргэлтийн хаяг, нэр, утас заавал шаардлагатай.

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
      model: "claude-sonnet-4-20250514",
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

async function handleMessage(event: MessengerEvent) {
  if (event.message?.is_echo) return;

  const senderId = event.sender.id;
  const text = event.message?.text?.trim();
  if (!text) return;

  console.log("[webhook] message from", senderId, ":", text);

  const reply = await callClaude(text);
  await sendFacebookMessage(senderId, reply);
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

    if (body.object !== "page") {
      return NextResponse.json({ status: "not a page event" });
    }

    const entries = body.entry ?? [];

    for (const entry of entries) {
      const messagingEvents: MessengerEvent[] = entry.messaging ?? [];
      for (const event of messagingEvents) {
        await handleMessage(event);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[webhook] POST error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
