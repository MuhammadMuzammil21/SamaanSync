const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bazaardb.product_categories');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err.stack);
    res.status(500).send('Server error');
  }
});

router.get('/item', authenticateToken, async (req, res) => {
  const category_id = req.headers['category_id'];

  if (!category_id) {
    return res.status(400).json({ error: 'category_id is required in headers' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM bazaardb.product_categories WHERE category_id = $1',
      [category_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching category ${category_id}:`, err.stack);
    res.status(500).send('Server error');
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { category_id, name, is_active = 'Y' } = req.body;

  if (!category_id || !name) {
    return res.status(400).json({ error: 'category_id and name are required' });
  }

  if (is_active && !['Y', 'N'].includes(is_active)) {
    return res.status(400).json({ error: "is_active must be 'Y' or 'N'" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bazaardb.product_categories (category_id, name, is_active)
       VALUES ($1, $2, $3) RETURNING *`,
      [category_id, name, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding category:', err.stack);

    if (err.code === '23505') {
      return res.status(409).json({ error: 'Category with this ID or name already exists' });
    }

    res.status(500).send('Server error');
  }
});

router.post('/update', authenticateToken, async (req, res) => {
  const category_id = req.headers['category_id'];
  const { name, is_active } = req.body;

  if (!category_id) {
    return res.status(400).json({ error: 'category_id is required in headers' });
  }

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  if (is_active && !['Y', 'N'].includes(is_active)) {
    return res.status(400).json({ error: "is_active must be 'Y' or 'N'" });
  }

  try {
    const result = await pool.query(
      `UPDATE bazaardb.product_categories
       SET name = $1, is_active = $2 WHERE category_id = $3 RETURNING *`,
      [name, is_active || 'Y', category_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating category ${category_id}:`, err.stack);
    res.status(500).send('Server error');
  }
});

module.exports = router;
