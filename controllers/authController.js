const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const authController = {
  signup: async (req, res) => {
    const { name, email, password } = req.body;
    try {
      await User.create(name, email, password);
      res.redirect("/login");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error creating account");
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send("Invalid email or password");
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );

      res.cookie("token", token, { httpOnly: true });
      res.redirect("/products/catalogue");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  },

  logout: (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
  },
};

module.exports = authController;
