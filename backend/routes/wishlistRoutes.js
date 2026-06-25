const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "community_surplus_super_secret_key_2026";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. Please log in to manage your wishlist." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired session token." });
  }
};

router.get("/", verifyToken, async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, u.name AS seller_name 
       FROM wishlists w 
       JOIN products p ON w.product_id = p.product_id 
       JOIN users u ON p.seller_id = u.id 
       WHERE w.user_id = ? 
       ORDER BY p.product_id DESC`,
      [req.user.id]
    );

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve your wishlist items.", error: error.message });
  }
});

router.post("/add", verifyToken, async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: "Missing product_id field in payload." });
    }

    const [duplicates] = await pool.query(
      "SELECT * FROM wishlists WHERE user_id = ? AND product_id = ?",
      [req.user.id, product_id]
    );

    if (duplicates.length === 0) {
      await pool.query(
        "INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)",
        [req.user.id, product_id]
      );
    }

    res.status(201).json({ message: "Item successfully saved to wishlist." });
  } catch (error) {
    res.status(500).json({ message: "Failed to save item.", error: error.message });
  }
});

router.delete("/remove/:id", verifyToken, async (req, res) => {
  try {
    const productId = req.params.id;

    await pool.query(
      "DELETE FROM wishlists WHERE user_id = ? AND product_id = ?",
      [req.user.id, productId]
    );

    res.json({ message: "Item successfully removed from wishlist." });
  } catch (error) {
    res.status(500).json({ message: "Failed to unsave item.", error: error.message });
  }
});

module.exports = router;