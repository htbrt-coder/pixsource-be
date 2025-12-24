import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";


import { UPLOAD_DIR } from "./utils/helpers.js";
import imageRouter from "./routes/images.route.js";
import { checkDB } from "./db.js";

dotenv.config();

const app = express();

// untuk __dirname di ESM
const ROOT = process.cwd(); // folder tempat kamu jalanin node/pm2
const DIST_PATH = path.join(ROOT, "..", "pixsource-fe", "dist");

// ---- PATH: sesuaikan struktur repo ----
// Asumsi struktur:
// /pixsource
//   /pixsource-fe (frontend)
//   /pixsource-be (backend - file ini ada di sini)


// ---- Middleware ----
app.use(cors()); // kalau 1 port, cors sebenarnya bisa dihapus
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Static upload images ----
app.use("/images", express.static(UPLOAD_DIR));

// ---- API routes (taruh di atas static SPA) ----
app.use("/api/images", imageRouter);

// ---- Serve Vite build (production) ----
app.use(express.static(DIST_PATH));

// Fallback untuk SPA routes (history mode)
app.get(/.*/, (req, res) => res.sendFile(path.join(DIST_PATH, "index.html")));

const PORT = process.env.PORT || 80;

async function startServer() {
  try {
    await checkDB();
    app.listen(PORT, () => console.log("🚀 Server running on port", PORT));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}
startServer();
