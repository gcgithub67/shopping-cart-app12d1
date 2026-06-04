const db = require("../config/db");
const bcrypt = require("bcryptjs");

const User = {
  create: async (name, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        },
      );
    });
  },

  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, results) => {
          if (err) reject(err);
          resolve(results[0]);
        },
      );
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT id, name, email, created_at FROM users WHERE id = ?",
        [id],
        (err, results) => {
          if (err) reject(err);
          resolve(results[0]);
        }
      );
    });
  },

    // Add this method
  updateProfile: (id, name, email) => {
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE users SET name = ?, email = ? WHERE id = ?",
        [name, email, id],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });
  },

  // Optional: Update password separately
  updatePassword: async (id, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashedPassword, id],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });
  }
};

module.exports = User;
