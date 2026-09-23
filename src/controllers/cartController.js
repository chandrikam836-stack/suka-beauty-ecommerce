const { CartItem, Product, Category } = require("../models");

exports.getCart = async (req, res, next) => {
  try {
    const items = await CartItem.findAll({
      where: { userId: req.user.id },
      include: [{ model: Product, include: [Category] }],
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.stock < quantity) return res.status(400).json({ message: "Insufficient stock" });

    let item = await CartItem.findOne({ where: { userId: req.user.id, productId } });
    if (item) {
      item.quantity += Number(quantity);
      await item.save();
    } else {
      item = await CartItem.create({ userId: req.user.id, productId, quantity });
    }
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const item = await CartItem.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    if (quantity <= 0) {
      await item.destroy();
      return res.json({ message: "Item removed from cart" });
    }
    item.quantity = quantity;
    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.removeCartItem = async (req, res, next) => {
  try {
    const item = await CartItem.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ message: "Cart item not found" });
    await item.destroy();
    res.json({ message: "Item removed" });
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    await CartItem.destroy({ where: { userId: req.user.id } });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
};
