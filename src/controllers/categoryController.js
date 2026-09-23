const slugify = require("slugify");
const { Category } = require("../models");

exports.listCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [["name", "ASC"]] });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const slug = slugify(name, { lower: true });
    const category = await Category.create({ name, slug });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    await category.destroy();
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
};
