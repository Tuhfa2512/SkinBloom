// SDK initialization
import ImageKit from "imagekit";

export const imagekit = new ImageKit({
    publicKey: "public_uYn8YrnqRSiXK8cAWLvdu8BufSA=",
    privateKey: "private_xI5pbsKbTjIPEs/TH3Wm+kvCraQ=",
    urlEndpoint: "https://ik.imagekit.io/faahim06",
});

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sharp from "sharp";

// Use memory storage for ImageKit uploads
const storage = multer.memoryStorage();

const allowed = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    // Common iPhone formats
    "image/heic",
    "image/heif",
]);

const fileFilter = (req, file, cb) => {
    // Some browsers send HEIC as application/octet-stream, allow by extension
    const ext = path.extname(file.originalname || "").toLowerCase();
    const isHeicByExt = ext === ".heic" || ext === ".heif";

    if (allowed.has(file.mimetype) || isHeicByExt) {
        return cb(null, true);
    }

    cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and HEIC/HEIF allowed."), false);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
    // Bump the limit to better support modern phone photos
    fileSize: 15 * 1024 * 1024, // 15MB
        files: 10,
    },
});

export function handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case "LIMIT_FILE_SIZE":
                return res
                    .status(400)
                    .json({ message: "File too large. Maximum size is 15MB." });
            case "LIMIT_FILE_COUNT":
                return res
                    .status(400)
                    .json({ message: "Too many files. Maximum is 10 files." });
            case "LIMIT_UNEXPECTED_FILE":
                return res
                    .status(400)
                    .json({ message: "Unexpected file field." });
            default:
                return res
                    .status(400)
                    .json({ message: "Upload error: " + err.message });
        }
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
}

// Upload to ImageKit
export const uploadToImageKit = async (file, folder = "uploads") => {
    try {
        const ext = path.extname(file.originalname || "").toLowerCase();
        const isHeic = ext === ".heic" || ext === ".heif";

        // Convert HEIC/HEIF to JPEG buffer for compatibility
        let bufferToUpload = file.buffer;
        let outExt = ext || ".jpg";
        if (isHeic) {
            try {
                bufferToUpload = await sharp(file.buffer).jpeg({ quality: 90 }).toBuffer();
                outExt = ".jpg";
            } catch (convErr) {
                console.warn("HEIC conversion failed, using original buffer:", convErr?.message || convErr);
            }
        }

        const result = await imagekit.upload({
            file: bufferToUpload,
            fileName: `${Date.now()}-${Math.round(
                Math.random() * 1e9
            )}${outExt}`,
            folder: folder,
            // No transformation here; we pre-convert buffers when needed
        });

        return {
            url: result.url,
            fileId: result.fileId,
            name: result.name,
            thumbnail: result.thumbnail,
            height: result.height,
            width: result.width,
            size: result.size,
        };
    } catch (error) {
        console.error("ImageKit upload error:", error?.message || error);
        // Fallback: save locally so the app keeps working in dev/offline
        try {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const uploadsRoot = path.join(__dirname, "..", "uploads");
            const targetDir = path.join(uploadsRoot, folder);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            // Use the same converted buffer logic for local fallback
            const originalExt = path.extname(file.originalname || "").toLowerCase();
            const heic = originalExt === ".heic" || originalExt === ".heif";
            let localBuffer = file.buffer;
            let localExt = originalExt || ".jpg";
            if (heic) {
                try {
                    localBuffer = await sharp(file.buffer).jpeg({ quality: 90 }).toBuffer();
                    localExt = ".jpg";
                } catch (e) {
                    console.warn("Local HEIC conversion failed, saving original buffer:", e?.message || e);
                }
            }
            const localName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${localExt}`;
            const localPath = path.join(targetDir, localName);
            fs.writeFileSync(localPath, localBuffer);

            const port = process.env.PORT || 5000;
            const base = process.env.BACKEND_URL || `http://localhost:${port}`;
            return {
                url: `${base}/uploads/${folder}/${localName}`,
                fileId: `local_${localName}`,
                name: localName,
                thumbnail: `${base}/uploads/${folder}/${localName}`,
                height: null,
                width: null,
                size: file.size,
            };
        } catch (fallbackErr) {
            console.error("Local upload fallback failed:", fallbackErr?.message || fallbackErr);
            throw new Error("Failed to upload image");
        }
    }
};

// Delete from ImageKit
export const deleteFromImageKit = async (fileId) => {
    try {
        await imagekit.deleteFile(fileId);
        return true;
    } catch (error) {
        console.error("ImageKit delete error:", error);
        return false;
    }
};
