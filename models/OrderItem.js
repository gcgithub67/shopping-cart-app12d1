const db = require("../config/db");

const OrderItem = {
  create: (order_id, product_id, quantity, price) => {
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [order_id, product_id, quantity, price],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        },
      );
    });
  },
};

module.exports = OrderItem;
//(For storing purchased items)
