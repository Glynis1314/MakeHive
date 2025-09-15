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
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Export the User model
module.exports = mongoose.model("User", UserSchema);
