import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import type { Song } from "@/lib/types";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "audio/mpeg",
            "audio/flac",
            "audio/wav",
            "audio/ogg",
            "audio/x-flac",
            "audio/mp4",
            "audio/aac",
          ],
          maximumSizeInBytes: 200 * 1024 * 1024,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        const rawName = blob.pathname.split("/").pop() ?? "Desconocido";
        const title = rawName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

        const song: Song = {
          id: crypto.randomUUID(),
          title,
          artist: "Desconocido",
          album: "Sin álbum",
          url: blob.url,
          contentType: blob.contentType,
          size: blob.size,
          uploadedAt: new Date().toISOString(),
        };

        const songs = (await redis.get<Song[]>("songs")) ?? [];
        await redis.set("songs", [...songs, song]);
      },
    });

    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
