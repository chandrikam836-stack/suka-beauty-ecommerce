const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);

router.get("/dashboard", ctrl.dashboardStats);
router.get("/users", ctrl.listUsers);
router.put("/users/:id/toggle-role", ctrl.toggleUserRole);

module.exports = router;
