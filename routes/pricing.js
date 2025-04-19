const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM samaansync.pricing');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/item', authenticateToken, async (req, res) => {
  const store_id = req.headers['store_id'];
  const product_id = req.headers['product_id'];

  if (!store_id || !product_id) {
    return res.status(400).json({ message: 'store_id and product_id are required in the headers' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM samaansync.pricing WHERE store_id = $1 AND product_id = $2',
      [store_id, product_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching pricing for store_id: ${store_id}, product_id: ${product_id}:`, err.stack);
    res.status(500).send('Server error');
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { store_id, product_id, price, updated_by , is_active } = req.body;

  if (!store_id || !product_id || !price || !updated_by || !is_active) {
    return res.status(400).json({ error: 'store_id, product_id, price, updated_by and is_active are required' });
  }

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }

  try {
    const checkResult = await pool.query(
      `SELECT * FROM samaansync.pricing WHERE store_id = $1 AND product_id = $2`,
      [store_id, product_id]
    );

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Pricing record already exists for this store and product' });
    }

    const result = await pool.query(
      `INSERT INTO samaansync.pricing (store_id, product_id, price, updated_by, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [store_id, product_id, price, updated_by, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding pricing record:', err.stack);

    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid store_id or product_id, record does not exist in store_products' });
    }

    res.status(500).send('Server error');
  }
});

router.post('/update', authenticateToken, async (req, res) => {
  const store_id = req.headers['store_id'];
  const product_id = req.headers['product_id'];
  const { price, updated_by } = req.body;

  if (!store_id || !product_id) {
    return res.status(400).json({ error: 'store_id and product_id are required in headers' });
  }

  if (!price || !updated_by) {
    return res.status(400).json({ error: 'price and updated_by are required' });
  }

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }

  try {
    const result = await pool.query(
      `UPDATE samaansync.pricing SET price = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE store_id = $3 AND product_id = $4 RETURNING *`,
      [price, updated_by, store_id, product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pricing record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating pricing for store_id: ${store_id}, product_id: ${product_id}:`, err.stack);
    res.status(500).send('Server error');
  }
});

module.exports = router;
