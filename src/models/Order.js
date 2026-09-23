const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define("Order", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },

  // Address snapshot at time of order (so later address edits don't change history)
  shippingName: { type: DataTypes.STRING, allowNull: false },
  shippingPhone: { type: DataTypes.STRING, allowNull: false },
  shippingLine1: { type: DataTypes.STRING, allowNull: false },
  shippingLine2: { type: DataTypes.STRING },
  shippingCity: { type: DataTypes.STRING, allowNull: false },
  shippingState: { type: DataTypes.STRING, allowNull: false },
  shippingPincode: { type: DataTypes.STRING, allowNull: false },

  subtotal: { type: DataTypes.FLOAT, allowNull: false },
  shippingFee: { type: DataTypes.FLOAT, defaultValue: 0 },
  tax: { type: DataTypes.FLOAT, defaultValue: 0 },
  discount: { type: DataTypes.FLOAT, defaultValue: 0 },
  total: { type: DataTypes.FLOAT, allowNull: false },

  status: {
    type: DataTypes.ENUM(
      "placed",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "return_requested",
      "return_approved",
      "returned",
      "refunded",
      "rejected_return"
    ),
    defaultValue: "placed",
  },
  estimatedDelivery: { type: DataTypes.DATE },
  deliveredAt: { type: DataTypes.DATE },

  paymentMethod: { type: DataTypes.ENUM("razorpay", "cod"), defaultValue: "razorpay" },
  paymentStatus: {
    type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
    defaultValue: "pending",
  },
  razorpayOrderId: { type: DataTypes.STRING },
  razorpayPaymentId: { type: DataTypes.STRING },

  cancelReason: { type: DataTypes.STRING },
  returnReason: { type: DataTypes.STRING },
  refundStatus: {
    type: DataTypes.ENUM("not_applicable", "pending", "processing", "completed", "failed"),
    defaultValue: "not_applicable",
  },
});

module.exports = Order;
