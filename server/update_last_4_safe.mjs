import mongoose from "mongoose";
import fs from "node:fs";
import Product from "./models/Product.js";

const normalize = s => s
  .normalize("NFKC")
  .toLowerCase()
  .replace(/[‐‑‒–—−]/g, "-")
  .replace(/[‘’]/g, "'")
  .replace(/\s+/g, " ")
  .trim();

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");

  const lines = fs.readFileSync(
    "../skinbloom_last_4_mapping.csv", "utf8"
  ).trim().split(/\r?\n/).slice(1);

  if (lines.length !== 4) throw new Error("Expected 4 products");

  await mongoose.connect(process.env.MONGO_URI);

  const products = await Product.find({})
    .select("_id name image")
    .lean();

  const updates = [];

  for (const line of lines) {
    const comma = line.indexOf(",");
    const name = line.slice(0, comma).trim();
    const image = line.slice(comma + 1).trim();

    if (!image.startsWith("https://skin-bloom.vercel.app/products/")) {
      throw new Error("Invalid image URL: " + name);
    }

    const matches = products.filter(
      p => normalize(p.name) === normalize(name)
    );

    if (matches.length !== 1) {
      console.log("MATCH ERROR:", name, "Found:", matches.length);
      throw new Error("Update cancelled. No changes made.");
    }

    console.log("MATCH:", matches[0].name);
    updates.push({
      id: matches[0]._id,
      oldImage: matches[0].image,
      newImage: image
    });
  }

  console.log("\nAll 4 products matched uniquely.");

  if (!process.argv.includes("--apply")) {
    console.log("DRY RUN: No database changes.");
    return;
  }

  let updated = 0;

  for (const item of updates) {
    const result = await Product.updateOne(
      { _id: item.id, image: item.oldImage },
      { $set: { image: item.newImage } }
    );
    updated += result.modifiedCount;
  }

  console.log("Actually updated:", updated);
}

main()
  .catch(e => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
