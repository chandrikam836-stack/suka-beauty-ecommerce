const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/profile", ctrl.getProfile);
router.put("/profile", ctrl.updateProfile);
router.put("/change-password", ctrl.changePassword);

router.get("/addresses", ctrl.listAddresses);
router.post("/addresses", ctrl.createAddress);
router.put("/addresses/:id", ctrl.updateAddress);
router.delete("/addresses/:id", ctrl.deleteAddress);

module.exports = router;
