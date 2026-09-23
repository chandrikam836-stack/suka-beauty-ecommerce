const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public (specific paths BEFORE the generic "/:slug" catch-all)
router.get("/", ctrl.listProducts);
router.get("/search/suggestions", ctrl.searchSuggestions);
router.get("/admin/all", protect, adminOnly, ctrl.adminListProducts);

// Admin mutations
router.post("/", protect, adminOnly, upload.array("images", 6), ctrl.createProduct);
router.put("/:id", protect, adminOnly, upload.array("images", 6), ctrl.updateProduct);
router.delete("/:id", protect, adminOnly, ctrl.deleteProduct);

// Reviews (id-based, must come before the slug catch-all since both are "/:something")
router.get("/:id/reviews", ctrl.listReviews);
router.post("/:id/reviews", protect, ctrl.createReview);

// Generic slug lookup - keep LAST
router.get("/:slug", ctrl.getProductBySlug);

module.exports = router;
