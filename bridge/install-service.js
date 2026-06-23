const { Service } = require("node-windows");
const path = require("path");

const svc = new Service({
  name: "MusicHome Bridge",
  description: "Bridge entre Vercel y Google Home — reproduce música automáticamente",
  script: path.join(__dirname, "index.js"),
  workingDirectory: __dirname,
  maxRestarts: 10,
  wait: 2,       // segundos entre reinicios
  grow: 0.5,     // factor de crecimiento del tiempo entre reinicios
  logpath: path.join(__dirname, "logs"),
});

svc.on("install", () => {
  console.log("✅ Servicio instalado correctamente.");
  svc.start();
});

svc.on("start", () => {
  console.log("✅ MusicHome Bridge iniciado como servicio de Windows.");
  console.log("   Puedes verlo en: Servicios (services.msc) → MusicHome Bridge");
  process.exit(0);
});

svc.on("error", (err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

svc.on("alreadyinstalled", () => {
  console.log("⚠️  El servicio ya estaba instalado. Reiniciando...");
  svc.start();
});

console.log("Instalando servicio de Windows...");
svc.install();
