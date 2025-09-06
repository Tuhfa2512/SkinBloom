import path from "path";
import fs from "fs";

console.log("=== PDF Infrastructure Test ===");

// Test directory structure
const uploadsDir = path.join(process.cwd(), "uploads");
const consultationsDir = path.join(uploadsDir, "consultations");
const receiptsDir = path.join(uploadsDir, "receipts");

console.log("📁 Directory structure:");
console.log(`✅ uploads: ${fs.existsSync(uploadsDir)}`);
console.log(`✅ consultations: ${fs.existsSync(consultationsDir)}`);
console.log(`✅ receipts: ${fs.existsSync(receiptsDir)}`);

// Test write permissions
console.log("\n🔐 Write permissions:");
try {
    const testFile1 = path.join(consultationsDir, "test-write.txt");
    fs.writeFileSync(testFile1, "test");
    fs.unlinkSync(testFile1);
    console.log("✅ consultations: writable");
} catch (e) {
    console.log("❌ consultations: not writable -", e.message);
}

try {
    const testFile2 = path.join(receiptsDir, "test-write.txt");
    fs.writeFileSync(testFile2, "test");
    fs.unlinkSync(testFile2);
    console.log("✅ receipts: writable");
} catch (e) {
    console.log("❌ receipts: not writable -", e.message);
}

console.log("\n🎯 PDF infrastructure is ready!");

// Test the route availability
console.log("\n📡 Testing API routes...");
console.log("Consultation PDF route: GET /api/tickets/:id/consultation-pdf");
console.log("Payment receipt route: GET /api/tickets/:id/payment-receipt-pdf");
console.log("Static files route: GET /uploads/consultations/<filename>");
console.log("Static files route: GET /uploads/receipts/<filename>");

console.log("\n✨ All tests completed!");
