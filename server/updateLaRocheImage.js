import mongoose from "mongoose";
import Product from "./models/Product.js";

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI secret is missing");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const result = await Product.updateOne(
    { name: "La Roche-Posay Toleriane Hydrating Gentle Cleanser" },
    {
      $set: {
        image: "https://skin-bloom.vercel.app/products/la-roche-posay-cleanser.jpg"
      }
    }
  );

  console.log("Matched:", result.matchedCount);
  console.log("Modified:", result.modifiedCount);

  await mongoose.disconnect();
}

main().catch(console.error);
