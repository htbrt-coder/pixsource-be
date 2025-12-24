import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { UPLOAD_DIR } from "./utils/helpers";
import imageRouter from "./routes/images.route";
import { checkDB } from "./db";

dotenv.config();

const app = express();


const corsOptions = {
    // Mengizinkan semua domain (origin) untuk mengakses API
    // Perhatian: Ini mengizinkan akses publik, gunakan dengan hati-hati.
    origin: "*", 
    // Jika Anda juga memerlukan kredensial (cookies, header otorisasi)
    // credentials: true, 
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", 
    optionsSuccessStatus: 204
};
// -----------------------------
// Middleware
// -----------------------------
app.use(cors(corsOptions));
app.use(express.json());               // untuk JSON body
app.use(express.urlencoded({ extended: true })); // untuk form-data

// -----------------------------
// Static folder untuk local images
// -----------------------------
app.use("/images", express.static(UPLOAD_DIR));

// -----------------------------
// Routes
// -----------------------------
app.use("/api/images", imageRouter);

// -----------------------------
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await checkDB();
    app.listen(PORT, () => {
      console.log("🚀 Server running on port", PORT);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
