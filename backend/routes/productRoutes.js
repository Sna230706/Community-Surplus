const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const pool = require("../config/db");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 1. GET ALL PRODUCTS (GET /api/products)
router.get("/", async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, u.name AS seller_name FROM products p JOIN users u ON p.seller_id = u.id ORDER BY p.product_id DESC`
    );
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Database query failed.", error: error.message });
  }
});

// 2. GET SINGLE PRODUCT BY ID (GET /api/products/:id)
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.name AS seller_name FROM products p JOIN users u ON p.seller_id = u.id WHERE p.product_id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json({ product: rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Server error retrieving product.", error: error.message });
  }
});

// 3. CREATE PRODUCT (POST /api/products)
router.post("/", upload.single("image"), async (req, res) => {
  try {
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

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "images/placeholder.svg";

    const [result] = await pool.query(
      `INSERT INTO products (seller_id, product_name, description, category_name, product_condition, mrp, selling_price, quantity_available, image_url, location, contact_number, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')`,
      [seller_id, product_name, description, category_name, product_condition, mrp, selling_price, quantity_available, imageUrl, location, contact_number]
    );

    const [newProduct] = await pool.query("SELECT * FROM products WHERE product_id = ?", [result.insertId]);
    res.status(201).json({ product: newProduct[0] });
  } catch (error) {
    res.status(500).json({ message: "Failed to save marketplace item.", error: error.message });
  }
});

// 4. UPDATE PRODUCT (PUT /api/products/:id)
router.put("/:id", async (req, res) => {
  try {
    const fieldsToUpdate = req.body;
    const keys = Object.keys(fieldsToUpdate);
    
    if (keys.length === 0) {
      return res.status(400).json({ message: "No fields provided for update." });
    }

    const setClause = keys.map(key => `${key} = ?`).join(", ");
    const values = Object.values(fieldsToUpdate).concat(req.params.id);

    await pool.query(`UPDATE products SET ${setClause} WHERE product_id = ?`, values);
    
    const [updated] = await pool.query("SELECT * FROM products WHERE product_id = ?", [req.params.id]);
    res.json({ product: updated[0] });
  } catch (error) {
    res.status(500).json({ message: "Update transaction failed.", error: error.message });
  }
});

// 5. CONFIRM PURCHASE (POST /api/products/:id/purchase)
router.post("/:id/purchase", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { buyer_id, quantity } = req.body;
    const productId = req.params.id;
    const buyQty = Number(quantity || 1);

    const [products] = await connection.query(
      "SELECT quantity_available, selling_price FROM products WHERE product_id = ? FOR UPDATE",
      [productId]
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Product missing." });
    }

    const currentStock = products[0].quantity_available;
    if (currentStock < buyQty) {
      await connection.rollback();
      return res.status(400).json({ message: "Requested stock quantity is unavailable." });
    }

    const nextStock = currentStock - buyQty;
    const status = nextStock === 0 ? "Sold" : "Available";

    await connection.query(
      "UPDATE products SET quantity_available = ?, status = ? WHERE product_id = ?",
      [nextStock, status, productId]
    );

    const totalPrice = products[0].selling_price * buyQty;
    await connection.query(
      "INSERT INTO purchases (buyer_id, product_id, quantity, price_paid) VALUES (?, ?, ?, ?)",
      [buyer_id || null, productId, buyQty, totalPrice]
    );

    await connection.commit();
    res.json({ message: "Purchase successfully verified and processed." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Transaction checkout crashed.", error: error.message });
  } finally {
    connection.release();
  }
});

// 6. DELETE PRODUCT Listing (DELETE /api/products/:id)
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE product_id = ?", [req.params.id]);
    res.json({ message: "Product listing deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Deletion execution error.", error: error.message });
  }
});

module.exports = router;