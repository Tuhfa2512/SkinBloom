import axios from "axios";
import FormData from "form-data";

async function testImageKitUpload() {
    try {
        console.log("🧪 Testing ImageKit upload with real credentials...");

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

        console.log("📤 Attempting upload to /api/upload/consultation...");

        // Try to upload without authentication first
        const response = await axios.post(
            "http://localhost:5000/api/upload/consultation",
            formData,
            {
                headers: formData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        console.log("✅ Upload successful!");
        console.log("📋 Response:", response.data);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log(
                "✅ Server is responding correctly (401 Unauthorized - needs authentication)"
            );
            console.log(
                "💡 This confirms the server is working, we just need to authenticate"
            );
        } else if (error.response?.status === 500) {
            console.log("❌ Server error:", error.response?.data);
            if (
                error.response?.data?.error?.includes("cannot be authenticated")
            ) {
                console.log("❌ ImageKit authentication still failing");
                console.log("💡 Double-check your ImageKit private key");
            }
        } else {
            console.log("ℹ️  Response status:", error.response?.status);
            console.log("ℹ️  Response data:", error.response?.data);
        }
    }
}

testImageKitUpload();
