const crypto = require("crypto");
const { Order, OrderItem, CartItem, Product, Address, User } = require("../models");
const razorpay = require("../config/razorpay");
const generateOrderNumber = require("../utils/orderNumber");
const generateInvoicePDF = require("../utils/invoiceGenerator");
const { sendMail } = require("../config/mailer");

const SHIPPING_FEE = 49;
const FREE_SHIPPING_THRESHOLD = 999;
const TAX_RATE = 0.05; // 5% GST example

// ---- CREATE ORDER (step 1: create Razorpay order, don't mark paid yet) ----
exports.createOrder = async (req, res, next) => {
  try {
    const { addressId, paymentMethod = "razorpay" } = req.body;

    const address = await Address.findOne({ where: { id: addressId, userId: req.user.id } });
    if (!address) return res.status(400).json({ message: "Invalid shipping address" });

    const cartItems = await CartItem.findAll({ where: { userId: req.user.id }, include: [Product] });
    if (!cartItems.length) return res.status(400).json({ message: "Cart is empty" });

    // Validate stock & compute totals
    let subtotal = 0;
    for (const item of cartItems) {
      if (!item.Product || item.Product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.Product?.name || "a product"}` });
      }
      const unitPrice = item.Product.discountPrice || item.Product.price;
      subtotal += unitPrice * item.quantity;
    }

    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + shippingFee + tax) * 100) / 100;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5); // 5-day default ETA

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: req.user.id,
      shippingName: address.fullName,
      shippingPhone: address.phone,
      shippingLine1: address.line1,
      shippingLine2: address.line2,
      shippingCity: address.city,
      shippingState: address.state,
      shippingPincode: address.pincode,
      subtotal,
      shippingFee,
      tax,
      total,
      estimatedDelivery,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
    });

    for (const item of cartItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.Product.id,
        name: item.Product.name,
        image: item.Product.images?.[0] || null,
        price: item.Product.discountPrice || item.Product.price,
        quantity: item.quantity,
      });
    }

    if (paymentMethod === "cod") {
      // Reduce stock immediately for COD orders, clear cart, done.
      for (const item of cartItems) {
        item.Product.stock -= item.quantity;
        await item.Product.save();
      }
      await CartItem.destroy({ where: { userId: req.user.id } });
      return res.status(201).json({ message: "Order placed (Cash on Delivery)", order });
    }

    // Razorpay flow: create a Razorpay order for the frontend checkout widget
    const rpOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // paise
      currency: "INR",
      receipt: order.orderNumber,
    });

    order.razorpayOrderId = rpOrder.id;
    await order.save();

    res.status(201).json({
      message: "Order created, proceed to payment",
      order,
      razorpay: {
        orderId: rpOrder.id,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---- VERIFY PAYMENT (step 2: called after Razorpay checkout success) ----
exports.verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = await Order.findOne({ where: { id: orderId, userId: req.user.id }, include: [OrderItem] });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({ message: "Payment verification failed" });
    }

    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Reduce stock now that payment is confirmed
    for (const item of order.OrderItems) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();
      }
    }
    await CartItem.destroy({ where: { userId: req.user.id } });

    const user = await User.findByPk(req.user.id);
    await sendMail({
      to: user.email,
      subject: `Order Confirmed - ${order.orderNumber}`,
      html: `<h2>Thanks for your order, ${user.name}!</h2><p>Order <b>${order.orderNumber}</b> is confirmed. Total paid: Rs. ${order.total}</p><p>Estimated delivery: ${order.estimatedDelivery.toDateString()}</p>`,
    });

    res.json({ message: "Payment verified, order confirmed", order });
  } catch (err) {
    next(err);
  }
};

// ---- LIST MY ORDERS ----
exports.myOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [OrderItem],
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// ---- GET SINGLE ORDER (with tracking info) ----
exports.getOrder = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== "admin") where.userId = req.user.id;

    const order = await Order.findOne({ where, include: [OrderItem] });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

// ---- DOWNLOAD INVOICE PDF ----
exports.downloadInvoice = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== "admin") where.userId = req.user.id;

    const order = await Order.findOne({ where, include: [OrderItem] });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentStatus !== "paid" && order.paymentMethod !== "cod") {
      return res.status(400).json({ message: "Invoice only available for paid/placed orders" });
    }
    generateInvoicePDF(res, order);
  } catch (err) {
    next(err);
  }
};

// ---- CANCEL ORDER (customer) ----
exports.cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id }, include: [OrderItem] });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (["shipped", "out_for_delivery", "delivered"].includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel an order that is already ${order.status.replace(/_/g, " ")}` });
    }
    if (["cancelled", "returned", "refunded"].includes(order.status)) {
      return res.status(400).json({ message: "Order already cancelled or closed" });
    }

    order.status = "cancelled";
    order.cancelReason = reason || "Cancelled by customer";

    // Restock items
    for (const item of order.OrderItems) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    if (order.paymentStatus === "paid") {
      order.refundStatus = "pending";
      order.paymentStatus = "refunded"; // In real life: trigger Razorpay refund API here
    }

    await order.save();
    res.json({ message: "Order cancelled", order });
  } catch (err) {
    next(err);
  }
};

// ---- REQUEST RETURN (customer, only after delivery) ----
exports.requestReturn = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "delivered") {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }
    const daysSinceDelivery = (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      return res.status(400).json({ message: "Return window (7 days) has expired" });
    }

    order.status = "return_requested";
    order.returnReason = reason;
    order.refundStatus = "pending";
    await order.save();

    res.json({ message: "Return request submitted", order });
  } catch (err) {
    next(err);
  }
};

// ================== ADMIN ==================

exports.adminListOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const orders = await Order.findAll({
      where,
      include: [OrderItem, { model: User, attributes: ["id", "name", "email"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id, { include: [User] });
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    if (status === "delivered") order.deliveredAt = new Date();

    await order.save();

    await sendMail({
      to: order.User.email,
      subject: `Order ${order.orderNumber} - ${status.replace(/_/g, " ").toUpperCase()}`,
      html: `<p>Your order <b>${order.orderNumber}</b> status has been updated to: <b>${status.replace(/_/g, " ")}</b></p>`,
    });

    res.json({ message: "Order status updated", order });
  } catch (err) {
    next(err);
  }
};

exports.adminHandleReturn = async (req, res, next) => {
  try {
    const { decision } = req.body; // "approve" | "reject"
    const order = await Order.findByPk(req.params.id, { include: [OrderItem] });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "return_requested") {
      return res.status(400).json({ message: "Order has no pending return request" });
    }

    if (decision === "approve") {
      order.status = "return_approved";
      order.refundStatus = "processing";
    } else {
      order.status = "rejected_return";
      order.refundStatus = "not_applicable";
    }
    await order.save();
    res.json({ message: `Return ${decision}d`, order });
  } catch (err) {
    next(err);
  }
};

exports.adminCompleteRefund = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.refundStatus = "completed";
    order.paymentStatus = "refunded";
    order.status = "refunded";
    await order.save();
    res.json({ message: "Refund marked as completed", order });
  } catch (err) {
    next(err);
  }
};
