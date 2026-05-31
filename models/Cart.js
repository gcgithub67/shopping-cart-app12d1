const db = require("../config/db");

const Cart = {
  addItem: (user_id, product_id, quantity = 1) => {
    return new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO cart (user_id, product_id, quantity) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
        [user_id, product_id, quantity, quantity],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        },
      );
    });
  },

  getCart: (user_id) => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT c.*, p.name, p.price, p.image 
         FROM cart c 
         JOIN products p ON c.product_id = p.id 
         WHERE c.user_id = ?`,
        [user_id],
        (err, results) => {
          if (err) reject(err);
          resolve(results);
        },
      );
    });
  },

  removeItem: (user_id, product_id) => {
    return new Promise((resolve, reject) => {
      db.query(
        "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
        [user_id, product_id],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        },
      );
    });
  },

  updateQuantity: (user_id, product_id, quantity) => {
    return new Promise((resolve, reject) => {
      if (quantity <= 0) {
        db.query(
          "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
          [user_id, product_id],
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          },
        );
      } else {
        db.query(
          "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
          [quantity, user_id, product_id],
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          },
        );
      }
    });
  },

  clearCart: (user_id) => {
    return new Promise((resolve, reject) => {
      db.query(
        "DELETE FROM cart WHERE user_id = ?",
        [user_id],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        },
      );
    });
  },
};

module.exports = Cart;
