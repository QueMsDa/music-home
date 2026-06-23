import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import type { Song, Command } from "@/lib/types";

// GET /api/trigger/wifi?key=SECRET&mode=shuffle
// Llamado automáticamente cuando el teléfono se conecta al WiFi
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const mode = searchParams.get("mode") ?? "shuffle"; // shuffle | first | last

  if (key !== process.env.API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const songs = (await kv.get<Song[]>("songs")) ?? [];

  if (songs.length === 0) {
    return NextResponse.json({ ok: false, reason: "No hay canciones en la biblioteca" });
  }

  let song: Song;
  if (mode === "shuffle") {
    song = songs[Math.floor(Math.random() * songs.length)];
  } else if (mode === "last") {
    song = songs[songs.length - 1];
  } else {
    song = songs[0];
  }

  // Guardar el índice de inicio para que el bridge pueda seguir la cola
  const shuffledQueue = mode === "shuffle" ? shuffle([...songs]) : [...songs];
  const startIndex = shuffledQueue.findIndex((s) => s.id === song.id);

  const command: Command = {
    action: "play_queue",
    songUrl: song.url,
    songTitle: song.title,
    songArtist: song.artist,
    queue: shuffledQueue,
    queueIndex: startIndex >= 0 ? startIndex : 0,
    timestamp: Date.now(),
  };

  await kv.set("command", command);

  return NextResponse.json({
    ok: true,
    playing: { title: song.title, artist: song.artist },
    totalSongs: songs.length,
    mode,
  });
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
