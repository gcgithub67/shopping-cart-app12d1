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

// NEW/UPDATED: Generic Initiate Payment (supports normal + pending orders)
router.post("/initiate-payment", authenticate, async (req, res) => {
  const { pendingRazorpayOrderId } = req.body;
  const user_id = req.user.id;

  try {
    let razorpayOrderId;
    let amount;

    if (pendingRazorpayOrderId) {
      // Resume pending order
      const order = await new Promise((resolve, reject) => {
        db.query("SELECT total_amount, razorpay_order_id FROM orders WHERE razorpay_order_id = ? AND user_id = ? AND status = 'pending'",
          [pendingRazorpayOrderId, user_id], (err, results) => {
            if (err) reject(err);
            resolve(results[0]);
          });
      });

      if (!order) throw new Error("Pending order not found");

      razorpayOrderId = order.razorpay_order_id;
      amount = Math.round(order.total_amount * 100);
    } else {
      // Normal cart checkout
      const cartItems = await Cart.getCart(user_id);
      let totalAmount = 0;
      cartItems.forEach(item => totalAmount += item.price * item.quantity);

      const options = {
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const razorpayOrder = await razorpay.orders.create(options);
      razorpayOrderId = razorpayOrder.id;
      amount = options.amount;

      // Create pending order
      const orderResult = await Order.create(user_id, totalAmount, razorpayOrderId);
      const newOrderId = orderResult.insertId;

      for (const item of cartItems) {
        await OrderItem.create(newOrderId, item.product_id, item.quantity, item.price);
      }

      await Cart.clearCart(user_id);
    }

    res.json({
      success: true,
      order_id: razorpayOrderId,
      amount: amount,
      key_id: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error("Initiate Payment Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to initiate payment" });
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

// NEW: Resume payment for pending order
router.get("/resume/:orderId", authenticate, async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const user_id = req.user.id;

  try {
    const order = await Order.getPendingOrderById(orderId, user_id);
    if (!order) {
      return res.status(404).render("error", { message: "Pending order not found or already paid" });
    }

    const items = await Order.getOrderItems(orderId);
    let total = 0;
    items.forEach(item => total += item.price * item.quantity);

    res.render("checkout", {
      cartItems: items,  // reuse checkout view with order items
      total: total.toFixed(2),
      user: req.user,
      isPendingOrder: true,
      pendingOrderId: order.razorpay_order_id,  // pass Razorpay order ID
      dbOrderId: order.id
    });
  } catch (err) {
    console.error("Resume Order Error:", err);
    res.status(500).render("error", { message: "Failed to resume order" });
  }
});

module.exports = router;
//(Better Error Handling + Save Order Items)
