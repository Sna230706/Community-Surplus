CREATE DATABASE COMMUNITY_SURPLUS;
USE COMMUNITY_SURPLUS;

-- =========================
-- USERS
-- =========================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    phone VARCHAR(15),

    location VARCHAR(100),

    bio TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CATEGORIES
-- =========================

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,

    category_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO categories (category_name)
VALUES
('Furniture'),
('Books'),
('Appliances'),
('Electronics'),
('Vehicles'),
('Home'),
('Other');

-- =========================
-- PRODUCTS
-- =========================

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,

    seller_id INT NOT NULL,

    category_id INT NOT NULL,

    product_name VARCHAR(100) NOT NULL,

    description TEXT,

    product_condition ENUM(
        'Like New',
        'Good',
        'Used',
        'Needs Repair'
    ) NOT NULL,

    mrp DECIMAL(10,2),

    selling_price DECIMAL(10,2) NOT NULL,

    quantity_available INT NOT NULL DEFAULT 1,

    location VARCHAR(100) NOT NULL,

    contact_number VARCHAR(15) NOT NULL,

    status ENUM(
        'Available',
        'Sold'
    ) DEFAULT 'Available',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (seller_id)
        REFERENCES users(user_id),

    FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
);

-- =========================
-- PRODUCT IMAGES
-- =========================

CREATE TABLE product_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,

    product_id INT NOT NULL,

    image_url VARCHAR(255) NOT NULL,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);

-- =========================
-- WISHLIST
-- =========================

CREATE TABLE wishlist (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    product_id INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);

-- =========================
-- ORDERS
-- =========================

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,

    buyer_id INT NOT NULL,

    product_id INT NOT NULL,

    quantity INT NOT NULL DEFAULT 1,

    purchase_price DECIMAL(10,2) NOT NULL,

    order_status ENUM(
        'Pending',
        'Confirmed',
        'Cancelled'
    ) DEFAULT 'Confirmed',

    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (buyer_id)
        REFERENCES users(user_id),

    FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);