import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

async function testImageKitUpload() {
    try {
        console.log("🧪 Testing ImageKit upload integration...");

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

        // Create a simple test image file (1x1 pixel PNG)
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

        // Test profile photo upload
        const uploadResponse = await axios.post(
            "http://localhost:5000/api/upload/profile-photo",
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
            dimensions: uploadResponse.data.dimensions,
        });

        // Test file info endpoint
        if (uploadResponse.data.fileId) {
            console.log("\n📋 Testing file info endpoint...");
            const infoResponse = await axios.get(
                `http://localhost:5000/api/upload/info/${uploadResponse.data.fileId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("✅ File info retrieved:", infoResponse.data);
        }

        console.log("\n🎉 ImageKit integration test completed successfully!");
    } catch (error) {
        console.error("❌ Test failed:", error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.log(
                "💡 Try creating a test user first with: node createTestUser.js"
            );
        }
    }
}

testImageKitUpload();
