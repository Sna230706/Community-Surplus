const mysql = require("mysql2/promise"); 
require("dotenv").config();


const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "community_surplus",
    waitForConnections: true,
    connectionLimit: 10,     
    queueLimit: 0            
});

// Verify connection status on startup
pool.getConnection()
    .then((connection) => {
        console.log("MySQL Database Connected Successfully via Pool.");
        connection.release(); 
    })
    .catch((err) => {
        console.error("Database pool connection failed:", err.message);
    });

module.exports = pool;