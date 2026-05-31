const db = require("../config/db");

const Product = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.query("SELECT * FROM products", (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  },

  getById: (id) => {
    return new Promise((resolve, reject) => {
      db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
        if (err) reject(err);
        resolve(results[0]);
      });
    });
  },
};

module.exports = Product;
