const express=require("express");
require("dotenv").config();
const app=express();


app.use(express.json());


const productRoutes=require("./routes/productRoutes");
app.get("/", (req, res) => {
    res.send("Community Surplus API is running");
});

app.use("/api/products",productRoutes);

app.listen(process.env.PORT,() => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

