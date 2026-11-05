
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import Product from "./models/Product.js";

const filePath = path.resolve(
  "../verified_product_images.json"
);

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI secret missing");
  }

  const images = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  let updated = 0;
  let unmatched = 0;

  for (const item of images) {
    if (!item.name || !item.image) continue;

    const result = await Product.updateOne(
      { name: item.name },
      { $set: { image: item.image } }
    );

    if (result.matchedCount > 0) {
      updated++;
    } else {
      unmatched++;
      console.log("Not found:", item.name);
    }
  }

  console.log(`Updated products: ${updated}`);
  console.log(`Unmatched products: ${unmatched}`);
}

main()
  .catch(console.error)
  .finally(() => mongoose.disconnect());
