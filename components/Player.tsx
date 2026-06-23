"use client";

import { useEffect, useRef, useState } from "react";
import type { Song } from "@/lib/types";

interface Props {
  song: Song | null;
  queue: Song[];
  onNext: () => void;
  onPrev: () => void;
  castActive: boolean;
}

export default function Player({ song, queue, onNext, onPrev, castActive }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  // Parar audio del navegador cuando se castea al Google Home
  useEffect(() => {
    if (!audioRef.current) return;
    if (castActive) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setPlaying(false);
      return;
    }
    if (!song) return;
    audioRef.current.src = song.url;
    audioRef.current.volume = volume;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
  }, [song, castActive]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const seek = (val: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = val;
    setCurrent(val);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!song) {
    return (
      <div className="h-24 bg-surface border-t border-gray-800 flex items-center justify-center text-muted text-sm">
        Selecciona una canción para empezar
      </div>
    );
  }

  return (
    <div className="h-24 bg-surface border-t border-gray-800 flex items-center px-6 gap-4">
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={onNext}
      />

      {/* Song info */}
      <div className="w-48 shrink-0">
        <p className="text-white font-medium text-sm truncate">{song.title}</p>
        <p className="text-muted text-xs truncate">{song.artist}</p>
        {castActive && (
          <span className="text-accent text-xs">Transmitiendo a Google Home</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-5">
          <button onClick={onPrev} className="text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
            </svg>
          </button>
          <button
            onClick={togglePlay}
            disabled={castActive}
            className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
          >
            {playing ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <button onClick={onNext} className="text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-muted text-xs w-8 text-right">{fmt(current)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={current}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 h-1 cursor-pointer"
          />
          <span className="text-muted text-xs w-8">{fmt(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="w-32 flex items-center gap-2 shrink-0">
        <svg className="w-4 h-4 text-muted shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 h-1 cursor-pointer"
        />
      </div>
    </div>
  );
}
