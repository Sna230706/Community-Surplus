const express=require("express");
const cors = require("cors");
require("dotenv").config();
const app=express();
app.use(cors());

app.use(express.json());

const userRoutes = require("./routes/userRoutes");

app.use("/api/users", userRoutes);

const productRoutes=require("./routes/productRoutes");
app.get("/", (req, res) => {
    res.send("Community Surplus API is running");
});

app.use("/api/products",productRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

