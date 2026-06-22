const express=require("express");
const app=express();

app.use(express.json());

let products=[
    {
        id:1,
        name:"Laptop",
        price:15000,
        seller:"John"
    }
];

app.get("/api/products", (req,res) => {
    res.json(products);
});

app.post("/api/products", (req,res) => {
    const product=req.body;
    products.push(product);
    res.json({
        message:"Product added successfully",
        product
    });

});


app.get("/api/products/:id", (req,res) => {
   
    const id=parseInt(req.params.id);
    const product=products.find( p => p.id === id);
    
    res.json(product);
});

app.listen(5000,() => {
    console.log("Server is running on port 5000");
});

