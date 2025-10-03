const jwt = require("jsonwebtoken");

// Replace with your actual user ID
const user = { id: "68d7a5d669078f21db72b8e0" };

// Must match the secret your backend uses
const secretKey = "your_jwt_secret_key";

// Set token expiration (optional, here 1 hour)
const token = jwt.sign(user, secretKey, { expiresIn: "1h" });

console.log("New Token:", token);
