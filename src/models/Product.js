const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Product = sequelize.define("Product", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  brand: { type: DataTypes.STRING },
  skinType: { type: DataTypes.STRING }, // e.g. Oily, Dry, Combination, All
  price: { type: DataTypes.FLOAT, allowNull: false },
  discountPrice: { type: DataTypes.FLOAT },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  images: {
    type: DataTypes.TEXT, // JSON-stringified array of Cloudinary URLs
    defaultValue: "[]",
    get() {
      const raw = this.getDataValue("images");
      try { return JSON.parse(raw || "[]"); } catch { return []; }
    },
    set(val) {
      this.setDataValue("images", JSON.stringify(val || []));
    },
  },
  ratingAvg: { type: DataTypes.FLOAT, defaultValue: 0 },
  numReviews: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Product;
