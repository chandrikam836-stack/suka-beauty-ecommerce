const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/wishlistController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", ctrl.getWishlist);
router.post("/", ctrl.addToWishlist);
router.delete("/:productId", ctrl.removeFromWishlist);

module.exports = router;
