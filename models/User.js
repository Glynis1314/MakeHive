const mongoose = require("mongoose");

// Define the User schema
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true, // removes extra spaces
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // store all emails in lowercase
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // ensure passwords are at least 6 chars
    },
      // Cart: array of { productId, quantity }
      cart: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
          },
          quantity: {
            type: Number,
            default: 1,
          },
        },
      ],
      role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
      }
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Export the User model
module.exports = mongoose.model("User", UserSchema);
