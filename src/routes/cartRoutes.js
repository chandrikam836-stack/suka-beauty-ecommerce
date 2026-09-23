const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/cartController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", ctrl.getCart);
router.post("/", ctrl.addToCart);
router.put("/:id", ctrl.updateCartItem);
router.delete("/:id", ctrl.removeCartItem);
router.delete("/", ctrl.clearCart);

module.exports = router;
