// SDK initialization
import ImageKit from "imagekit";

export const imagekit = new ImageKit({
    publicKey: "public_uYn8YrnqRSiXK8cAWLvdu8BufSA=",
    privateKey: "private_xI5pbsKbTjIPEs/TH3Wm+kvCraQ=",
    urlEndpoint: "https://ik.imagekit.io/faahim06",
});

import multer from "multer";
import path from "path";

// Use memory storage for ImageKit uploads
const storage = multer.memoryStorage();

const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const fileFilter = (req, file, cb) => {
    if (allowed.has(file.mimetype)) return cb(null, true);
    cb(
        new Error("Invalid file type. Only JPEG, PNG, and WebP allowed."),
        false
    );
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 10,
    },
});

export function handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case "LIMIT_FILE_SIZE":
                return res
                    .status(400)
                    .json({ message: "File too large. Maximum size is 5MB." });
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
        const result = await imagekit.upload({
            file: file.buffer,
            fileName: `${Date.now()}-${Math.round(
                Math.random() * 1e9
            )}${path.extname(file.originalname)}`,
            folder: folder,
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
        console.error("ImageKit upload error:", error);
        throw new Error("Failed to upload image to ImageKit");
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
