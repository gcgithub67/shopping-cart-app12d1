const Order = require("../models/Order");

const dashboardController = {
  getDashboard: async (req, res) => {
    try {
      const userId = req.user.id;

      const orders = await Order.getUserOrders(userId);

      const totalOrders = orders.length;
      let totalSpent = 0;

      orders.forEach((order) => {
        totalSpent += parseFloat(order.total_amount || 0);
      });

      const recentOrders = orders.slice(0, 5); // Last 5 orders

      res.render("dashboard", {
        user: req.user,
        totalOrders,
        totalSpent,
        recentOrders,
        title: "User Dashboard",
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      res.status(500).render("error", {
        message: "Something went wrong while loading dashboard.",
      });
    }
  },
};

module.exports = dashboardController;
