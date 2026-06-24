const express = require("express");
const router = express.Router();

const db=require("../config/db");
let products = [
    {
        id: 1,
        name: "Laptop",
        price: 15000,
        seller: "John"
    }
];

router.get("/", (req,res) => {
   db.query("SELECT * FROM products",
    (err,results) => {
        if (err){
            return res.status(500).json(err);
        }
        res.json(results);
    }
   );
});

router.post("/", (req,res) => {

    const { id, name, price, seller } = req.body;
  

   if(
    id === undefined ||
    name === undefined ||
    price === undefined ||
    seller === undefined
){
    return res.status(400).json({
        message: "All fields are required"
    });
}
  if (typeof price !== "number") {
    return res.status(400).json({
        message: "Price must be a number"
    });
}
if (typeof id !== "number") {
    return res.status(400).json({
        message: "ID must be a number"
    });
}
if (price < 0) {
    return res.status(400).json({
        message: "Price cannot be negative"
    });
}
    const product = {
        id,
        name,
        price,
        seller
    };
const existingProduct = products.find(
    p => p && p.id === id
);

if(existingProduct){
    return res.status(400).json({
        message: "Product ID already exists"
    });
}
    products.push(product);

    res.status(201).json({
        message: "Product added successfully",
        product
    });

});

router.get("/:id", (req,res) => {

    const id = parseInt(req.params.id);
if (isNaN(id)) {
    return res.status(400).json({
        message: "Invalid product ID"
    });
}
    const product = products.find(
        p => p && p.id === id
    );

    if(!product){
        return res.status(404).json({
            message: "Product not found"
        });
    }

    res.json(product);
});

router.delete("/:id", (req,res) => {

    const id = parseInt(req.params.id);
if (isNaN(id)) {
    return res.status(400).json({
        message: "Invalid product ID"
    });
}
    const product = products.find(
        p => p && p.id === id
    );

    if(!product){
        return res.status(404).json({
            message: "Product not found"
        });
    }

    products = products.filter(
        p => p && p.id !== id
    );

    res.json({
        message: "Product deleted successfully"
    });

});

router.put("/:id", (req,res) => {
     const id = parseInt(req.params.id);
if (isNaN(id)) {
    return res.status(400).json({
        message: "Invalid product ID"
    });
}
    const product = products.find(p => p && p.id === id);
    if (!product){
        return res.status(404).json({ message: "Product not found"});
    }

    if(
    req.body.name === undefined &&
    req.body.price === undefined &&
    req.body.seller === undefined
){
    return res.status(400).json({
        message: "No fields provided for update"
    });
}
if (
    req.body.price !== undefined &&
    typeof req.body.price !== "number"
) {
    return res.status(400).json({
        message: "Price must be a number"
    });
}
if (
    req.body.price !== undefined &&
    req.body.price < 0
) {
    return res.status(400).json({
        message: "Price cannot be negative"
    });
}
   if(req.body.name !== undefined){
    product.name = req.body.name;
}

if(req.body.price !== undefined){
    product.price = req.body.price;
}

if(req.body.seller !== undefined){
    product.seller = req.body.seller;
}
    res.json({
        message: "Product updated ",
        product
    });
});

module.exports = router;