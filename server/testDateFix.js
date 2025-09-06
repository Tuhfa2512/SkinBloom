import axios from "axios";

async function testDateFix() {
    try {
        console.log("🧪 Testing date formatting fix...");

        // Test the dermatologist slots endpoint that was failing
        const response = await axios.get(
            "http://localhost:5000/api/bookings/dermatologist/68b6d1e0f525d6bbc63760e1/slots?date=2025-09-05&sessionType=photo_review"
        );

        console.log("✅ Date formatting fix successful!");
        console.log("Response:", response.data);
    } catch (error) {
        if (
            error.response?.status === 500 &&
            error.response?.data?.error?.includes("RangeError")
        ) {
            console.log("❌ Date formatting issue still exists");
        } else {
            console.log(
                "ℹ️  Different error (may be expected):",
                error.response?.data || error.message
            );
        }
    }
}

testDateFix();
