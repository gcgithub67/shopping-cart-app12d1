const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => { return password && password.length >= 6; 
  // Add more rules (uppercase, number, special) if needed
};

const authController = {
  signup: async (req, res) => {
    const { name, email, password } = req.body;
    const errors = [];

    // Input Validation
    if (!name || name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long.");
    }
    if (!email || !validateEmail(email)) {
      errors.push("Please provide a valid email address.");
    }
    if (!password || !validatePassword(password)) {
      errors.push("Password must be at least 6 characters long.");
    }

    if (errors.length > 0) {
      return res.render("signup", { errors, name, email }); // Pass back values for re-population
    }
    try {
      await User.create(name, email, password);
      res.redirect("/login");
    } catch (err) {
      console.error(err);
      if (err.code === "ER_DUP_ENTRY") {
        errors.push("Email already registered.");
        return res.render("signup", { errors });
      }
      res.status(500).send("Error creating account");
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !validateEmail(email)) {
      errors.push("Please provide a valid email address.");
    }
    if (!password) {
      errors.push("Password is required.");
    }

    if (errors.length > 0) {
      return res.render("login", { errors, email });
    }
    try {
      const user = await User.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.render("login", { errors: ["Invalid email or password"], email });
      }

      // ✅ Updated JWT payload with full user info including shipping address
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          shipping_address: user.shipping_address,
          shipping_city: user.shipping_city,
          shipping_state: user.shipping_state,
          shipping_zip: user.shipping_zip,
          shipping_country: user.shipping_country,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.cookie("token", token, { httpOnly: true });
      res.redirect("/products/catalogue");
    } catch (err) {
      console.error(err);
      res.status(500).render("login", { errors: ["Server error. Please try again."] });
    }
  },

  logout: (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
  },
};

module.exports = authController;