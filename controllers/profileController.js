const User = require("../models/User");

const profileController = {
  // GET: Show Edit Profile Page
  getEditProfile: async (req, res) => {
    try {
      res.render("profile-edit", {
        user: req.user,
        title: "Edit Profile",
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (err) {
      res.status(500).render("error", { message: "Server error" });
    }
  },

  // POST: Update Name & Email
  updateProfile: async (req, res) => {
    try {
      const { name, email } = req.body;
      const userId = req.user.id;

      if (!name || !email) {
        return res.redirect("/profile/edit?error=Name and Email are required");
      }

      await User.updateProfile(userId, name.trim(), email.trim());

      // Update current session user info
      req.user.name = name.trim();
      req.user.email = email.trim();

      res.redirect("/profile/edit?success=Profile updated successfully");
    } catch (error) {
      console.error("Profile Update Error:", error);
      res.redirect("/profile/edit?error=Failed to update profile. Try again.");
    }
  },

  // POST: Update Password
  updatePassword: async (req, res) => {
    try {
      const { newPassword, confirmPassword } = req.body;
      const userId = req.user.id;

      if (!newPassword || newPassword.length < 6) {
        return res.redirect("/profile/edit?error=Password must be at least 6 characters");
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
  }
};

module.exports = profileController;