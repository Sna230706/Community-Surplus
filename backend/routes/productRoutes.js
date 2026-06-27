const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "community_surplus_super_secret_key_2026";

// =====================================================
// JWT AUTHENTICATION
// =====================================================

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Please login to continue."
    });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
};

// =====================================================
// MULTER CONFIGURATION
// =====================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// =====================================================
// GET ALL PRODUCTS
// GET /api/products
// =====================================================

router.get("/", async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT
        p.product_id,
        p.seller_id,
        p.product_name,
        p.description,
        p.product_condition,
        p.mrp,
        p.selling_price,
        p.quantity_available,
        p.location,
        p.contact_number,
        p.status,
        p.created_at,
        c.category_name,
        u.name AS seller_name,
        pi.image_url

      FROM products p

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

      ORDER BY p.product_id DESC
    `);

    res.json({
      products
    });

  } catch (error) {

    res.status(500).json({
      message: "Database query failed.",
      error: error.message
    });

  }
});

// =====================================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// =====================================================

router.get("/:id", async (req, res) => {

  try {

    const [rows] = await pool.query(
      `
      SELECT
        p.product_id,
        p.seller_id,
        p.product_name,
        p.description,
        p.product_condition,
        p.mrp,
        p.selling_price,
        p.quantity_available,
        p.location,
        p.contact_number,
        p.status,
        p.created_at,
        c.category_name,
        u.name AS seller_name,
        pi.image_url

      FROM products p

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

      WHERE p.product_id = ?
      `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    res.json({
      product: rows[0]
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error retrieving product.",
      error: error.message
    });

  }

});
// =====================================================
// CREATE PRODUCT
// POST /api/products
// =====================================================

router.post("/", upload.single("image"), async (req, res) => {

  try {
    console.log("BODY:", req.body);
    console.log("FILE:",req.file);

    const {
      seller_id,
      product_name,
      description,
      category_name,
      product_condition,
      mrp,
      selling_price,
      quantity_available,
      location,
      contact_number
    } = req.body;

    // -----------------------------------------
    // Find Category ID
    // -----------------------------------------

    const [categoryRows] = await pool.query(
      "SELECT category_id FROM categories WHERE category_name = ?",
      [category_name]
    );

    if (categoryRows.length === 0) {
      return res.status(400).json({
        message: "Invalid category."
      });
    }

    const categoryId = categoryRows[0].category_id;

    // -----------------------------------------
    // Default image
    // -----------------------------------------

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : "images/placeholder.svg";

    // -----------------------------------------
    // Insert product
    // -----------------------------------------

    const [result] = await pool.query(
      `
      INSERT INTO products
      (
        seller_id,
        category_id,
        product_name,
        description,
        product_condition,
        mrp,
        selling_price,
        quantity_available,
        location,
        contact_number,
        status
      )

      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')
      `,
      [
        seller_id,
        categoryId,
        product_name,
        description,
        product_condition,
        mrp,
        selling_price,
        quantity_available,
        location,
        contact_number
      ]
    );

    const productId = result.insertId;

    // -----------------------------------------
    // Save image separately
    // -----------------------------------------

    await pool.query(
      `
      INSERT INTO product_images
      (
        product_id,
        image_url
      )

      VALUES
      (?, ?)
      `,
      [
        productId,
        imageUrl
      ]
    );

    // -----------------------------------------
    // Return newly created product
    // -----------------------------------------

    const [rows] = await pool.query(
      `
      SELECT
        p.product_id,
        p.seller_id,
        p.product_name,
        p.description,
        p.product_condition,
        p.mrp,
        p.selling_price,
        p.quantity_available,
        p.location,
        p.contact_number,
        p.status,
        p.created_at,
        c.category_name,
        u.name AS seller_name,
        pi.image_url

      FROM products p

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

      WHERE p.product_id = ?
      `,
      [productId]
    );

    res.status(201).json({
      product: rows[0]
    });

  } catch (error) {
    console.error("create product error:" ,error);
    res.status(500).json({
      message: "Failed to save marketplace item.",
      error: error.message
    });

  }

});
// =====================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// =====================================================

router.put("/:id", upload.single("image"), async (req,res)=>{

  try {

    const {
      product_name,
      description,
      category_name,
      product_condition,
      mrp,
      selling_price,
      quantity_available,
      location,
      contact_number,
      status
    } = req.body;

    // Get category ID
    const [categoryRows] = await pool.query(
      "SELECT category_id FROM categories WHERE category_name = ?",
      [category_name]
    );

    if (categoryRows.length === 0) {
      return res.status(400).json({
        message: "Invalid category."
      });
    }

    const categoryId = categoryRows[0].category_id;

    await pool.query(
      `
      UPDATE products
      SET
        product_name = ?,
        description = ?,
        category_id = ?,
        product_condition = ?,
        mrp = ?,
        selling_price = ?,
        quantity_available = ?,
        location = ?,
        contact_number = ?,
        status = ?
      WHERE product_id = ?
      `,
      [
        product_name,
        description,
        categoryId,
        product_condition,
        mrp,
        selling_price,
        quantity_available,
        location,
        contact_number,
        status,
        req.params.id
      ]
    );

    const [updated] = await pool.query(
      `
      SELECT
        p.product_id,
        p.seller_id,
        p.product_name,
        p.description,
        p.product_condition,
        p.mrp,
        p.selling_price,
        p.quantity_available,
        p.location,
        p.contact_number,
        p.status,
        p.created_at,
        c.category_name,
        u.name AS seller_name,
        pi.image_url

      FROM products p

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

      WHERE p.product_id = ?
      `,
      [req.params.id]
    );

    res.json({
      product: updated[0]
    });

  } catch (error) {

    res.status(500).json({
      message: "Update transaction failed.",
      error: error.message
    });

  }

});

// =====================================================
// PURCHASE PRODUCT
// POST /api/products/:id/purchase
// =====================================================

router.post("/:id/purchase", verifyToken, async (req, res) => {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();

    const { quantity } = req.body;

    const buyer_id = req.user.user_id;

    const productId = req.params.id;

    const buyQty = Number(quantity || 1);

    const [products] = await connection.query(
      `
      SELECT
        quantity_available,
        selling_price
      FROM products
      WHERE product_id = ?
      FOR UPDATE
      `,
      [productId]
    );

    if (products.length === 0) {

      await connection.rollback();

      return res.status(404).json({
        message: "Product not found."
      });

    }

    const currentStock = products[0].quantity_available;

    if (currentStock < buyQty) {

      await connection.rollback();

      return res.status(400).json({
        message: "Requested quantity unavailable."
      });

    }

    const remainingStock = currentStock - buyQty;

    const status =
      remainingStock === 0
        ? "Sold"
        : "Available";

    await connection.query(
      `
      UPDATE products
      SET
        quantity_available = ?,
        status = ?
      WHERE product_id = ?
      `,
      [
        remainingStock,
        status,
        productId
      ]
    );

    const totalPrice =
      products[0].selling_price * buyQty;

    await connection.query(
      `
      INSERT INTO orders
      (
        buyer_id,
        product_id,
        quantity,
        purchase_price
      )

      VALUES
      (?, ?, ?, ?)
      `,
      [
        buyer_id,
        productId,
        buyQty,
        totalPrice
      ]
    );

    await connection.commit();

    res.json({
      message: "Purchase successful."
    });

  } catch (error) {

    await connection.rollback();

    res.status(500).json({
      message: "Purchase transaction failed.",
      error: error.message
    });

  } finally {

    connection.release();

  }

});

// =====================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// =====================================================

router.delete("/:id", async (req, res) => {

  try {

    await pool.query(
      "DELETE FROM product_images WHERE product_id = ?",
      [req.params.id]
    );

    await pool.query(
      "DELETE FROM products WHERE product_id = ?",
      [req.params.id]
    );

    res.json({
      message: "Product deleted successfully."
    });

  } catch (error) {

    res.status(500).json({
      message: "Deletion execution error.",
      error: error.message
    });

  }

});

module.exports = router;
