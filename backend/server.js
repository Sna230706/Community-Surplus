const express=require("express");
const app=express();


app.use(express.json());


const productRoutes=require("./routes/productRoutes");
app.get("/", (req, res) => {
    res.send("Community Surplus API is running");
});

app.use("/api/products",productRoutes);

app.listen(5000,() => {
    console.log("Server is running on port 5000");
});

