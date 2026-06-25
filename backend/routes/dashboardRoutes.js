const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "community_surplus_super_secret_key_2026";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. Sign in to view your dashboard stats." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired session token." });
  }
};

// GET USER METRICS & STATISTICS (GET /api/dashboard)
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [listingRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM products WHERE seller_id = ?", 
      [userId]
    );

    const [wishlistRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM wishlists WHERE user_id = ?", 
      [userId]
    );

    const [purchaseRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM purchases WHERE buyer_id = ?", 
      [userId]
    );

    const [recentPurchases] = await pool.query(
      `SELECT p.product_name AS productName, pur.price_paid AS price, pur.purchase_date AS purchaseDate 
       FROM purchases pur 
       JOIN products p ON pur.product_id = p.product_id 
       WHERE pur.buyer_id = ? 
       ORDER BY pur.purchase_id DESC 
       LIMIT 5`,
      [userId]
    );

    res.json({
      listings: listingRows[0].total || 0,
      wishlist: wishlistRows[0].total || 0,
      purchases: purchaseRows[0].total || 0,
      recentPurchases: recentPurchases
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Failed to compile your dashboard performance analytics.", 
      error: error.message 
    });
  }
});

module.exports = router;