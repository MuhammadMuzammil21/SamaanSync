const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bazaardb.stores');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching stores:', err.stack);
    res.status(500).send('Server error');
  }
});

router.get('/store', authenticateToken, async (req, res) => {
  const store_id = req.headers['store_id'];

  if (!store_id) {
    return res.status(400).json({ error: 'store_id is required in headers' });
  }

  try {
    const result = await pool.query('SELECT * FROM bazaardb.stores WHERE store_id = $1', [store_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching store with ID ${store_id}:`, err.stack);
    res.status(500).send('Server error');
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { store_id, name, is_active } = req.body;

  if (!store_id || !name) {
    return res.status(400).json({ error: 'store_id and name are required' });
  }

  if (is_active && !['Y', 'N'].includes(is_active)) {
    return res.status(400).json({ error: "is_active must be 'Y' or 'N'" });
  }

  try {
    const result = await pool.query(
      'INSERT INTO bazaardb.stores (store_id, name, is_active) VALUES ($1, $2, $3) RETURNING *',
      [store_id, name, is_active || 'Y']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding store:', err.stack);

    if (err.code === '23505') {
      return res.status(409).json({ error: 'Store with this ID or name already exists' });
    }
    res.status(500).send('Server error');
  }
});

router.post('/update', authenticateToken, async (req, res) => {
  const store_id = req.headers['store_id'];
  const { name, is_active } = req.body;

  if (!store_id) {
    return res.status(400).json({ error: 'store_id is required in headers' });
  }

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  if (is_active && !['Y', 'N'].includes(is_active)) {
    return res.status(400).json({ error: "is_active must be 'Y' or 'N'" });
  }

  try {
    const result = await pool.query(
      `UPDATE bazaardb.stores
       SET name = $1, is_active = $2
       WHERE store_id = $3 RETURNING *`,
      [name, is_active || 'Y', store_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating store:', err.stack);
    res.status(500).send('Server error');
  }
});

module.exports = router;
