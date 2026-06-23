"use client";

import { upload } from "@vercel/blob/client";
import { useState, useRef } from "react";
import type { Song } from "@/lib/types";

interface Props {
  onClose: () => void;
  onUploaded: (song: Song) => void;
}

export default function UploadModal({ onClose, onUploaded }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    setFiles(Array.from(selected));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    for (const file of files) {
      try {
        setProgress((p) => ({ ...p, [file.name]: 0 }));

        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          onUploadProgress: ({ percentage }) => {
            setProgress((p) => ({ ...p, [file.name]: percentage }));
          },
        });

        // Fetch updated songs list to get the new song
        const res = await fetch("/api/songs");
        const songs: Song[] = await res.json();
        const newest = songs.find((s) => s.url === blob.url);
        if (newest) onUploaded(newest);
      } catch (err) {
        console.error("Error subiendo", file.name, err);
      }
    }

    setUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">Subir canciones</h2>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">
            ×
          </button>
        </div>

        <div
          className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-accent transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          <p className="text-4xl mb-2">🎵</p>
          <p className="text-white font-medium">Arrastra tus archivos aquí</p>
          <p className="text-muted text-sm mt-1">MP3, FLAC, WAV, AAC (hasta 200 MB c/u)</p>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {files.map((f) => (
              <div key={f.name} className="bg-surface rounded-lg px-3 py-2">
                <div className="flex justify-between text-sm">
                  <span className="truncate text-white">{f.name}</span>
                  <span className="text-muted ml-2 shrink-0">
                    {(f.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                {uploading && progress[f.name] !== undefined && (
                  <div className="mt-1 bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-accent h-1 rounded-full transition-all"
                      style={{ width: `${progress[f.name]}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="mt-5 w-full bg-accent text-black font-semibold py-2.5 rounded-xl hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? "Subiendo..." : `Subir ${files.length} archivo${files.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
