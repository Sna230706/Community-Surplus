const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const uploadDir = path.join(__dirname, "uploads");
const frontendDir = path.join(__dirname, "..", "frontend");

fs.mkdirSync(uploadDir, { recursive: true });

// Global Middlewares
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(uploadDir));

// Import App Routing Modules
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

app.get("/api/health", (req, res) => {
    res.json({ message: "Community Surplus API is running cleanly." });
});

app.use("/api", authRoutes);            // Handles: POST /api/register, POST /api/login, GET/PUT /api/profile
app.use("/api/products", productRoutes); // Handles: GET /api/products, GET /api/products/:id, POST /api/products, POST /api/products/:id/purchase
app.use("/api/wishlist", wishlistRoutes); // Handles: GET /api/wishlist, POST /api/wishlist/add, DELETE /api/wishlist/remove/:id
app.use("/api/dashboard", dashboardRoutes); // Handles: GET /api/dashboard

app.use("/api", (req, res) => {
    res.status(404).json({ message: "Requested backend API endpoint does not exist." });
});

app.use(express.static(frontendDir));

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(frontendDir, "index.html"));
});

// Start the Web Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});
