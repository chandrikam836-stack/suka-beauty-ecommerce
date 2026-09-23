const { Wishlist, Product, Category } = require("../models");

exports.getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [{ model: Product, include: [Category] }],
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const existing = await Wishlist.findOne({ where: { userId: req.user.id, productId } });
    if (existing) return res.status(200).json(existing);
    const item = await Wishlist.create({ userId: req.user.id, productId });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const item = await Wishlist.findOne({ where: { userId: req.user.id, productId: req.params.productId } });
    if (!item) return res.status(404).json({ message: "Not in wishlist" });
    await item.destroy();
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    next(err);
  }
};
