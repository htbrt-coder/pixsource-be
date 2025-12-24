import path from "path";

export const normalizeGoogleDriveUrl = (url: any): string => {
  if (!url || typeof url !== "string") {
    throw new Error("URL must be a string");
  }

  const m1 = url.match(/\/d\/([^/]+)/);
  if (m1 && m1[1]) return `https://drive.google.com/uc?export=view&id=${m1[1]}`;

  const m2 = url.match(/[?&]id=([^&]+)/);
  if (m2 && m2[1]) return `https://drive.google.com/uc?export=view&id=${m2[1]}`;

  // fallback: kembalikan apa adanya (bila masih string)
  return url;
};

export const ROOT_PATH = path.join(process.cwd());
export const UPLOAD_DIR = path.join(ROOT_PATH, "uploads");
