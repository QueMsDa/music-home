"use client";

import { useEffect, useState, useCallback } from "react";
import Player from "@/components/Player";
import Library from "@/components/Library";
import UploadModal from "@/components/UploadModal";
import type { Song } from "@/lib/types";

const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET!;

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [castActive, setCastActive] = useState(false);
  const [castReady, setCastReady] = useState(false);
  const [search, setSearch] = useState("");

  const fetchSongs = useCallback(async () => {
    const res = await fetch("/api/songs");
    const data: Song[] = await res.json();
    setSongs(data);
  }, []);

  useEffect(() => {
    fetchSongs();
    setCastReady(true); // bridge handles casting, always show button
  }, [fetchSongs]);

  const filtered = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase())
  );

  const play = (song: Song) => {
    const idx = filtered.findIndex((s) => s.id === song.id);
    setQueueIndex(idx);
    setCurrentSong(song);
    setCastActive(false);
  };

  const cast = async (song: Song) => {
    setCastActive(true);
    setCurrentSong(song);
    await fetch("/api/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_SECRET,
      },
      body: JSON.stringify({
        action: "play",
        songUrl: song.url,
        songTitle: song.title,
        songArtist: song.artist,
      }),
    });
  };

  const next = () => {
    if (filtered.length === 0) return;
    const nextIdx = (queueIndex + 1) % filtered.length;
    setQueueIndex(nextIdx);
    const nextSong = filtered[nextIdx];
    setCurrentSong(nextSong);
    if (castActive) cast(nextSong);
  };

  const prev = () => {
    if (filtered.length === 0) return;
    const prevIdx = (queueIndex - 1 + filtered.length) % filtered.length;
    setQueueIndex(prevIdx);
    const prevSong = filtered[prevIdx];
    setCurrentSong(prevSong);
    if (castActive) cast(prevSong);
  };

  const deleteSong = async (song: Song) => {
    if (!confirm(`¿Eliminar "${song.title}"?`)) return;
    await fetch("/api/songs", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_SECRET,
      },
      body: JSON.stringify({ id: song.id }),
    });
    setSongs((s) => s.filter((x) => x.id !== song.id));
    if (currentSong?.id === song.id) setCurrentSong(null);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-surface border-b border-gray-800 px-6 py-4 flex items-center gap-4 shrink-0">
        <h1 className="text-white font-bold text-xl tracking-tight">MusicHome</h1>
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar canciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          {castActive && (
            <div className="flex items-center gap-2 text-accent text-sm">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Google Home activo
            </div>
          )}
          <span className="text-muted text-sm">{songs.length} canciones</span>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-accent text-black font-semibold px-4 py-2 rounded-lg hover:bg-green-400 transition-colors text-sm"
          >
            + Subir música
          </button>
        </div>
      </header>

      {/* Column headers */}
      <div className="shrink-0 px-6 pt-4 pb-2">
        <h2 className="text-muted text-xs uppercase tracking-widest font-semibold">
          Tu biblioteca
        </h2>
      </div>

      {/* Library */}
      <Library
        songs={filtered}
        currentSong={currentSong}
        onPlay={play}
        onCast={cast}
        onDelete={deleteSong}
        castReady={castReady}
      />

      {/* Player */}
      <Player
        song={currentSong}
        queue={filtered}
        onNext={next}
        onPrev={prev}
        castActive={castActive}
      />

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={(song) => {
            setSongs((s) => [...s, song]);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}
