const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const db = require("../config/db"); // ← Important: Add this

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Checkout Page
router.get("/checkout", authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;
    const cartItems = await Cart.getCart(user_id);
    let total = 0;
    cartItems.forEach((item) => (total += item.price * item.quantity));

    res.render("checkout", {
      cartItems,
      total: total.toFixed(2),
      user: req.user,
    });
  } catch (err) {
    console.error("Checkout Error:", err);
    res
      .status(500)
      .render("error", { message: "Failed to load checkout page" });
  }
});

// Create Razorpay Order
router.post("/create-order", authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;
    const cartItems = await Cart.getCart(user_id);

    let totalAmount = 0;
    cartItems.forEach((item) => (totalAmount += item.price * item.quantity));

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Create order with pending status
    const orderResult = await Order.create(user_id, totalAmount, razorpayOrder.id);
    const newOrderId = orderResult.insertId;

    // === KEY CHANGE: Save items immediately ===
    for (const item of cartItems) {
      await OrderItem.create(newOrderId, item.product_id, item.quantity, item.price);
    }

    // === NEW: Clear cart for pending order ===
    await Cart.clearCart(user_id);
    
    res.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: options.amount,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
});

// Payment Success - FIXED VERSION
router.post("/payment-success", authenticate, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id } = req.body;
  const user_id = req.user.id;

  try {
    // Update order status
    await Order.updateStatus(razorpay_payment_id, razorpay_order_id, "paid");

    // Get order ID from razorpay_order_id
    const orderResult = await new Promise((resolve, reject) => {
      db.query(
        "SELECT id FROM orders WHERE razorpay_order_id = ?",
        [razorpay_order_id],
        (err, results) => {
          if (err) reject(err);
          resolve(results[0]);
        },
      );
    });

    if (!orderResult) {
      throw new Error("Order not found in database");
    }

    // Save purchased items
    const cartItems = await Cart.getCart(user_id);
    for (const item of cartItems) {
      await OrderItem.create(
        orderResult.id,
        item.product_id,
        item.quantity,
        item.price,
      );
    }

    // Clear cart after successful payment
    await Cart.clearCart(user_id);

    res.render("payment-success", {
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (err) {
    console.error("Payment Success Error Details:", err);
    res.status(500).render("error", {
      message:
        "Payment was successful, but we failed to save order details. Please contact support with your Payment ID.",
    });
  }
});

module.exports = router;
//(Better Error Handling + Save Order Items)
