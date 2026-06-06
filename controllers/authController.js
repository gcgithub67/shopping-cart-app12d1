const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const dns = require("dns").promises; // Built-in Node.js DNS module (async)

// Basic format validation
const validateEmailFormat = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Async MX record validation (checks if domain accepts email)
const validateEmailDomain = async (email) => {
  try {
    const domain = email.split("@")[1];
    if (!domain) return false;

    const mxRecords = await dns.resolveMx(domain);
    return mxRecords && mxRecords.length > 0; // Domain has at least one MX record
  } catch (err) {
    console.error(`MX lookup failed for ${email}:`, err.message);
    return false; // Invalid or no MX records
  }
};

const validatePassword = (password) => {
  return password && password.length >= 6;
  // Add more rules (uppercase, number, special char) if needed
};

const authController = {
  signup: async (req, res) => {
    const { name, email, password } = req.body;
    const errors = [];

    // Input Validation
    if (!name || name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long.");
    }

    if (!email || !validateEmailFormat(email)) {
      errors.push("Please provide a valid email address.");
    } else {
      // Additional server-side MX record check for real domain validity
      const hasValidDomain = await validateEmailDomain(email);
      if (!hasValidDomain) {
        errors.push("Please provide an email address with a valid domain (MX records).");
      }
    }

    if (!password || !validatePassword(password)) {
      errors.push("Password must be at least 6 characters long.");
    }

    if (errors.length > 0) {
      return res.render("signup", { errors, name, email }); // Repopulate form
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

  // (login method remains mostly unchanged; you can optionally add MX check here too)
  login: async (req, res) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !validateEmailFormat(email)) {
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