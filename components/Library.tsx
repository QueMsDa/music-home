"use client";

import type { Song } from "@/lib/types";

interface Props {
  songs: Song[];
  currentSong: Song | null;
  onPlay: (song: Song) => void;
  onCast: (song: Song) => void;
  onDelete: (song: Song) => void;
  castReady: boolean;
}

export default function Library({
  songs,
  currentSong,
  onPlay,
  onCast,
  onDelete,
  castReady,
}: Props) {
  const fmt = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  if (songs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-sm flex-col gap-2">
        <p className="text-4xl">🎶</p>
        <p>No hay canciones. Sube tus archivos de música.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-bg border-b border-gray-800">
          <tr className="text-muted text-xs uppercase tracking-wide">
            <th className="text-left px-4 py-3 w-8">#</th>
            <th className="text-left px-4 py-3">Título</th>
            <th className="text-left px-4 py-3 hidden md:table-cell">Artista</th>
            <th className="text-left px-4 py-3 hidden lg:table-cell">Formato</th>
            <th className="text-left px-4 py-3 hidden lg:table-cell">Tamaño</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {songs.map((song, i) => {
            const active = currentSong?.id === song.id;
            return (
              <tr
                key={song.id}
                className={`group border-b border-gray-800/50 hover:bg-card cursor-pointer transition-colors ${active ? "bg-card" : ""}`}
                onDoubleClick={() => onPlay(song)}
              >
                <td className="px-4 py-3 text-muted w-8">
                  {active ? (
                    <span className="text-accent">▶</span>
                  ) : (
                    <span className="group-hover:hidden">{i + 1}</span>
                  )}
                  {!active && (
                    <button
                      className="hidden group-hover:block text-white"
                      onClick={() => onPlay(song)}
                    >
                      ▶
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={active ? "text-accent font-medium" : "text-white"}>
                    {song.title}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted hidden md:table-cell">{song.artist}</td>
                <td className="px-4 py-3 text-muted hidden lg:table-cell">
                  {song.contentType.split("/")[1]?.toUpperCase()}
                </td>
                <td className="px-4 py-3 text-muted hidden lg:table-cell">{fmt(song.size)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {castReady && (
                      <button
                        onClick={() => onCast(song)}
                        className="text-muted hover:text-accent transition-colors"
                        title="Enviar a Google Home"
                      >
                        📡
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(song)}
                      className="text-muted hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
