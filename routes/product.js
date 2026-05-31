const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const Product = require("../models/Product");

router.get("/catalogue", authenticate, async (req, res) => {
  try {
    const products = await Product.getAll();
    res.render("catalogue", { products, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading products");
  }
});

module.exports = router;
