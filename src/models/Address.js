const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Address = sequelize.define("Address", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  label: { type: DataTypes.STRING, defaultValue: "Home" },
  fullName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  line1: { type: DataTypes.STRING, allowNull: false },
  line2: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  pincode: { type: DataTypes.STRING, allowNull: false },
  country: { type: DataTypes.STRING, defaultValue: "India" },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Address;
