const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "community_surplus_super_secret_key_2026";

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, location, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required fields." });
    }

    const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, phone, location, password, bio) VALUES (?, ?, ?, ?, ?, '')",
      [name, email, phone || "", location || "", hashedPassword]
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: { id: userId, name, email, phone, location, bio: "" }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration.", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password." });
    }

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        bio: user.bio
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login.", error: error.message });
  }
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired authorization token." });
  }
};

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, name, email, phone, location, bio FROM users WHERE id = ?", [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: "User profile not found." });
    
    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile information.", error: error.message });
  }
});

router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, email, phone, location, bio } = req.body;

    await pool.query(
      "UPDATE users SET name = ?, email = ?, phone = ?, location = ?, bio = ? WHERE id = ?",
      [name, email, phone, location, bio, req.user.id]
    );

    res.json({
      user: { id: req.user.id, name, email, phone, location, bio }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile records.", error: error.message });
  }
});

module.exports = router;