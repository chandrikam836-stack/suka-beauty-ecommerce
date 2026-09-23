const sequelize = require("../config/db");
const User = require("./User");
const Address = require("./Address");
const Category = require("./Category");
const Product = require("./Product");
const Review = require("./Review");
const Wishlist = require("./Wishlist");
const CartItem = require("./CartItem");
const Order = require("./Order");
const OrderItem = require("./OrderItem");

// ---- User <-> Address ----
User.hasMany(Address, { foreignKey: "userId", onDelete: "CASCADE" });
Address.belongsTo(User, { foreignKey: "userId" });

// ---- Category <-> Product ----
Category.hasMany(Product, { foreignKey: "categoryId" });
Product.belongsTo(Category, { foreignKey: "categoryId" });

// ---- Product <-> Review <-> User ----
Product.hasMany(Review, { foreignKey: "productId", onDelete: "CASCADE" });
Review.belongsTo(Product, { foreignKey: "productId" });
User.hasMany(Review, { foreignKey: "userId" });
Review.belongsTo(User, { foreignKey: "userId" });

// ---- User <-> Wishlist <-> Product ----
User.hasMany(Wishlist, { foreignKey: "userId", onDelete: "CASCADE" });
Wishlist.belongsTo(User, { foreignKey: "userId" });
Product.hasMany(Wishlist, { foreignKey: "productId", onDelete: "CASCADE" });
Wishlist.belongsTo(Product, { foreignKey: "productId" });

// ---- User <-> CartItem <-> Product ----
User.hasMany(CartItem, { foreignKey: "userId", onDelete: "CASCADE" });
CartItem.belongsTo(User, { foreignKey: "userId" });
Product.hasMany(CartItem, { foreignKey: "productId", onDelete: "CASCADE" });
CartItem.belongsTo(Product, { foreignKey: "productId" });

// ---- User <-> Order ----
User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

// ---- Order <-> OrderItem <-> Product ----
Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
Product.hasMany(OrderItem, { foreignKey: "productId" });
OrderItem.belongsTo(Product, { foreignKey: "productId" });

module.exports = {
  sequelize,
  User,
  Address,
  Category,
  Product,
  Review,
  Wishlist,
  CartItem,
  Order,
  OrderItem,
};
