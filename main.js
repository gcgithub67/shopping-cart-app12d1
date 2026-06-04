const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/", require("./routes/auth"));
app.use("/products", require("./routes/product"));
app.use("/cart", require("./routes/cart"));

// Order Routes
app.use("/orders", require("./routes/order"));

// Payment Routes
app.use("/payment", require("./routes/payment"));

const userRoutes = require("./routes/user");
// Mount the route
app.use("/", userRoutes); // or app.use("/user", userRoutes);



// Home Page
app.get("/", (req, res) => {
  res.render("index");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    message: "Internal Server Error. Please try again.",
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render("error", { message: "Page Not Found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
