import mongoose from "mongoose";
import Ticket from "./models/Ticket.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;

async function testPDFGeneration() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB connected");

        // Find a ticket with consultation data
        const ticket = await Ticket.findOne({
            consultation: { $exists: true },
            $and: [
                { diagnosis: { $exists: true } },
                { recommendations: { $exists: true } },
            ],
        })
            .populate("user", "name email")
            .populate("dermatologist", "name")
            .populate("recommendedProducts.product", "name brand price");

        if (!ticket) {
            console.log("❌ No ticket with consultation found");
            return;
        }

        console.log(`✅ Found ticket: ${ticket._id}`);
        console.log(`   User: ${ticket.user.name}`);
        console.log(
            `   Dermatologist: ${ticket.dermatologist?.name || "Not assigned"}`
        );
        console.log(`   Has consultation: ${!!ticket.consultation}`);
        console.log(`   Has diagnosis: ${!!ticket.diagnosis}`);
        console.log(`   Has recommendations: ${!!ticket.recommendations}`);

        // Check if the consultation PDF URL exists
        if (ticket.consultationPdfUrl) {
            console.log(`   Existing PDF URL: ${ticket.consultationPdfUrl}`);
        } else {
            console.log("   No PDF URL stored");
        }
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("👋 MongoDB disconnected");
    }
}

testPDFGeneration();
