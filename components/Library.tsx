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

export default function Library({ songs, currentSong, onPlay, onCast, onDelete, castReady }: Props) {
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
      {songs.map((song, i) => {
        const active = currentSong?.id === song.id;
        return (
          <div
            key={song.id}
            className={`flex items-center px-4 py-3 border-b border-gray-800/50 transition-colors ${active ? "bg-card" : "hover:bg-card"}`}
          >
            {/* Número / indicador activo */}
            <div className="w-6 text-center text-sm shrink-0 mr-3">
              {active ? <span className="text-accent">▶</span> : <span className="text-muted">{i + 1}</span>}
            </div>

            {/* Título y artista */}
            <div className="flex-1 min-w-0 mr-3">
              <p className={`truncate text-sm font-medium ${active ? "text-accent" : "text-white"}`}>
                {song.title}
              </p>
              <p className="truncate text-xs text-muted">{song.artist}</p>
            </div>

            {/* Botones — siempre visibles */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Botón principal: CAST al Google Home */}
              <button
                onClick={() => onCast(song)}
                className="flex items-center gap-1 bg-accent text-black text-xs font-bold px-3 py-1.5 rounded-full hover:bg-green-400 active:scale-95 transition-all"
                title="Reproducir en Google Home"
              >
                📡 <span className="hidden sm:inline">Google Home</span>
              </button>

              {/* Botón secundario: reproducir en navegador */}
              <button
                onClick={() => onPlay(song)}
                className="text-muted hover:text-white transition-colors text-lg"
                title="Reproducir en este dispositivo"
              >
                🔊
              </button>

              {/* Eliminar */}
              <button
                onClick={() => onDelete(song)}
                className="text-muted hover:text-red-400 transition-colors text-sm"
                title="Eliminar"
              >
                🗑
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
