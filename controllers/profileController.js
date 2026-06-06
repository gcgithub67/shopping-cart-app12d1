const User = require("../models/User");
const jwt = require("jsonwebtoken");

const profileController = {
  // GET: Show Edit Profile Page
  getEditProfile: async (req, res) => {
    try {
      const fullUser = await User.findById(req.user.id); // Get latest data

      res.render("profile-edit", {
        user: fullUser || req.user,
        title: "Edit Profile",
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      res.status(500).render("error", { message: "Server error" });
    }
  },

  // POST: Update Name & Email + Shipping Address
  updateProfile: async (req, res) => {
    try {
      const {
        name,
        email,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_country,
      } = req.body;

      const userId = req.user.id;

      if (!name || !email) {
        return res.redirect("/profile/edit?error=Name and Email are required");
      }

      await User.updateProfile(
        userId,
        name.trim(),
        email.trim(),
        shipping_address ? shipping_address.trim() : null,
        shipping_city ? shipping_city.trim() : null,
        shipping_state ? shipping_state.trim() : null,
        shipping_zip ? shipping_zip.trim() : null,
        shipping_country ? shipping_country.trim() : "India",
      );

      // Fetch latest user data
      const updatedUser = await User.findById(userId);

      // ✅ Re-issue new JWT with updated shipping address
      const newToken = jwt.sign(
        {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          shipping_address: updatedUser.shipping_address,
          shipping_city: updatedUser.shipping_city,
          shipping_state: updatedUser.shipping_state,
          shipping_zip: updatedUser.shipping_zip,
          shipping_country: updatedUser.shipping_country,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Set new token in cookie
      res.cookie("token", newToken, { httpOnly: true });

      res.redirect("/profile/edit?success=Updated");
    } catch (error) {
      console.error("Profile Update Error:", error);
      res.redirect("/profile/edit?error=Failed to update profile");
    }
  },

  // POST: Update Password
  updatePassword: async (req, res) => {
    try {
      const { newPassword, confirmPassword } = req.body;
      const userId = req.user.id;

      if (!newPassword || newPassword.length < 6) {
        return res.redirect(
          "/profile/edit?error=Password must be at least 6 characters"
        );
      }

      if (newPassword !== confirmPassword) {
        return res.redirect("/profile/edit?error=Passwords do not match");
      }

      await User.updatePassword(userId, newPassword);

      res.redirect("/profile/edit?success=Password updated successfully");
    } catch (error) {
      console.error("Password Update Error:", error);
      res.redirect("/profile/edit?error=Failed to update password");
    }
  },
};

module.exports = profileController;