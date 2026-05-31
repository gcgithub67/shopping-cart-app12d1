const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const Order = require("../models/Order");

router.get("/history", authenticate, async (req, res) => {
  try {
    const orders = await Order.getUserOrders(req.user.id);
    res.render("order-history", {
      orders,
      user: req.user,
    });
  } catch (err) {
    console.error("Order History Error:", err);
    res.status(500).render("error", {
      message: "Unable to load order history. Please try again later.",
    });
  }
});

// New: Single Order Details
router.get("/details/:id", authenticate, async (req, res) => {
  const orderId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const order = await Order.getOrderById(orderId, userId);
    if (!order) {
      return res.status(404).render("error", { message: "Order not found" });
    }

    const items = await Order.getOrderItems(orderId);

    let total = 0;
    items.forEach((item) => {
      total += item.price * item.quantity;
    });

    res.render("order-details", {
      order,
      items,
      total: total.toFixed(2),
      user: req.user,
    });
  } catch (err) {
    console.error("Order Details Error:", err);
    res.status(500).render("error", {
      message: "Unable to load order details. Please try again.",
    });
  }
});

module.exports = router;
