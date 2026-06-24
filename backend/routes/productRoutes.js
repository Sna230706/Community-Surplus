const express = require("express");
const router = express.Router();

const db=require("../config/db");


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

    const { 
        seller_id,category_id,product_name,description,product_condition,mrp,selling_price,
        quantity_available,location,contact_number
     } = req.body;
if (
    !seller_id ||
    !category_id ||
    !product_name ||
    !selling_price ||
    !mrp
) {
    return res.status(400).json({
        message: "Required fields missing"
    });
}
     const sql= `
     INSERT INTO products(
             seller_id,category_id,product_name,description,product_condition,mrp,selling_price,
        quantity_available,location,contact_number)VALUES(?,?,?,?,?,?,?,?,?,?)`;

        db.query(
            sql,
            [
            seller_id,category_id,product_name,description,product_condition,mrp,selling_price,
        quantity_available,location,contact_number
            ],
            (err,result) => {
                if (err) {
                    return res.status(500).json(err);
                }
                res.status(201).json({ message: "Product added successfully", productId: result.insertId });
            }
        );

   

});

router.get("/:id", (req,res) => {

    const id = req.params.id;
if (isNaN(id)) {
    return res.status(400).json({
        message: "Invalid product ID"
    });
}
db.query("SELECT * FROM products WHERE product_id = ?", [id],(err,results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0){
        return res.status(404).json({ message: "Product not found"});
    }
    res.json(results[0]);
});
});

router.delete("/:id", (req,res) => {

    const id = req.params.id;
    if (isNaN(id)) {
    return res.status(400).json({
        message: "Invalid product ID"
    });
}
db.query("DELETE FROM products WHERE product_id = ?", [id], (err,result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0){
        return res.status(404).json({ message: "Product not found"});
    }
    res.json({
        message: "Product deleted successfully"});
});

});

router.put("/:id", (req,res) => {
     const id = req.params.id;
if (isNaN(id)) {
    return res.status(400).json({
        message: "Invalid product ID"
    });
}
   const {
        product_name,
        description,
        product_condition,
        mrp,
        selling_price,
        quantity_available,
        location,
        contact_number
    } = req.body;
if (!product_name || !selling_price) {
    return res.status(400).json({
        message: "product_name and selling_price are required"
    });
}
    const sql = `
        UPDATE products
        SET product_name=?, description=?, product_condition=?, mrp=?, selling_price=?, quantity_available=?, location=?, contact_number=?
        WHERE product_id=?
    `;
db.query(
        sql,
        [
            product_name,
            description,
            product_condition,
            mrp,
            selling_price,
            quantity_available,
            location,
            contact_number,
            id
        ],
        (err, result) => {
            if (err) return res.status(500).json(err);

            res.json({ message: "Product updated successfully" });
        }
    );
});

module.exports = router;