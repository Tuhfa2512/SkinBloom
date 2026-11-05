import mongoose from "mongoose";
import Product from "./models/Product.js";

const oldName = "Kojic Acid Dark Spot Corrector (Naturium)";
const newName = "Naturium Tranexamic Topical Acid 5%";
const newImage =
  "https://skin-bloom.vercel.app/products/naturium-tranexamic-topical-acid-5.jpg";

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Product.find({
    name: { $in: [oldName, newName] }
  });

  if (existing.length !== 1) {
    throw new Error(
      `Expected exactly one matching product, found ${existing.length}`
    );
  }

  const product = existing[0];

  console.log("Current name:", product.name);
  console.log("Current description:", product.description);
  console.log("Current ingredients:", product.ingredients);
  console.log("New name:", newName);
  console.log("New image:", newImage);

  if (!process.argv.includes("--apply")) {
    console.log("DRY RUN — no changes made.");
    return;
  }

  const result = await Product.updateOne(
    { _id: product._id, name: oldName },
    {
      $set: {
        name: newName,
        image: newImage,
        description: "A topical skincare treatment formulated with 5% tranexamic acid to help improve the appearance of uneven skin tone and dark spots.",
        ingredients: [],
        updatedAt: new Date()
      }
    }
  );

  console.log("Actually updated:", result.modifiedCount);
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
