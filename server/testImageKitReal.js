import axios from "axios";
import FormData from "form-data";
import fs from "fs";

async function testImageKitUpload() {
    try {
        console.log("🧪 Testing ImageKit upload with real credentials...");

        // First, login to get a token
        const loginResponse = await axios.post(
            "http://localhost:5000/api/auth/login",
            {
                email: "test@test.com",
                password: "test123",
            }
        );

        console.log("✅ Login successful");
        const token = loginResponse.data.token;

        // Create a simple test image (1x1 pixel PNG)
        const testImageBuffer = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            "base64"
        );

        // Create form data
        const formData = new FormData();
        formData.append("photo", testImageBuffer, {
            filename: "test-image.png",
            contentType: "image/png",
        });

        console.log("📤 Uploading test image to ImageKit...");

        // Test consultation photo upload
        const uploadResponse = await axios.post(
            "http://localhost:5000/api/upload/consultation",
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...formData.getHeaders(),
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        console.log("✅ Upload successful!");
        console.log("📋 Response:", {
            message: uploadResponse.data.message,
            photoUrl: uploadResponse.data.photoUrl,
            fileId: uploadResponse.data.fileId,
            thumbnail: uploadResponse.data.thumbnail,
        });

        console.log("\n🎉 ImageKit integration is working!");
    } catch (error) {
        console.error("❌ Test failed:", error.response?.data || error.message);

        if (error.response?.data?.error?.includes("cannot be authenticated")) {
            console.log(
                "\n💡 SOLUTION: Replace the placeholder private key in server/middleware/upload.js"
            );
            console.log(
                "   with your actual ImageKit private key from https://imagekit.io/dashboard"
            );
        }
    }
}

testImageKitUpload();
