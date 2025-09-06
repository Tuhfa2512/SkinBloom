// Simple test to check if PDF directories exist and are accessible
import fs from "fs";
import path from "path";

console.log("🔍 Testing PDF setup...");

const uploadsDir = path.join(process.cwd(), "uploads");
const consultationsDir = path.join(uploadsDir, "consultations");
const receiptsDir = path.join(uploadsDir, "receipts");

console.log(`Current working directory: ${process.cwd()}`);
console.log(`Uploads directory: ${uploadsDir}`);
console.log(`Consultations directory: ${consultationsDir}`);
console.log(`Receipts directory: ${receiptsDir}`);

// Check if directories exist
console.log(`\n📁 Directory checks:`);
console.log(`  uploads exists: ${fs.existsSync(uploadsDir)}`);
console.log(`  consultations exists: ${fs.existsSync(consultationsDir)}`);
console.log(`  receipts exists: ${fs.existsSync(receiptsDir)}`);

// Check permissions
try {
    const testFile = path.join(consultationsDir, "test.txt");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    console.log(`  ✅ Write permission to consultations: OK`);
} catch (error) {
    console.log(
        `  ❌ Write permission to consultations: FAILED - ${error.message}`
    );
}

try {
    const testFile = path.join(receiptsDir, "test.txt");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    console.log(`  ✅ Write permission to receipts: OK`);
} catch (error) {
    console.log(`  ❌ Write permission to receipts: FAILED - ${error.message}`);
}

console.log("\n🎯 PDF setup test completed!");
