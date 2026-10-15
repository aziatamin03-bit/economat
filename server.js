import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT) || 3e3;
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port} (0.0.0.0:${port})`);
});
