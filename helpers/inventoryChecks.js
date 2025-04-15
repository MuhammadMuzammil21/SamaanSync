const express = require('express');

const checkOverstocking = async (store_id, product_id, pool, incoming_quantity) => {
  const result = await pool.query(`
    SELECT i.current_quantity, sp.max_quantity
    FROM bazaardb.inventory i
    JOIN bazaardb.store_products sp 
      ON i.store_id = sp.store_id AND i.product_id = sp.product_id
    WHERE i.store_id = $1 AND i.product_id = $2
  `, [store_id, product_id]);

  const row = result.rows[0];
  return row && (row.current_quantity + incoming_quantity > row.max_quantity);
};

const checkStockout = async (store_id, product_id, pool, quantity) => {
  const result = await pool.query(`
    SELECT i.current_quantity, sp.min_quantity
    FROM bazaardb.inventory i
    JOIN bazaardb.store_products sp 
      ON i.store_id = sp.store_id AND i.product_id = sp.product_id
    WHERE i.store_id = $1 AND i.product_id = $2
  `, [store_id, product_id]);

  const row = result.rows[0];
  return row && (row.current_quantity - quantity < row.min_quantity);
};

const insertTransaction = (store_id, product_id, quantity, movement_type, updated_by, supplier_id, pool) => {
  return pool.query(
    `INSERT INTO bazaardb.product_transactions 
       (store_id, product_id, quantity, movement_type, updated_by, timestamp, supplier_id)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
    [store_id, product_id, quantity, movement_type, updated_by, supplier_id]
  );
};

const updateInventory = (store_id, product_id, quantityChange, pool) => {
  return pool.query(
    `UPDATE bazaardb.inventory
       SET current_quantity = current_quantity + $1,
           last_updated = CURRENT_TIMESTAMP
     WHERE store_id = $2 AND product_id = $3`,
    [quantityChange, store_id, product_id]
  );
};

module.exports = {
  checkOverstocking,
  checkStockout,
  insertTransaction,
  updateInventory
};
