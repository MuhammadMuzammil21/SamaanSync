-- Create the schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS bazaardb AUTHORIZATION postgres;

-- Create tables in the correct order
CREATE TABLE bazaardb.product_categories (
    category_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    is_active CHAR(1) DEFAULT 'Y' CHECK (is_active IN ('Y', 'N'))
);

CREATE TABLE bazaardb.suppliers (
    supplier_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contact_info VARCHAR(500),
    is_active CHAR(1) DEFAULT 'Y' CHECK (is_active IN ('Y', 'N'))
);

CREATE TABLE bazaardb.stores (
    store_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    is_active CHAR(1) DEFAULT 'Y' CHECK (is_active IN ('Y', 'N'))
);

CREATE TABLE bazaardb.products (
    product_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active CHAR(1) DEFAULT 'Y' CHECK (is_active IN ('Y', 'N')),
    FOREIGN KEY (category_id) REFERENCES bazaardb.product_categories(category_id)
);

CREATE TABLE bazaardb.store_products (
    store_id VARCHAR(10) NOT NULL,
    product_id VARCHAR(10) NOT NULL,
    min_quantity INT NOT NULL CHECK (min_quantity >= 0),
    max_quantity INT NOT NULL CHECK (max_quantity >= 0),
    is_active CHAR(1) DEFAULT 'Y' CHECK (is_active IN ('Y', 'N')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (store_id, product_id),
    FOREIGN KEY (store_id) REFERENCES bazaardb.stores(store_id),
    FOREIGN KEY (product_id) REFERENCES bazaardb.products(product_id)
);

CREATE TABLE bazaardb.inventory (
    inventory_id SERIAL PRIMARY KEY,
    store_id VARCHAR(10) NOT NULL,
    product_id VARCHAR(10) NOT NULL,
    current_quantity INT CHECK (current_quantity >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id, product_id) REFERENCES bazaardb.store_products(store_id, product_id) ON DELETE CASCADE
);

CREATE TABLE bazaardb.pricing (
    price_id SERIAL PRIMARY KEY,
    product_id VARCHAR(10) NOT NULL,
    store_id VARCHAR(10) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active CHAR(1) DEFAULT 'Y' CHECK (is_active IN ('Y', 'N')),
    FOREIGN KEY (store_id, product_id) REFERENCES bazaardb.store_products(store_id, product_id) ON DELETE CASCADE
);

CREATE TABLE bazaardb.product_transactions (
    transaction_id SERIAL PRIMARY KEY,
    store_id VARCHAR(10) NOT NULL,
    product_id VARCHAR(10) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('remove', 'sell', 'stock_in')),
    updated_by VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    supplier_id VARCHAR(10) NOT NULL,
    FOREIGN KEY (store_id, product_id) REFERENCES bazaardb.store_products(store_id, product_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES bazaardb.suppliers(supplier_id)
);

CREATE TABLE bazaardb.supplier_order_products (
    order_id SERIAL PRIMARY KEY,
    supplier_id VARCHAR(10) NOT NULL,
    product_id VARCHAR(10) NOT NULL,
    store_id VARCHAR(10) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id, product_id) REFERENCES bazaardb.store_products(store_id, product_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES bazaardb.suppliers(supplier_id) ON DELETE CASCADE
);

INSERT INTO bazaardb.stores (store_id, name, is_active) VALUES
('S001', 'Central Market', 'Y'),
('S002', 'North Depot', 'Y'),
('S003', 'South Mart', 'Y'),
('S004', 'East Plaza', 'N'),
('S005', 'West Outlet', 'Y');

INSERT INTO bazaardb.product_categories (category_id, name, is_active) VALUES
('C001', 'Beverages', 'Y'),
('C002', 'Snacks', 'Y'),
('C003', 'Dairy', 'Y'),
('C004', 'Bakery', 'Y'),
('C005', 'Personal Care', 'Y');

INSERT INTO bazaardb.suppliers (supplier_id, name, contact_info, is_active) VALUES
('SUP001', 'FreshFarms Ltd.', 'fresh@farms.com, +123456789', 'Y'),
('SUP002', 'DailyGrocers', 'info@dailygrocers.com, +198765432', 'Y'),
('SUP003', 'BakeHouse Inc.', 'orders@bakehouse.com, +1122334455', 'Y'),
('SUP004', 'HydroBev Supplies', 'contact@hydrobev.com, +1223344556', 'N'),
('SUP005', 'SnackHeaven', 'hello@snackheaven.com, +1029384756', 'Y');

INSERT INTO bazaardb.products (product_id, name, category_id) VALUES
('P001', 'Orange Juice', 'C001'),
('P002', 'Potato Chips', 'C002'),
('P003', 'Cheddar Cheese', 'C003'),
('P004', 'Whole Wheat Bread', 'C004'),
('P005', 'Shampoo Plus', 'C005');

INSERT INTO bazaardb.store_products (store_id, product_id, min_quantity, max_quantity) VALUES
('S001', 'P001', 10, 100),
('S001', 'P002', 20, 200),
('S002', 'P003', 5, 50),
('S003', 'P004', 15, 120),
('S005', 'P005', 10, 80);

INSERT INTO bazaardb.inventory (store_id, product_id, current_quantity) VALUES
('S001', 'P001', 50),
('S001', 'P002', 180),
('S002', 'P003', 30),
('S003', 'P004', 60),
('S005', 'P005', 40);

INSERT INTO bazaardb.pricing (product_id, store_id, price, updated_by) VALUES
('P001', 'S001', 3.49, 'admin'),
('P002', 'S001', 1.99, 'manager1'),
('P003', 'S002', 4.75, 'admin'),
('P004', 'S003', 2.50, 'storelead'),
('P005', 'S005', 6.90, 'admin');

INSERT INTO bazaardb.product_transactions (store_id, product_id, quantity, movement_type, updated_by, supplier_id) VALUES
('S001', 'P001', 30, 'stock_in', 'admin', 'SUP001'),
('S001', 'P002', 20, 'sell', 'manager1', 'SUP005'),
('S002', 'P003', 15, 'stock_in', 'admin', 'SUP002'),
('S003', 'P004', 10, 'sell', 'storelead', 'SUP003'),
('S005', 'P005', 25, 'stock_in', 'admin', 'SUP005');

INSERT INTO bazaardb.supplier_order_products (supplier_id, product_id, store_id, quantity, price) VALUES
('SUP001', 'P001', 'S001', 50, 2.00),
('SUP005', 'P002', 'S001', 100, 1.00),
('SUP002', 'P003', 'S002', 30, 3.00),
('SUP003', 'P004', 'S003', 40, 1.50),
('SUP005', 'P005', 'S005', 60, 5.00);

CREATE TABLE bazaardb.audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR NOT NULL,
    table_name VARCHAR NOT NULL,
    record_id INT,
    user_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_data JSONB,
    new_data JSONB
);