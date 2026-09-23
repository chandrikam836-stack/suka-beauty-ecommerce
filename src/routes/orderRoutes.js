const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.post("/", ctrl.createOrder);
router.post("/verify-payment", ctrl.verifyPayment);
router.get("/mine", ctrl.myOrders);
router.get("/:id", ctrl.getOrder);
router.get("/:id/invoice", ctrl.downloadInvoice);
router.post("/:id/cancel", ctrl.cancelOrder);
router.post("/:id/return", ctrl.requestReturn);

// Admin
router.get("/admin/all", adminOnly, ctrl.adminListOrders);
router.put("/admin/:id/status", adminOnly, ctrl.adminUpdateStatus);
router.put("/admin/:id/return-decision", adminOnly, ctrl.adminHandleReturn);
router.put("/admin/:id/complete-refund", adminOnly, ctrl.adminCompleteRefund);

module.exports = router;
