import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import type { Command } from "@/lib/types";

// GET — el bridge local hace polling cada 2 segundos
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const command = await kv.get<Command>("command");
  return NextResponse.json(command ?? null);
}

// POST — la web app envía un comando
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: Partial<Command> = await request.json();
  const command: Command = {
    ...body,
    action: body.action ?? "play",
    timestamp: Date.now(),
  };

  await kv.set("command", command);
  return NextResponse.json({ ok: true, timestamp: command.timestamp });
}
