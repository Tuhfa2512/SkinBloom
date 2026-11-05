import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import Product from "./models/Product.js";

const root = path.resolve(process.cwd(), "..");
const csvPath = path.join(root, "skinbloom_image_publish_mapping.csv");

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some(x => x.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift().map(x => x.trim());
  return rows.map(values =>
    Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]))
  );
}

async function main() {
  const apply = process.argv.includes("--apply");

  if (!fs.existsSync(csvPath)) {
    throw new Error("Mapping CSV not found");
  }

  const rows = parseCSV(fs.readFileSync(csvPath, "utf8"));
  if (rows.length !== 48) {
    throw new Error(`Expected 48 rows, found ${rows.length}`);
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing. Set it in Codespaces secrets.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  let matched = 0, missing = 0, ambiguous = 0;
  let changes = 0, unchanged = 0;

  const operations = [];
  const seen = new Set();

  for (const row of rows) {
    const name = row.product_name?.trim();
    const image = row.image_url?.trim();

    if (!name || !image || seen.has(name)) {
      throw new Error(`Invalid or duplicate CSV entry: ${name}`);
    }
    seen.add(name);

    if (!image.startsWith("https://skin-bloom.vercel.app/products/")) {
      throw new Error(`Unexpected image URL: ${name}`);
    }

    const products = await Product.find({ name })
      .select("_id name image")
      .lean();

    if (products.length === 0) {
      missing++;
      console.log("MISSING:", name);
      continue;
    }

    if (products.length > 1) {
      ambiguous++;
      console.log("AMBIGUOUS:", name);
      continue;
    }

    matched++;

    if (products[0].image === image) {
      unchanged++;
      continue;
    }

    changes++;
    operations.push({
      updateOne: {
        filter: {
          _id: products[0]._id,
          image: products[0].image
        },
        update: { $set: { image } }
      }
    });
  }

  console.log("\nMode:", apply ? "APPLY" : "DRY RUN");
  console.log("CSV rows:", rows.length);
  console.log("Unique matches:", matched);
  console.log("Missing:", missing);
  console.log("Ambiguous:", ambiguous);
  console.log("Already correct:", unchanged);
  console.log("Would change:", changes);

  if (apply) {
    if (matched !== 48 || missing || ambiguous) {
      throw new Error("Update blocked: all 48 products must match uniquely.");
    }
    const result = operations.length
      ? await Product.bulkWrite(operations, { ordered: true })
      : { modifiedCount: 0 };
    console.log("Actually updated:", result.modifiedCount);
  } else {
    console.log("No MongoDB changes made.");
  }
}

main()
  .catch(err => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
