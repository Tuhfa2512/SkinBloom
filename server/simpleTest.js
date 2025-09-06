// Check for tickets with consultationPdfUrl that might be causing 404s
console.log("🔍 Testing simple script...");
console.log("Current directory:", process.cwd());

// Test basic functionality
const testId = "68bb44835bbffa19e1c3ca1b";
console.log("Test ticket ID from error:", testId);

// Test path construction
import path from "path";
const testPath = path.join(process.cwd(), "uploads", "consultations");
console.log("Expected consultations path:", testPath);

import fs from "fs";
console.log("Directory exists:", fs.existsSync(testPath));

// List any existing files in consultations directory
try {
    const files = fs.readdirSync(testPath);
    console.log("Files in consultations directory:", files);
} catch (error) {
    console.log("Error reading directory:", error.message);
}

console.log("✅ Test completed!");
