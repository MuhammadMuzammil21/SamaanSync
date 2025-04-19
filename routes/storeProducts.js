const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM samaansync.store_products');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching store_products:', err.stack);
    res.status(500).send('Server error');
  }
});

router.get('/product', authenticateToken, async (req, res) => {
  const store_id = req.headers['store_id'];
  const product_id = req.headers['product_id'];

  if (!store_id || !product_id) {
    return res.status(400).json({ error: 'store_id and product_id are required in headers' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM samaansync.store_products WHERE store_id = $1 AND product_id = $2',
      [store_id, product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found in store' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching product for store:', err.stack);
    res.status(500).send('Server error');
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { store_id, product_id, min_quantity, max_quantity, is_active = 'Y' } = req.body;

  if (!store_id || !product_id || min_quantity == null || max_quantity == null) {
    return res.status(400).json({ error: 'store_id, product_id, min_quantity, and max_quantity are required' });
  }

  try {
    const existing = await pool.query(
      `SELECT * FROM samaansync.store_products WHERE store_id = $1 AND product_id = $2`,
      [store_id, product_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Store-product relationship already exists' });
    }

    const result = await pool.query(
      `INSERT INTO samaansync.store_products (store_id, product_id, min_quantity, max_quantity, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [store_id, product_id, min_quantity, max_quantity, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting store product:', err.stack);
    res.status(500).send('Server error');
  }
});


router.post('/update', authenticateToken, async (req, res) => {
  const store_id = req.headers['store_id'];
  const product_id = req.headers['product_id'] || req.body.product_id;
  const { min_quantity, max_quantity, is_active } = req.body;

  if (!store_id || !product_id || min_quantity == null || max_quantity == null || !is_active) {
    return res.status(400).json({ error: 'store_id (in header), product_id, min_quantity, max_quantity, and is_active are required' });
  }

  if (!['Y', 'N'].includes(is_active)) {
    return res.status(400).json({ error: "is_active must be 'Y' or 'N'" });
  }

  try {
    const result = await pool.query(
      `UPDATE samaansync.store_products
       SET min_quantity = $1, max_quantity = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
       WHERE store_id = $4 AND product_id = $5 RETURNING *`,
      [min_quantity, max_quantity, is_active, store_id, product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store-product entry not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating store product:', err.stack);
    res.status(500).send('Server error');
  }
});

module.exports = router;
