require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");

const { sequelize } = require("./models");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic rate limiting on auth endpoints to slow brute force / spam
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use("/api/auth", authLimiter);

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// Optionally serve the frontend statically (same-origin, simplest deploy)
const frontendPath = path.join(__dirname, "..", "..", "frontend");
app.use(express.static(frontendPath, { index: "Home.html" }));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

sequelize
  .sync() // creates tables if they don't exist; use migrations for production schema changes
  .then(() => {
    console.log(`Database synced (${process.env.DB_DIALECT || "sqlite"})`);
    app.listen(PORT, () => console.log(`Suka Beauty API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
