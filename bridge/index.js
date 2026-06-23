require("dotenv").config({ path: "../.env.local" });

const { Client, DefaultMediaReceiver } = require("castv2-client");

const VERCEL_URL = process.env.NEXT_PUBLIC_APP_URL;
const API_SECRET = process.env.API_SECRET;
const GOOGLE_HOME_IP = process.env.GOOGLE_HOME_IP;
const POLL_INTERVAL = 2000;

if (!VERCEL_URL || !API_SECRET || !GOOGLE_HOME_IP) {
  console.error("Faltan variables de entorno: NEXT_PUBLIC_APP_URL, API_SECRET, GOOGLE_HOME_IP");
  process.exit(1);
}

let lastTimestamp = 0;
let castClient = null;
let castPlayer = null;

// Cola de reproducción local
let localQueue = [];
let localQueueIndex = 0;

// ─── Cast helpers ─────────────────────────────────────────────────────────────

async function connectCast() {
  return new Promise((resolve, reject) => {
    const client = new Client();

    client.connect(GOOGLE_HOME_IP, () => {
      console.log(`[Bridge] Conectado a Google Home (${GOOGLE_HOME_IP})`);
      castClient = client;

      client.launch(DefaultMediaReceiver, (err, player) => {
        if (err) return reject(err);
        castPlayer = player;

        // Cuando termina una canción, reproduce la siguiente de la cola
        player.on("status", (status) => {
          if (status.idleReason === "FINISHED" && localQueue.length > 0) {
            playNext();
          }
        });

        resolve(player);
      });
    });

    client.on("error", (err) => {
      console.error("[Bridge] Error Cast:", err.message);
      castClient = null;
      castPlayer = null;
      reject(err);
    });
  });
}

function getContentType(url) {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "mp3";
  const map = {
    mp3: "audio/mpeg",
    flac: "audio/flac",
    wav: "audio/wav",
    ogg: "audio/ogg",
    aac: "audio/aac",
    m4a: "audio/mp4",
  };
  return map[ext] ?? "audio/mpeg";
}

async function castSong(url, title, artist) {
  try {
    if (!castClient || !castPlayer) {
      await connectCast();
    }

    const media = {
      contentId: url,
      contentType: getContentType(url),
      streamType: "BUFFERED",
      metadata: {
        metadataType: 3,
        title: title ?? "Sin título",
        artist: artist ?? "Desconocido",
        albumName: "",
        images: [],
      },
    };

    castPlayer.load(media, { autoplay: true }, (err) => {
      if (err) {
        console.error("[Bridge] Error al cargar:", err.message);
        castClient = null;
        castPlayer = null;
      } else {
        console.log(`[Bridge] ▶ ${title} — ${artist}`);
      }
    });
  } catch (err) {
    console.error("[Bridge] Error al castear:", err.message);
    castClient = null;
    castPlayer = null;
  }
}

async function playNext() {
  if (localQueue.length === 0) return;
  localQueueIndex = (localQueueIndex + 1) % localQueue.length;
  const song = localQueue[localQueueIndex];
  console.log(`[Bridge] Siguiente: ${song.title}`);
  await castSong(song.url, song.title, song.artist);
}

// ─── Polling ──────────────────────────────────────────────────────────────────

async function fetchCommand() {
  const res = await fetch(`${VERCEL_URL}/api/command?key=${API_SECRET}`);
  if (!res.ok) return null;
  return res.json();
}

async function poll() {
  try {
    const command = await fetchCommand();
    if (!command || command.timestamp <= lastTimestamp) return;
    lastTimestamp = command.timestamp;

    console.log(`[Bridge] Comando: ${command.action}`);

    switch (command.action) {
      case "play":
        localQueue = [];
        localQueueIndex = 0;
        await castSong(command.songUrl, command.songTitle, command.songArtist);
        break;

      case "play_queue":
        // Cola completa recibida (desde trigger WiFi o web app)
        if (command.queue && command.queue.length > 0) {
          localQueue = command.queue;
          localQueueIndex = command.queueIndex ?? 0;
          const song = localQueue[localQueueIndex];
          await castSong(song.url, song.title, song.artist);
        }
        break;

      case "stop":
        if (castClient) {
          castClient.stop(() => {});
          castClient = null;
          castPlayer = null;
          localQueue = [];
        }
        console.log("[Bridge] Detenido");
        break;

      case "pause":
        if (castPlayer) {
          castPlayer.pause((err) => {
            if (err) console.error("[Bridge] Error al pausar:", err.message);
            else console.log("[Bridge] Pausado");
          });
        }
        break;

      case "resume":
        if (castPlayer) {
          castPlayer.play((err) => {
            if (err) console.error("[Bridge] Error al reanudar:", err.message);
            else console.log("[Bridge] Reanudado");
          });
        }
        break;

      case "volume":
        if (castClient && command.volume !== undefined) {
          castClient.setVolume({ level: command.volume }, () => {
            console.log(`[Bridge] Volumen: ${Math.round(command.volume * 100)}%`);
          });
        }
        break;
    }
  } catch {
    // Error de red temporal — el siguiente poll lo reintentará
  }
}

console.log("╔════════════════════════════════════╗");
console.log("║     MusicHome Bridge iniciado      ║");
console.log("╚════════════════════════════════════╝");
console.log(`  Vercel   : ${VERCEL_URL}`);
console.log(`  GoogleHome: ${GOOGLE_HOME_IP}`);
console.log(`  Polling  : cada ${POLL_INTERVAL / 1000}s\n`);

setInterval(poll, POLL_INTERVAL);
poll();
