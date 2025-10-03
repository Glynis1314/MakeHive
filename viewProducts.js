const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String
});
const Product = mongoose.model("Product", ProductSchema);

async function viewProducts() {
  const products = await Product.find();
  console.log("Products in DB:");
  console.log(products);
  mongoose.disconnect();
}

viewProducts();
