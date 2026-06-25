const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// BUG FIX: Serve the directory where images are saved so buyers can load them in their browsers
// This allows URLs like http://localhost:5000/uploads/filename.jpg to be accessed by the frontend
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import App Routing Modules
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Base Diagnostic Route
app.get("/", (req, res) => {
    res.send("Community Surplus API is running cleanly.");
});

// BUG FIX: Register all the endpoints expected by your frontend's apiFetch() methods
app.use("/api", authRoutes);            // Handles: POST /api/register, POST /api/login, GET/PUT /api/profile
app.use("/api/products", productRoutes); // Handles: GET /api/products, GET /api/products/:id, POST /api/products, POST /api/products/:id/purchase
app.use("/api/wishlist", wishlistRoutes); // Handles: GET /api/wishlist, POST /api/wishlist/add, DELETE /api/wishlist/remove/:id
app.use("/api/dashboard", dashboardRoutes); // Handles: GET /api/dashboard

// Global 404 Catch Route
app.use((req, res) => {
    res.status(404).json({ message: "Requested backend API endpoint does not exist." });
});

// Start the Web Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});