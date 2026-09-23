const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendMail({ to, subject, html }) {
  // In dev, if Gmail creds aren't set up yet, just log instead of crashing.
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log("\n[MAIL - DEV MODE, no SMTP configured]");
    console.log("To:", to, "| Subject:", subject);
    console.log(html.replace(/<[^>]+>/g, " "));
    console.log("[END MAIL]\n");
    return;
  }
  await transporter.sendMail({
    from: `"Suka Beauty" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };
