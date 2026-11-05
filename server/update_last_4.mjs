import mongoose from "mongoose";
import fs from "node:fs";
import Product from "./models/Product.js";

const csv = fs.readFileSync("../skinbloom_last_4_mapping.csv", "utf8")
  .trim().split(/\r?\n/).slice(1);

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");

  const items = csv.map(line => {
    const comma = line.indexOf(",");
    return {
      name: line.slice(0, comma),
      image: line.slice(comma + 1)
    };
  });

  if (items.length !== 4) throw new Error("Expected exactly 4 products");

  await mongoose.connect(process.env.MONGO_URI);

  // First verify all products match uniquely.
  for (const item of items) {
    const count = await Product.countDocuments({ name: item.name });
    if (count !== 1) {
      throw new Error(`Unsafe match (${count}): ${item.name}`);
    }
  }

  let updated = 0;

  for (const item of items) {
    const result = await Product.updateOne(
      { name: item.name },
      { $set: { image: item.image } }
    );
    updated += result.modifiedCount;
  }

  console.log("Matched:", items.length);
  console.log("Actually updated:", updated);
}

main()
  .catch(err => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
