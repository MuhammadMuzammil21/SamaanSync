const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bazaardb.products');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err.stack);
    res.status(500).send('Server error');
  }
});

router.get('/item', authenticateToken, async (req, res) => {
  const product_id = req.headers['product_id'];

  if (!product_id) {
    return res.status(400).json({ error: 'product_id is required in headers' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM bazaardb.products WHERE product_id = $1',
      [product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching product ${product_id}:`, err.stack);
    res.status(500).send('Server error');
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { product_id, name, category_id, is_active = 'Y' } = req.body;

  if ( !product_id || !name || !category_id ) {
    return res.status(400).json({ error: 'product_id, name, and category_id are required' });
  }

  if (is_active && !['Y', 'N'].includes(is_active)) {
    return res.status(400).json({ error: "is_active must be 'Y' or 'N'" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bazaardb.products (product_id, name, category_id, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [product_id, name, category_id, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding product:', err.stack);

    if (err.code === '23505') {
      return res.status(409).json({ error: 'Product with this name or ID already exists' });
    }

    res.status(500).send('Server error');
  }
});

router.post('/update', authenticateToken, async (req, res) => {
  const product_id = req.headers['product_id'];
  const { name, category_id, is_active } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: 'product_id is required in headers' });
  }

  if (!name || !category_id) {
    return res.status(400).json({ error: 'name and category_id are required' });
  }

  if (is_active && !['Y', 'N'].includes(is_active)) {
    return res.status(400).json({ error: "is_active must be 'Y' or 'N'" });
  }

  try {
    const result = await pool.query(
      `UPDATE bazaardb.products 
       SET name = $1, category_id = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $4 RETURNING *`,
      [name, category_id, is_active || 'Y', product_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating product ${product_id}:`, err.stack);
    res.status(500).send('Server error');
  }
});

module.exports = router;
