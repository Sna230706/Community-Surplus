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
// DASHBOARD
// GET /api/dashboard
// =====================================================

router.get("/", verifyToken, async (req, res) => {

  try {

    const userId = req.user.user_id;

    // ----------------------------
    // Total Listings
    // ----------------------------

    const [listingRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM products
      WHERE seller_id = ?
      `,
      [userId]
    );

    // ----------------------------
    // Wishlist Count
    // ----------------------------

    const [wishlistRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM wishlist
      WHERE user_id = ?
      `,
      [userId]
    );

    // ----------------------------
    // Orders Count
    // ----------------------------

    const [orderRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM orders
      WHERE buyer_id = ?
      `,
      [userId]
    );

    // ----------------------------
    // Recent Orders
    // ----------------------------

    const [recentOrders] = await pool.query(
      `
      SELECT
        p.product_name AS productName,
        o.purchase_price AS price,
        o.order_date AS purchaseDate

      FROM orders o

      JOIN products p
      ON o.product_id = p.product_id

      WHERE o.buyer_id = ?

      ORDER BY o.order_id DESC

      LIMIT 5
      `,
      [userId]
    );

    res.json({

      listings: listingRows[0].total,

      wishlist: wishlistRows[0].total,

      purchases: orderRows[0].total,

      recentPurchases: recentOrders

    });

  } catch (error) {

    res.status(500).json({

      message: "Failed to load dashboard.",

      error: error.message

    });

  }

});

module.exports = router;