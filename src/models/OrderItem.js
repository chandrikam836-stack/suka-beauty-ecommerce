const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OrderItem = sequelize.define("OrderItem", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false }, // snapshot of product name
  image: { type: DataTypes.STRING },
  price: { type: DataTypes.FLOAT, allowNull: false }, // price paid per unit
  quantity: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = OrderItem;
