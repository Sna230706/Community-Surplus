const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");
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

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

async function loadProduct(productId) {
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

  return rows[0] || null;
}

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

router.post("/", verifyToken, upload.single("image"), async (req, res) => {

  try {

    console.log("STEP 1 - Request received");

    const {
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

    console.log("STEP 1.1 - Request body:", req.body);
    console.log("STEP 1.2 - Uploaded file:", req.file);

    if (!product_name || !category_name || !product_condition || !selling_price || !location || !contact_number) {
      return res.status(400).json({
        message: "Please complete all required product fields."
      });
    }

    // -----------------------------------------
    // Find Category ID
    // -----------------------------------------

    console.log("STEP 2 - Looking up category:", category_name);

    const [categoryRows] = await pool.query(
      "SELECT category_id FROM categories WHERE category_name = ?",
      [category_name]
    );

    console.log("STEP 3 - Category query result:", categoryRows);

    if (categoryRows.length === 0) {
      return res.status(400).json({
        message: "Invalid category."
      });
    }

    const categoryId = categoryRows[0].category_id;

    console.log("STEP 4 - Category ID:", categoryId);

    // -----------------------------------------
    // Default image
    // -----------------------------------------

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : "images/placeholder.svg";

    console.log("STEP 5 - Image URL:", imageUrl);

    // -----------------------------------------
    // Insert product
    // -----------------------------------------

    console.log("STEP 6 - Inserting product...");

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
        req.user.user_id,
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

    console.log("STEP 7 - Product inserted successfully");

    const productId = result.insertId;

    console.log("STEP 8 - Product ID:", productId);

    // -----------------------------------------
    // Save image separately
    // -----------------------------------------

    console.log("STEP 9 - Saving image record...");

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

    console.log("STEP 10 - Image record inserted");

    // -----------------------------------------
    // Return newly created product
    // -----------------------------------------

    console.log("STEP 11 - Loading product...");

    const product = await loadProduct(productId);

    console.log("STEP 12 - Product loaded:", product);

    console.log("STEP 13 - Sending response");

    res.status(201).json({
      product
    });

  } catch (error) {

    console.error("========== CREATE PRODUCT ERROR ==========");
    console.error(error);
    console.error("Stack:", error.stack);

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

router.put("/:id", verifyToken, upload.single("image"), async (req,res)=>{

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

    const existingProduct = await loadProduct(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    if (Number(existingProduct.seller_id) !== Number(req.user.user_id)) {
      return res.status(403).json({
        message: "You can only update your own products."
      });
    }

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
        status || existingProduct.status,
        req.params.id
      ]
    );

    if (req.file) {
      const imageUrl = `/uploads/${req.file.filename}`;
      const [images] = await pool.query(
        "SELECT image_id FROM product_images WHERE product_id = ? ORDER BY image_id LIMIT 1",
        [req.params.id]
      );

      if (images.length) {
        await pool.query(
          "UPDATE product_images SET image_url = ? WHERE image_id = ?",
          [imageUrl, images[0].image_id]
        );
      } else {
        await pool.query(
          "INSERT INTO product_images (product_id, image_url) VALUES (?, ?)",
          [req.params.id, imageUrl]
        );
      }
    }

    const updated = await loadProduct(req.params.id);

    res.json({
      product: updated
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

    if (!Number.isInteger(buyQty) || buyQty < 1) {
      await connection.rollback();

      return res.status(400).json({
        message: "Please choose a valid purchase quantity."
      });
    }

    const [products] = await connection.query(
      `
      SELECT
        seller_id,
        quantity_available,
        status,
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

    if (Number(products[0].seller_id) === Number(buyer_id)) {
      await connection.rollback();

      return res.status(400).json({
        message: "You cannot purchase your own product."
      });
    }

    if (products[0].status === "Sold") {
      await connection.rollback();

      return res.status(400).json({
        message: "This product is already sold."
      });
    }

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

router.delete("/:id", verifyToken, async (req, res) => {

  try {
    const existingProduct = await loadProduct(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    if (Number(existingProduct.seller_id) !== Number(req.user.user_id)) {
      return res.status(403).json({
        message: "You can only delete your own products."
      });
    }

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
