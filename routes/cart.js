const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const Cart = require("../models/Cart");

router.post("/add", authenticate, async (req, res) => {
  const { product_id } = req.body;
  const user_id = req.user.id;
  try {
    await Cart.addItem(user_id, product_id);
    res.redirect("/products/catalogue");
  } catch (err) {
    res.status(500).send("Error adding to cart");
  }
});

router.get("/", authenticate, async (req, res) => {
  const user_id = req.user.id;
  try {
    const cartItems = await Cart.getCart(user_id);
    let total = 0;
    cartItems.forEach((item) => {
      total += item.price * item.quantity;
    });

    res.render("cart", {
      cartItems,
      total: total.toFixed(2),
      user: req.user,
    });
  } catch (err) {
    res.status(500).send("Error fetching cart");
  }
});

router.post("/remove", authenticate, async (req, res) => {
  const { product_id } = req.body;
  const user_id = req.user.id;
  try {
    await Cart.removeItem(user_id, product_id);
    res.redirect("/cart");
  } catch (err) {
    res.status(500).send("Error removing item");
  }
});

router.post("/update-quantity", authenticate, async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;
  try {
    await Cart.updateQuantity(
      user_id,
      parseInt(product_id),
      parseInt(quantity),
    );
    res.redirect("/cart");
  } catch (err) {
    res.status(500).send("Error updating quantity");
  }
});

module.exports = router;
