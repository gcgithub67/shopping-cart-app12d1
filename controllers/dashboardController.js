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

      // NEW: Explicitly reinitialize order ID context for new users (no orders yet)
      // This prevents undefined/null issues in views or frontend logic expecting an order ID
      const currentOrderId = totalOrders > 0 ? orders[0]?.id || 0 : 0;
      const nextOrderId = totalOrders > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1; 
      // or keep as 0 for new users

      res.render("dashboard", {
        user: req.user,
        totalOrders,
        totalSpent,
        recentOrders,
        currentOrderId,     // Added: Reinitialized to 0 for new users
        nextOrderId: totalOrders === 0 ? 0 : nextOrderId, // Optional: explicit 0 for new users
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
