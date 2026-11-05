require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");

const updates = [
  ["CeraVe Hydrating Cleanser", "cerave-hydrating-cleanser.jpg"],
  ["CeraVe Foaming Facial Cleanser", "cerave-foaming-facial-cleanser.jpg"],
  ["Black Girl Sunscreen SPF 30", "black-girl-sunscreen-spf-30.jpg"]
];

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing in server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const collection = mongoose.connection.db.collection("products");

  for (const [name, filename] of updates) {
    const image = `https://skin-bloom.vercel.app/products/${filename}`;

    const result = await collection.updateOne(
      { name },
      { $set: { image } }
    );

    console.log(
      `${name}: matched=${result.matchedCount}, modified=${result.modifiedCount}`
    );
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
