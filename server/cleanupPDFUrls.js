import mongoose from "mongoose";
import Ticket from "./models/Ticket.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

async function checkAndCleanPDFUrls() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected");

        // Find all tickets with consultation PDF URLs
        const tickets = await Ticket.find({
            consultationPdfUrl: { $exists: true, $ne: null },
        })
            .select("_id consultationPdfUrl")
            .limit(10);

        console.log(`Found ${tickets.length} tickets with PDF URLs`);

        for (const ticket of tickets) {
            const pdfUrl = ticket.consultationPdfUrl;
            console.log(`\nTicket ${ticket._id}:`);
            console.log(`  PDF URL: ${pdfUrl}`);

            // Check if file exists
            const filePath = path.join(
                process.cwd(),
                pdfUrl.replace(/^\//, "")
            );
            const exists = fs.existsSync(filePath);
            console.log(`  File exists: ${exists}`);

            if (!exists) {
                console.log(`  ❌ File missing, clearing URL from database`);
                // Clear the invalid URL
                await Ticket.updateOne(
                    { _id: ticket._id },
                    { $unset: { consultationPdfUrl: 1 } }
                );
                console.log(`  ✅ Cleared invalid PDF URL`);
            }
        }

        console.log("\n🧹 PDF URL cleanup completed");
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkAndCleanPDFUrls().catch(console.error);
