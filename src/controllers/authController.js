const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User } = require("../models");
const generateToken = require("../utils/generateToken");
const { sendMail } = require("../config/mailer");

// ---- REGISTER ----
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashed,
    });

    const token = generateToken(user);
    res.status(201).json({
      message: "Registered successfully",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ---- LOGIN ----
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(user);
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ---- FORGOT PASSWORD ----
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    // Respond the same way whether or not user exists (avoid email enumeration)
    if (!user) return res.json({ message: "If that email exists, a reset link has been sent" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password.html?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await sendMail({
      to: email,
      subject: "Reset your Suka Beauty password",
      html: `<p>Click below to reset your password (valid for 30 minutes):</p><a href="${resetUrl}">${resetUrl}</a>`,
    });

    res.json({ message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    next(err);
  }
};

// ---- RESET PASSWORD ----
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || user.resetToken !== token || !user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    next(err);
  }
};

// ---- GET CURRENT USER ----
exports.getMe = async (req, res) => {
  const { id, name, email, phone, role } = req.user;
  res.json({ id, name, email, phone, role });
};
