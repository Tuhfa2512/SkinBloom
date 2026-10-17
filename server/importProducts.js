
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Product from "./models/Product.js";

// ============================================
// LOAD ENVIRONMENT VARIABLES
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.join(__dirname, ".env")
});

// ============================================
// IMPORT PRODUCTS FROM CSV
// ============================================

async function importProducts() {
    try {
        // Read CSV file from project root
        const csvPath = path.join(__dirname, "..", "products_60.csv");

        const csvContent = fs.readFileSync(csvPath, "utf8");

        // Split CSV into lines
        const lines = csvContent.trim().split(/\r?\n/);
        const dataLines = lines.slice(1);

        console.log(`📁 Found ${dataLines.length} products in CSV`);

        // Safety check: avoid inserting duplicates
        const existingCount = await Product.countDocuments();

        if (existingCount > 0) {
            console.log(
                `⚠️ Database already contains ${existingCount} products. Import cancelled to avoid duplicates.`
            );
            return;
        }

        const products = [];

        dataLines.forEach((line, index) => {
            try {
                // Parse CSV while handling quoted commas
                const values = [];
                let current = "";
                let inQuotes = false;

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];

                    if (char === '"') {
                        if (inQuotes && line[i + 1] === '"') {
                            current += '"';
                            i++;
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === "," && !inQuotes) {
                        values.push(current.trim());
                        current = "";
                    } else {
                        current += char;
                    }
                }

                values.push(current.trim());

                if (values.length >= 8) {
                    const [
                        name,
                        brand,
                        category,
                        skinType,
                        description,
                        step,
                        popular,
                        image
                    ] = values;

                    const cleanName = name.trim();
                    const cleanCategory = category.trim();

                    const product = {
                        name: cleanName,
                        brand: brand.trim(),
                        category: cleanCategory,

                        skinType: skinType
                            .split(";")
                            .map((s) => s.trim()),

                        description: description.trim(),

                        step: parseInt(step, 10) || 1,

                        popular: popular.toLowerCase().includes("true"),

                        image: generateProductImage(
                            cleanName,
                            cleanCategory
                        ),

                        // Demo prices
                        price: Math.floor(Math.random() * 80) + 20,

                        originalPrice:
                            Math.floor(Math.random() * 100) + 60,

                        // Demo ratings
                        rating:
                            Math.round((Math.random() * 2 + 3) * 10) / 10,

                        reviewCount:
                            Math.floor(Math.random() * 500) + 10,

                        ingredients: generateIngredients(cleanCategory),

                        benefits: generateBenefits(cleanCategory),

                        howToUse: generateHowToUse(cleanCategory),

                        inStock: true,

                        stockQuantity:
                            Math.floor(Math.random() * 50) + 10,

                        featured: Math.random() < 0.2,

                        discount:
                            Math.random() < 0.3
                                ? Math.floor(Math.random() * 30) + 10
                                : 0
                    };

                    products.push(product);
                } else {
                    console.warn(
                        `⚠️ Skipping invalid CSV line ${index + 2}`
                    );
                }
            } catch (err) {
                console.warn(
                    `⚠️ Error parsing line ${index + 2}:`,
                    err.message
                );
            }
        });

        if (products.length === 0) {
            throw new Error("No valid products found in CSV");
        }

        // Insert products without deleting existing data
        const inserted = await Product.insertMany(products);

        console.log(
            `✅ Successfully imported ${inserted.length} products`
        );

        // Display sample products
        console.log("\n📦 Sample products:");

        inserted.slice(0, 3).forEach((p) => {
            console.log(
                `- ${p.name} (${p.brand}) - $${p.price}`
            );
        });

    } catch (error) {
        console.error("❌ Import error:", error);
        throw error;
    }
}

// ============================================
// PRODUCT IMAGE GENERATOR
// ============================================

