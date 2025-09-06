import axios from "axios";
import FormData from "form-data";

async function testImageKitWithServer() {
    try {
        console.log("🧪 Testing ImageKit integration with server...");

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

        console.log("📤 Attempting upload to server...");

        // Try to upload without authentication first to see if we get a proper error
        try {
            await axios.post(
                "http://localhost:5000/api/upload/consultation",
                formData,
                {
                    headers: formData.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                }
            );
        } catch (error) {
            if (error.response?.status === 401) {
                console.log(
                    "✅ Server is responding (got 401 Unauthorized as expected)"
                );
                console.log(
                    "💡 This means the server is working, we just need authentication"
                );
            } else if (error.response?.status === 500) {
                console.log("❌ Server error:", error.response?.data);
            } else {
                console.log(
                    "ℹ️  Response:",
                    error.response?.status,
                    error.response?.statusText
                );
            }
        }

        console.log("\n🎯 Check the server logs for ImageKit activity!");
    } catch (error) {
        console.error("❌ Test failed:", error.message);
    }
}

testImageKitWithServer();
