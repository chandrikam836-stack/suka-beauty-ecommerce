const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/categoryController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", ctrl.listCategories);
router.post("/", protect, adminOnly, ctrl.createCategory);
router.delete("/:id", protect, adminOnly, ctrl.deleteCategory);

module.exports = router;
