const { Service } = require("node-windows");
const path = require("path");

const svc = new Service({
  name: "MusicHome Bridge",
  script: path.join(__dirname, "index.js"),
});

svc.on("uninstall", () => {
  console.log("✅ Servicio eliminado correctamente.");
  process.exit(0);
});

svc.on("error", (err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

console.log("Desinstalando servicio...");
svc.uninstall();
