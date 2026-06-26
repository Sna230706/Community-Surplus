const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "community_surplus_super_secret_key_2026";

// =====================================================
// VERIFY JWT
// =====================================================

const verifyToken = (req, res, next) => {

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Please login."
    });
  }

  try {

    const verified = jwt.verify(token, JWT_SECRET);

    req.user = verified;

    next();

  } catch (error) {

    return res.status(401).json({
      message: "Invalid or expired token."
    });

  }

};

// =====================================================
// GET WISHLIST
// GET /api/wishlist
// =====================================================

router.get("/", verifyToken, async (req, res) => {

  try {

    const [products] = await pool.query(
      `
      SELECT
        p.*,
        c.category_name,
        u.name AS seller_name,
        pi.image_url

      FROM wishlist w

      JOIN products p
        ON w.product_id = p.product_id

      JOIN users u
        ON p.seller_id = u.user_id

      JOIN categories c
        ON p.category_id = c.category_id

      LEFT JOIN (
          SELECT product_id, MIN(image_url) AS image_url
          FROM product_images
          GROUP BY product_id
      ) pi
        ON p.product_id = pi.product_id

      WHERE w.user_id = ?

      ORDER BY p.product_id DESC
      `,
      [req.user.user_id]
    );

    res.json({
      products
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to retrieve wishlist.",
      error: error.message
    });

  }

});

// =====================================================
// ADD TO WISHLIST
// POST /api/wishlist/add
// =====================================================

router.post("/add", verifyToken, async (req, res) => {

  try {

    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        message: "Product ID is required."
      });
    }

    const [existing] = await pool.query(
      `
      SELECT wishlist_id
      FROM wishlist
      WHERE user_id = ?
      AND product_id = ?
      `,
      [req.user.user_id, product_id]
    );

    if (existing.length === 0) {

      await pool.query(
        `
        INSERT INTO wishlist
        (
          user_id,
          product_id
        )
        VALUES (?, ?)
        `,
        [req.user.user_id, product_id]
      );

    }

    res.status(201).json({
      message: "Product added to wishlist."
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to add wishlist item.",
      error: error.message
    });

  }

});

// =====================================================
// REMOVE FROM WISHLIST
// DELETE /api/wishlist/remove/:id
// =====================================================

router.delete("/remove/:id", verifyToken, async (req, res) => {

  try {

    await pool.query(
      `
      DELETE FROM wishlist
      WHERE user_id = ?
      AND product_id = ?
      `,
      [req.user.user_id, req.params.id]
    );

    res.json({
      message: "Wishlist item removed."
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to remove wishlist item.",
      error: error.message
    });

  }

});

module.exports = router;