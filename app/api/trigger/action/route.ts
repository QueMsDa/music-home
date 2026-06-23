import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import type { Song, Command } from "@/lib/types";

// GET /api/trigger/action?key=SECRET&do=play|pause|stop|next|prev|shuffle
// Llamado por IFTTT cuando Google Home recibe un comando de voz
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const action = searchParams.get("do") ?? "shuffle";

  if (key !== process.env.API_SECRET?.trim()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const songs = (await redis.get<Song[]>("songs")) ?? [];

  let command: Command;

  if (action === "play" || action === "shuffle") {
    if (songs.length === 0) {
      return NextResponse.json({ ok: false, reason: "Sin canciones" });
    }
    const shuffled = shuffle([...songs]);
    command = {
      action: "play_queue",
      songUrl: shuffled[0].url,
      songTitle: shuffled[0].title,
      songArtist: shuffled[0].artist,
      queue: shuffled,
      queueIndex: 0,
      timestamp: Date.now(),
    };
  } else if (action === "pause") {
    command = { action: "pause", timestamp: Date.now() };
  } else if (action === "resume") {
    command = { action: "resume", timestamp: Date.now() };
  } else if (action === "stop") {
    command = { action: "stop", timestamp: Date.now() };
  } else if (action === "next") {
    // El bridge avanza la cola internamente; aquí solo señalizamos
    const current = await redis.get<Command>("command");
    const queue = current?.queue ?? songs;
    const idx = ((current?.queueIndex ?? 0) + 1) % queue.length;
    const song = queue[idx];
    command = {
      action: "play_queue",
      songUrl: song.url,
      songTitle: song.title,
      songArtist: song.artist,
      queue,
      queueIndex: idx,
      timestamp: Date.now(),
    };
  } else if (action === "prev") {
    const current = await redis.get<Command>("command");
    const queue = current?.queue ?? songs;
    const idx = ((current?.queueIndex ?? 0) - 1 + queue.length) % queue.length;
    const song = queue[idx];
    command = {
      action: "play_queue",
      songUrl: song.url,
      songTitle: song.title,
      songArtist: song.artist,
      queue,
      queueIndex: idx,
      timestamp: Date.now(),
    };
  } else {
    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  }

  await redis.set("command", command);
  return NextResponse.json({ ok: true, action });
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
