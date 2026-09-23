const { Op } = require("sequelize");
const slugify = require("slugify");
const { Product, Category, Review, User } = require("../models");

// ---- PUBLIC: list with filters/search/pagination ----
exports.listProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      skinType,
      minPrice,
      maxPrice,
      sort, // price_asc, price_desc, newest, rating
      page = 1,
      limit = 12,
    } = req.query;

    const where = { isActive: true };
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (brand) where.brand = brand;
    if (skinType) where.skinType = skinType;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }

    const include = [{ model: Category, attributes: ["id", "name", "slug"] }];
    if (category) {
      include[0].where = { slug: category };
    }

    let order = [["createdAt", "DESC"]];
    if (sort === "price_asc") order = [["price", "ASC"]];
    if (sort === "price_desc") order = [["price", "DESC"]];
    if (sort === "rating") order = [["ratingAvg", "DESC"]];

    const offset = (Number(page) - 1) * Number(limit);

    const { rows, count } = await Product.findAndCountAll({
      where,
      include,
      order,
      limit: Number(limit),
      offset,
    });

    res.json({
      products: rows,
      total: count,
      page: Number(page),
      pages: Math.ceil(count / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// ---- PUBLIC: autocomplete search suggestions ----
exports.searchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const products = await Product.findAll({
      where: { name: { [Op.like]: `%${q}%` }, isActive: true },
      attributes: ["id", "name", "slug", "price", "images"],
      limit: 8,
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

// ---- PUBLIC: single product by slug ----
exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug },
      include: [{ model: Category }],
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

// ---- ADMIN: create product ----
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, brand, skinType, price, discountPrice, stock, categoryId } = req.body;
    const images = (req.files || []).map((f) => f.path); // Cloudinary URLs

    const slug = slugify(name, { lower: true }) + "-" + Date.now().toString().slice(-5);

    const product = await Product.create({
      name,
      slug,
      description,
      brand,
      skinType,
      price,
      discountPrice: discountPrice || null,
      stock,
      categoryId,
      images,
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

// ---- ADMIN: update product ----
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const newImages = (req.files || []).map((f) => f.path);
    const updates = { ...req.body };
    if (newImages.length) {
      updates.images = [...product.images, ...newImages];
    }

    await product.update(updates);
    res.json(product);
  } catch (err) {
    next(err);
  }
};

// ---- ADMIN: delete product ----
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await product.destroy();
    res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
};

// ---- ADMIN: list all (incl. inactive) for management ----
exports.adminListProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({ include: [Category], order: [["createdAt", "DESC"]] });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

// ================== REVIEWS ==================

exports.listReviews = async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { productId: req.params.id },
      include: [{ model: User, attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const existing = await Review.findOne({ where: { productId, userId: req.user.id } });
    if (existing) return res.status(409).json({ message: "You already reviewed this product" });

    const review = await Review.create({ rating, comment, productId, userId: req.user.id });

    // Recalculate aggregate rating
    const all = await Review.findAll({ where: { productId } });
    const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
    product.ratingAvg = Math.round(avg * 10) / 10;
    product.numReviews = all.length;
    await product.save();

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};
