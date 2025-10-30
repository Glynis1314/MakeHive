const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { 
    user: process.env.EMAIL_USER || "glynisdarryldmello@gmail.com", 
    pass: process.env.EMAIL_PASS || "fzftikfwqhxrygog" // Use App Password if 2FA enabled
  }
});

async function sendOrderConfirmationEmail(user, order) {
  const mailOptions = {
    from: '"MakeHive" <glynisdarryldmello@gmail.com>',
    to: user.email,
    subject: `Your MakeHive Order #${order._id} is Confirmed!`,
    html: `<h1>Thank you for your order, ${user.username}!</h1>
           <p>Your order with ID #${order._id} has been successfully placed.</p>
           <p>Total Amount: ₹${order.amount.toFixed(2)}</p>
           <p>You can view your order details in your profile.</p>`
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { transporter, sendOrderConfirmationEmail };