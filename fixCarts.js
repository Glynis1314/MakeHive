require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Product = require("./models/Product");

async function fixCarts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");

    const users = await User.find({});

    for (const user of users) {
      let changed = false;

      for (const item of user.cart) {
        if (!item.name || !item.price || !item.image) {
          const product = await Product.findById(item.productId);
          if (product) {
            item.name = product.name;
            item.price = product.price;
            item.image = product.image;
            changed = true;
          }
        }
      }

      if (changed) {
        await user.save();
        console.log(`Updated cart for user: ${user.username}`);
      }
    }

    console.log("✅ All carts fixed!");
    mongoose.connection.close();
  } catch (err) {
    console.error("Error fixing carts:", err);
  }
}

fixCarts();

