import { Router } from "express";
import multer from "multer";
import { UPLOAD_DIR } from "../utils/helpers";
import {
  uploadLocalImage,
  addGoogleDriveImage,
  getImages,
  updateImage,
  deleteImage,
  sortImages
} from "../controllers/images.controller";
import fs from "fs";

const router = Router();

// ==================================================================================
// LOGGING: cek apakah folder uploads benar-benar ada
// ==================================================================================
console.log("UPLOAD_DIR:", UPLOAD_DIR);
console.log("UPLOAD_DIR exists:", fs.existsSync(UPLOAD_DIR));

// ==================================================================================
// Multer config
// ==================================================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("MULTER destination →", UPLOAD_DIR);
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    console.log("MULTER filename →", file.originalname);
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
});

// Multer error logging
router.use((err: any, req: any, res: any, next: any) => {
  console.error("🔥 MULTER ERROR:", err);
  next(err);
});


// -----------------------------
// Proxy endpoint untuk Google Drive
// -----------------------------
router.get("/proxy", async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).send("Missing url");

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");
    const buffer = await response.arrayBuffer();
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "image/jpeg"
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Failed to fetch image");
  }
});

// -----------------------------
// Image CRUD
// -----------------------------
router.post("/upload", (req, res, next) => {
  console.log("📥 UPLOAD endpoint hit");
  upload.single("image")(req, res, function (err) {
    if (err) console.error("📛 Multer middleware error:", err);
    console.log("📄 Multer received file:", req.file);
    next(err);
  });
}, uploadLocalImage);

router.post("/gdrive", addGoogleDriveImage);
router.get("/", getImages);
router.put("/sort", sortImages);

router.put("/:id", (req, res, next) => {
  console.log("📥 UPDATE endpoint hit");
  upload.single("file")(req, res, function (err) {
    if (err) console.error("📛 Multer error on update:", err);
    console.log("📄 Multer received update file:", req.file);
    next(err);
  });
}, updateImage);

router.delete("/:id", deleteImage);

export default router;
