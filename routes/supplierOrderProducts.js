const express = require('express');
const router = express.Router();
const pool = require('../db');
const { checkStockout, checkOverstocking } = require('../helpers/inventoryChecks');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bazaardb.supplier_order_products');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching supplier orders:', err.stack);
    res.status(500).send('Server error');
  }
});

router.get('/view', authenticateToken, async (req, res) => {
  const order_id = req.headers['order_id'];

  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required in headers' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM bazaardb.supplier_order_products WHERE order_id = $1',
      [order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching supplier order:', err.stack);
    res.status(500).send('Server error');
  }
});

router.post('/supplier-orders', authenticateToken, async (req, res) => {
  const { supplier_id, store_id, product_id, quantity, price } = req.body;

  if (!supplier_id || !store_id || !product_id || !quantity || !price) {
    return res.status(400).json({ error: 'supplier_id, store_id, product_id, quantity, and price are required' });
  }

try {
    await pool.query('BEGIN');

    await pool.query(
      `INSERT INTO bazaardb.supplier_order_products 
        (supplier_id, store_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4, $5)`,
      [supplier_id, store_id, product_id, quantity, price]
    );

    await pool.query('COMMIT');

    return res.status(201).json({ message: 'Supplier order placed successfully' });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error during supplier order:', err.stack);
    return res.status(500).json({ error: 'Failed to process supplier order' });
  }
});

router.post('/update', authenticateToken, async (req, res) => {
  const order_id = req.headers['order_id'];
  const { supplier_id, product_id, store_id, quantity, price } = req.body;

  if (!order_id || !supplier_id || !product_id || !store_id || !quantity || !price) {
    return res.status(400).json({ error: 'All fields including order_id (in headers) are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE bazaardb.supplier_order_products
       SET supplier_id = $1, product_id = $2, store_id = $3, quantity = $4, price = $5
       WHERE order_id = $6 RETURNING *`,
      [supplier_id, product_id, store_id, quantity, price, order_id]
    );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    await client.query('COMMIT');
    
    res.json({
      message: 'Order updated successfully',
      updatedOrder: updateResult.rows[0]
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error during update:', err.stack);
    return res.status(500).json({ error: 'Failed to update supplier order' });
  }  finally {
    client.release();
  }
});

module.exports = router;
