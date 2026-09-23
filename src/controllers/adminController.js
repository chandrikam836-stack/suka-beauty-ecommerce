const { User, Order, Product, OrderItem } = require("../models");
const { Op } = require("sequelize");

exports.dashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.count({ where: { role: "customer" } });
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();
    const paidOrders = await Order.findAll({ where: { paymentStatus: "paid" } });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    const pendingReturns = await Order.count({ where: { status: "return_requested" } });
    const lowStock = await Product.count({ where: { stock: { [Op.lte]: 5 } } });

    const recentOrders = await Order.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
      include: [{ model: User, attributes: ["name", "email"] }],
    });

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingReturns,
      lowStock,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "phone", "role", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.toggleUserRole = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.role = user.role === "admin" ? "customer" : "admin";
    await user.save();
    res.json({ message: `User role updated to ${user.role}` });
  } catch (err) {
    next(err);
  }
};
