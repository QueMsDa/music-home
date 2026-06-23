export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface Command {
  action: "play" | "pause" | "stop" | "resume" | "volume";
  songUrl?: string;
  songTitle?: string;
  songArtist?: string;
  volume?: number;
  timestamp: number;
}
