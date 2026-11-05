import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import Product from "./models/Product.js";

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI secret missing");
  }

  const mapping = JSON.parse(
    fs.readFileSync(
      path.resolve("../product_image_mapping.json"),
      "utf8"
    )
  );

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  let updated = 0;
  let unmatched = 0;

  for (const item of mapping) {
    if (!item.name || !item.image) continue;

    const result = await Product.updateOne(
      { name: item.name },
      { $set: { image: item.image } }
    );

    if (result.matchedCount === 1) {
      updated++;
    } else {
      unmatched++;
      console.log("Not found:", item.name);
    }
  }

  console.log("Matched products:", updated);
  console.log("Unmatched products:", unmatched);

  await mongoose.disconnect();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
