require("dotenv").config({ path: "../.env.local" });

const { Client, DefaultMediaReceiver } = require("castv2-client");

const VERCEL_URL = process.env.NEXT_PUBLIC_APP_URL;
const API_SECRET = process.env.API_SECRET;
const GOOGLE_HOME_IP = process.env.GOOGLE_HOME_IP;
const POLL_INTERVAL = 2000; // ms

if (!VERCEL_URL || !API_SECRET || !GOOGLE_HOME_IP) {
  console.error(
    "Faltan variables de entorno: NEXT_PUBLIC_APP_URL, API_SECRET, GOOGLE_HOME_IP"
  );
  process.exit(1);
}

let lastTimestamp = 0;
let castClient = null;
let castPlayer = null;

async function fetchCommand() {
  const res = await fetch(
    `${VERCEL_URL}/api/command?key=${API_SECRET}`
  );
  if (!res.ok) return null;
  return res.json();
}

async function connectCast() {
  return new Promise((resolve, reject) => {
    const client = new Client();

    client.connect(GOOGLE_HOME_IP, () => {
      console.log(`[Bridge] Conectado a Google Home (${GOOGLE_HOME_IP})`);
      castClient = client;

      client.launch(DefaultMediaReceiver, (err, player) => {
        if (err) return reject(err);
        castPlayer = player;
        resolve(player);
      });
    });

    client.on("error", (err) => {
      console.error("[Bridge] Error de Cast:", err.message);
      castClient = null;
      castPlayer = null;
      reject(err);
    });
  });
}

async function castSong(url, title, artist) {
  try {
    if (!castClient || !castPlayer) {
      await connectCast();
    }

    const ext = url.split(".").pop()?.toLowerCase() ?? "mp3";
    const contentTypeMap = {
      mp3: "audio/mpeg",
      flac: "audio/flac",
      wav: "audio/wav",
      ogg: "audio/ogg",
      aac: "audio/aac",
      m4a: "audio/mp4",
    };
    const contentType = contentTypeMap[ext] ?? "audio/mpeg";

    const media = {
      contentId: url,
      contentType,
      streamType: "BUFFERED",
      metadata: {
        metadataType: 3, // MusicTrackMediaMetadata
        title: title ?? "Sin título",
        artist: artist ?? "Desconocido",
        albumName: "",
        images: [],
      },
    };

    castPlayer.load(media, { autoplay: true }, (err, status) => {
      if (err) {
        console.error("[Bridge] Error al cargar media:", err.message);
        castClient = null;
        castPlayer = null;
      } else {
        console.log(`[Bridge] Reproduciendo: ${title} — ${artist}`);
      }
    });
  } catch (err) {
    console.error("[Bridge] Error al castear:", err.message);
    castClient = null;
    castPlayer = null;
  }
}

async function stopCast() {
  if (castClient) {
    castClient.stop(() => {});
    castClient = null;
    castPlayer = null;
    console.log("[Bridge] Reproducción detenida");
  }
}

async function poll() {
  try {
    const command = await fetchCommand();
    if (!command) return;

    if (command.timestamp <= lastTimestamp) return; // ya procesado
    lastTimestamp = command.timestamp;

    console.log(`[Bridge] Comando recibido: ${command.action}`);

    switch (command.action) {
      case "play":
        await castSong(command.songUrl, command.songTitle, command.songArtist);
        break;
      case "stop":
        await stopCast();
        break;
      case "pause":
        if (castPlayer) {
          castPlayer.pause((err) => {
            if (err) console.error("[Bridge] Error al pausar:", err.message);
          });
        }
        break;
      case "resume":
        if (castPlayer) {
          castPlayer.play((err) => {
            if (err) console.error("[Bridge] Error al reanudar:", err.message);
          });
        }
        break;
      case "volume":
        if (castClient && command.volume !== undefined) {
          castClient.setVolume({ level: command.volume }, () => {});
        }
        break;
    }
  } catch (err) {
    // Silencioso — puede ser un error de red temporal
  }
}

console.log(`[Bridge] Iniciando...`);
console.log(`[Bridge] Vercel: ${VERCEL_URL}`);
console.log(`[Bridge] Google Home IP: ${GOOGLE_HOME_IP}`);
console.log(`[Bridge] Polling cada ${POLL_INTERVAL / 1000}s\n`);

setInterval(poll, POLL_INTERVAL);
poll(); // primera ejecución inmediata
