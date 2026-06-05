const db = require("../config/db");

const Order = {
  create: (user_id, amount, razorpay_order_id) => {
    return new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO orders (user_id, total_amount, razorpay_order_id, status) VALUES (?, ?, ?, "pending")',
        [user_id, amount, razorpay_order_id],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        },
      );
    });
  },

  updateStatus: (razorpay_payment_id, razorpay_order_id, status) => {
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE orders SET razorpay_payment_id = ?, status = ? WHERE razorpay_order_id = ?",
        [razorpay_payment_id, status, razorpay_order_id],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        },
      );
    });
  },

  // Get user's order history with full details
getUserOrders: (user_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT o.*, 
              GROUP_CONCAT(
                CONCAT(p.name, ' (₹', p.price, ' × ', oi.quantity, ')') 
                SEPARATOR ', '
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [user_id],
      (err, results) => {
        if (err) reject(err);
        resolve(results);
      }
    );
  });
},

// Get single order by ID with full details
getOrderById: (order_id, user_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT o.* FROM orders o 
       WHERE o.id = ? AND o.user_id = ?`,
      [order_id, user_id],
      (err, results) => {
        if (err) reject(err);
        resolve(results[0]);
      }
    );
  });
},

// Get order items for a specific order
getOrderItems: (order_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT oi.*, p.name, p.image 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order_id],
      (err, results) => {
        if (err) reject(err);
        resolve(results);
      }
    );
  });
},

// Add this method
  saveOrderItems: (order_id, cartItems) => {
    return new Promise((resolve, reject) => {
      const values = cartItems.map(item => 
        [order_id, item.product_id, item.quantity, item.price]
      );
      
      db.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
        [values],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });
  },
// NEW: Get pending order details for resume payment
  getPendingOrderById: (order_id, user_id) => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT o.* FROM orders o 
         WHERE o.id = ? AND o.user_id = ? AND o.status = 'pending'`,
        [order_id, user_id],
        (err, results) => {
          if (err) reject(err);
          resolve(results[0]);
        }
      );
    });
  }  

};

module.exports = Order;
