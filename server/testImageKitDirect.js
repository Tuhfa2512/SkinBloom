import ImageKit from "imagekit";

// Test ImageKit directly
const imagekit = new ImageKit({
    publicKey: "public_uYn8YrnqRSiXK8cAWLvdu8BufSA=",
    privateKey: "private_xI5pbsKbTjIPEs/TH3Wm+kvCraQ=",
    urlEndpoint: "https://ik.imagekit.io/faahim06",
});

async function testImageKitDirect() {
    try {
        console.log("🧪 Testing ImageKit connection directly...");

        // Create a simple test image (1x1 pixel PNG)
        const testImageBuffer = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            "base64"
        );

        console.log("📤 Uploading test image...");

        const result = await imagekit.upload({
            file: testImageBuffer,
            fileName: `test-${Date.now()}.png`,
            folder: "test-uploads",
        });

        console.log("✅ Upload successful!");
        console.log("📋 ImageKit Response:", {
            url: result.url,
            fileId: result.fileId,
            name: result.name,
            thumbnail: result.thumbnail,
            size: result.size,
        });

        console.log("\n🎉 ImageKit is working perfectly!");
    } catch (error) {
        console.error("❌ ImageKit test failed:", error.message);

        if (error.message.includes("cannot be authenticated")) {
            console.log(
                "\n💡 The private key might be incorrect. Please double-check your ImageKit credentials."
            );
        }
    }
}

testImageKitDirect();
