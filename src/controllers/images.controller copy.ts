import { Request, Response } from "express";
import db from "../db";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeGoogleDriveUrl } from "../utils/helpers";

const __dirname = path.resolve();
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// =====================================================
// UPLOAD LOCAL IMAGE
// =====================================================
export const uploadLocalImage = async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const newUrl = `/images/${file.filename}`;

  await db.query(
    `INSERT INTO ps_images (type, url, position, created_at)
    VALUES ($1, $2, (SELECT COALESCE(MAX(position), 0) + 1 FROM ps_images), NOW());`,
    ["local", newUrl]
  );

  res.json({ message: "Uploaded", url: newUrl });
};

// =====================================================
// ADD GDRIVE IMAGE
// =====================================================
export const addGoogleDriveImage = async (req: Request, res: Response) => {
  const url = req.body?.url;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Field 'url' wajib dan harus string" });
  }

  try {
    const finalUrl = normalizeGoogleDriveUrl(url);

    const result = await db.query(
      `INSERT INTO ps_images (type, url, position, created_at)
      VALUES ($1, $2, (SELECT COALESCE(MAX(position), 0) + 1 FROM ps_images), NOW())
      RETURNING *;`,
      ["gdrive", finalUrl]
    );

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("GDrive insert error:", err);
    return res.status(400).json({ error: "Invalid Google Drive URL" });
  }
};

// =====================================================
// GET IMAGES
// =====================================================
export const getImages = async (req: Request, res: Response) => {
  const result = await db.query(
    "SELECT id, type, url, position FROM ps_images ORDER BY position ASC, id ASC"
  );

  res.json(result.rows);
};

// =====================================================
// UPDATE IMAGE
// =====================================================
export const updateImage = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { type, url } = req.body;
  const file = req.file;

  try {
    const result = await db.query("SELECT * FROM ps_images WHERE id = $1", [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Image not found" });

    const old = result.rows[0]; // old.type, old.url

    let finalUrl = old.url;

    // ================================================
    // CASE A: old gdrive → new local
    // ================================================
    if (old.type === "gdrive" && type === "local") {
      if (!file) return res.status(400).json({ error: "Need file" });

      finalUrl = `/images/${file.filename}`;
    }

    // ================================================
    // CASE B: old local → new gdrive
    // ================================================
    if (old.type === "local" && type === "gdrive") {
      const oldFilePath = path.join(UPLOAD_DIR, path.basename(old.url));
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

      finalUrl = normalizeGoogleDriveUrl(url);
    }

    // ================================================
    // CASE C: old local → still local + upload new
    // ================================================
    if (old.type === "local" && type === "local" && file) {
      const oldFilePath = path.join(UPLOAD_DIR, path.basename(old.url));
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

      finalUrl = `/images/${file.filename}`;
    }

    // ================================================
    // CASE D: old gdrive → still gdrive
    // ================================================
    if (old.type === "gdrive" && type === "gdrive") {
      finalUrl = normalizeGoogleDriveUrl(url); // update URL saja
    }

    await db.query(
      `UPDATE ps_images
       SET type = $1, url = $2, created_at = NOW()
       WHERE id = $3`,
      [type, finalUrl, id]
    );

    res.json({ message: "updated", id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update image" });
  }
};

// =====================================================
// DELETE IMAGE
// =====================================================
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const result = await db.query("SELECT * FROM ps_images WHERE id = $1", [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Image not found" });

    const image = result.rows[0];

    // Kalau lokal → hapus file fisik
    if (image.type === "local") {
      const filePath = path.join(UPLOAD_DIR, path.basename(image.url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.query("DELETE FROM ps_images WHERE id = $1", [id]);

    res.json({ message: "deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete image" });
  }
};



export const sortImages = async (req: Request, res: Response) => {
  try {
    const { order } = req.body;

    // 1. Pastikan order ada dan array
    if (!order || !Array.isArray(order)) {
      return res.status(400).json({
        error: "Invalid payload: 'order' must be an array."
      });
    }

    for (const item of order) {
      // 2. Validasi field
      if (!item.id || item.position === undefined) {
        return res.status(400).json({
          error: "Each item must contain { id, position }"
        });
      }

      // 3. Convert dan validasi NaN
      const id = Number(item.id);
      const position = Number(item.position);

      if (isNaN(id) || isNaN(position)) {
        return res.status(400).json({
          error: `Invalid id/position. Received id=${item.id}, position=${item.position}`
        });
      }

      // 4. Update ke DB
      await db.query(
        "UPDATE ps_images SET position = $1 WHERE id = $2",
        [position, id]
      );
    }

    return res.json({ success: true });

  } catch (err: any) {
    console.error("Reorder images error:", err);

    return res.status(500).json({
      error: "Failed to reorder images",
      detail: err.message
    });
  }
};