function generateProductImage(productName, category) {
    const categoryImages = {
        Cleanser: "cleanser.jpg",
        Toner: "toner.jpg",
        Serum: "serum.jpg",
        Treatment: "treatment.jpg",
        Moisturizer: "moisturizer.jpg",
        Sunscreen: "sunscreen.jpg"
    };

    const imageName = categoryImages[category] || "product.jpg";

    return `https://skinbloom-api.onrender.com/uploads/products/${imageName}`;
}

// ============================================
// PRODUCT INGREDIENTS
// ============================================

function generateIngredients(category) {
    const ingredientsByCategory = {
        Cleanser: [
            "Water",
            "Sodium Lauryl Sulfate",
            "Glycerin",
            "Cocamidopropyl Betaine",
            "Salicylic Acid"
        ],
        Toner: [
            "Water",
            "Alcohol Denat",
            "Glycolic Acid",
            "Niacinamide",
            "Witch Hazel"
        ],
        Serum: [
            "Water",
            "Hyaluronic Acid",
            "Vitamin C",
            "Niacinamide",
            "Retinol"
        ],
        Treatment: [
            "Water",
            "Benzoyl Peroxide",
            "Salicylic Acid",
            "Retinol",
            "Azelaic Acid"
        ],
        Moisturizer: [
            "Water",
            "Glycerin",
            "Ceramides",
            "Hyaluronic Acid",
            "Dimethicone"
        ],
        Sunscreen: [
            "Zinc Oxide",
            "Titanium Dioxide",
            "Octinoxate",
            "Avobenzone",
            "Water"
        ]
    };

    return ingredientsByCategory[category] || [
        "Water",
        "Glycerin",
        "Dimethicone"
    ];
}

// ============================================
// PRODUCT BENEFITS
// ============================================

function generateBenefits(category) {
    const benefitsByCategory = {
        Cleanser: [
            "Removes impurities",
            "Gentle on skin",
            "Maintains pH balance",
            "Deep cleansing"
        ],
        Toner: [
            "Balances pH",
            "Minimizes pores",
            "Removes residue",
            "Preps skin"
        ],
        Serum: [
            "Hydrates deeply",
            "Anti-aging",
            "Brightening",
            "Targets concerns"
        ],
        Treatment: [
            "Acne fighting",
            "Exfoliating",
            "Anti-inflammatory",
            "Skin renewal"
        ],
        Moisturizer: [
            "Hydrates skin",
            "Locks in moisture",
            "Softens skin",
            "Barrier protection"
        ],
        Sunscreen: [
            "UV protection",
            "Prevents sun damage",
            "Anti-aging",
            "Broad spectrum"
        ]
    };

    return benefitsByCategory[category] || [
        "Improves skin health",
        "Gentle formula",
        "Dermatologist tested"
    ];
}

// ============================================
// HOW TO USE PRODUCTS
// ============================================

function generateHowToUse(category) {
    const usageByCategory = {
        Cleanser:
            "Apply to damp skin, gently massage, rinse with lukewarm water. Use morning and evening.",

        Toner:
            "Apply to clean skin with cotton pad or pat gently with hands. Follow with serum or moisturizer.",

        Serum:
            "Apply 2-3 drops to clean skin. Gently pat and allow to absorb before next step.",

        Treatment:
            "Apply a thin layer to affected areas. Start with 2-3 times per week, increase as tolerated.",

        Moisturizer:
            "Apply to clean skin morning and evening. Massage gently until fully absorbed.",

        Sunscreen:
            "Apply generously 15 minutes before sun exposure. Reapply every 2 hours."
    };

    return usageByCategory[category] ||
        "Follow package instructions for best results.";
}

// ============================================
// CONNECT TO MONGODB AND IMPORT
// ============================================

async function main() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ Connected to MongoDB");

        await importProducts();

        console.log("✅ Product import process completed");

    } catch (error) {
        console.error("❌ Import failed:", error);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB disconnected");
    }
}

main();
