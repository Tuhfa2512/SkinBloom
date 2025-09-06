import express from "express";
import {
    upload,
    handleUploadError,
    uploadToImageKit,
    deleteFromImageKit,
} from "../middleware/upload.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Profile photo upload
router.post(
    "/profile-photo",
    authRequired,
    upload.single("photo"),
    handleUploadError,
    async (req, res) => {
        try {
            console.log("Profile photo upload request received");
            console.log("User:", req.user);

            if (!req.file) {
                console.log("No file in request");
                return res.status(400).json({ message: "No file uploaded" });
            }

            console.log("File details:", {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            });

            // Upload to ImageKit
            const uploadResult = await uploadToImageKit(req.file, "profiles");

            console.log("ImageKit upload result:", uploadResult);

            const response = {
                message: "Photo uploaded successfully",
                photoUrl: uploadResult.url,
                fileId: uploadResult.fileId,
                thumbnail: uploadResult.thumbnail,
                dimensions: {
                    width: uploadResult.width,
                    height: uploadResult.height,
                },
            };

            console.log("Sending response:", response);
            res.json(response);
        } catch (error) {
            console.error("Profile photo upload error:", error);
            console.error("Error stack:", error.stack);
            res.status(500).json({
                message: "Upload failed",
                error: error.message,
            });
        }
    }
);

// Consultation photo upload
router.post(
    "/consultation",
    authRequired,
    upload.single("photo"),
    handleUploadError,
    async (req, res) => {
        try {
            console.log("Consultation photo upload request received");
            console.log("User:", req.user);

            if (!req.file) {
                console.log("No file in request");
                return res.status(400).json({ message: "No file uploaded" });
            }

            console.log("File details:", {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            });

            // Upload to ImageKit
            const uploadResult = await uploadToImageKit(
                req.file,
                "consultation"
            );

            console.log("ImageKit upload result:", uploadResult);

            const response = {
                message: "Consultation photo uploaded successfully",
                photoUrl: uploadResult.url,
                fileId: uploadResult.fileId,
                thumbnail: uploadResult.thumbnail,
                dimensions: {
                    width: uploadResult.width,
                    height: uploadResult.height,
                },
            };

            console.log("Sending response:", response);
            res.json(response);
        } catch (error) {
            console.error("Consultation photo upload error:", error);
            console.error("Error stack:", error.stack);
            res.status(500).json({
                message: "Upload failed",
                error: error.message,
            });
        }
    }
);

// Skin photo upload (for analysis)
router.post(
    "/skin-photo",
    authRequired,
    upload.single("photo"),
    handleUploadError,
    async (req, res) => {
        try {
            console.log("Skin photo upload request received");
            console.log("User:", req.user);

            if (!req.file) {
                console.log("No file in request");
                return res.status(400).json({ message: "No file uploaded" });
            }

            console.log("File details:", {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            });

            // Upload to ImageKit
            const uploadResult = await uploadToImageKit(
                req.file,
                "consultation"
            );

            console.log("ImageKit upload result:", uploadResult);

            const response = {
                message: "Skin photo uploaded successfully",
                photoUrl: uploadResult.url,
                fileId: uploadResult.fileId,
                thumbnail: uploadResult.thumbnail,
                dimensions: {
                    width: uploadResult.width,
                    height: uploadResult.height,
                },
            };

            console.log("Sending response:", response);
            res.json(response);
        } catch (error) {
            console.error("Skin photo upload error:", error);
            console.error("Error stack:", error.stack);
            res.status(500).json({
                message: "Upload failed",
                error: error.message,
            });
        }
    }
);

// Multiple photos upload
router.post(
    "/multiple",
    authRequired,
    upload.array("photos", 10),
    handleUploadError,
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: "No files uploaded" });
            }

            // Upload all files to ImageKit
            const uploadPromises = req.files.map((file) =>
                uploadToImageKit(file, "uploads")
            );
            const uploadResults = await Promise.all(uploadPromises);

            const photos = uploadResults.map((result, index) => ({
                url: result.url,
                fileId: result.fileId,
                thumbnail: result.thumbnail,
                originalName: req.files[index].originalname,
                dimensions: {
                    width: result.width,
                    height: result.height,
                },
            }));

            res.json({
                message: "Photos uploaded successfully",
                photos: photos,
            });
        } catch (error) {
            console.error("Upload error:", error);
            res.status(500).json({
                message: "Upload failed",
                error: error.message,
            });
        }
    }
);

// Delete uploaded file from ImageKit
router.delete("/:fileId", authRequired, async (req, res) => {
    try {
        const fileId = req.params.fileId;

        const deleted = await deleteFromImageKit(fileId);

        if (deleted) {
            res.json({ message: "File deleted successfully", fileId });
        } else {
            res.status(404).json({
                message: "File not found or could not be deleted",
            });
        }
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({
            message: "Delete failed",
            error: error.message,
        });
    }
});

// Get file info from ImageKit
router.get("/info/:fileId", authRequired, async (req, res) => {
    try {
        const fileId = req.params.fileId;

        // Import ImageKit instance
        const { imagekit } = await import("../middleware/upload.js");

        // Get file details from ImageKit
        const fileDetails = await imagekit.getFileDetails(fileId);

        res.json({
            fileId: fileDetails.fileId,
            name: fileDetails.name,
            url: fileDetails.url,
            thumbnail: fileDetails.thumbnail,
            size: fileDetails.size,
            dimensions: {
                width: fileDetails.width,
                height: fileDetails.height,
            },
            createdAt: fileDetails.createdAt,
        });
    } catch (error) {
        console.error("File info error:", error);
        res.status(500).json({
            message: "Failed to get file info",
            error: error.message,
        });
    }
});

export default router;
