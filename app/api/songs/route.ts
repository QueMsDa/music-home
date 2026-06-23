import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import type { Song } from "@/lib/types";

export async function GET() {
  const songs = (await kv.get<Song[]>("songs")) ?? [];
  return NextResponse.json(songs);
}

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const song: Song = await request.json();
  const songs = (await kv.get<Song[]>("songs")) ?? [];

  const exists = songs.find((s) => s.id === song.id);
  if (!exists) {
    await kv.set("songs", [...songs, song]);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  const songs = (await kv.get<Song[]>("songs")) ?? [];
  await kv.set(
    "songs",
    songs.filter((s) => s.id !== id)
  );

  return NextResponse.json({ ok: true });
}
