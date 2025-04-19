const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM samaansync.suppliers');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching suppliers:', err.stack);
    res.status(500).send('Server error');
  }
});

router.get('/view', authenticateToken, async (req, res) => {
  const supplier_id = req.headers['supplier_id'];

  if (!supplier_id) {
    return res.status(400).json({ error: 'supplier_id is required in headers' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM samaansync.suppliers WHERE supplier_id = $1',
      [supplier_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching supplier ${supplier_id}:`, err.stack);
    res.status(500).send('Server error');
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { supplier_id, name, contact_info, is_active = 'Y' } = req.body;

  if (!supplier_id || !name) {
    return res.status(400).json({ error: 'supplier_id and name are required' });
  }

  if (!['Y', 'N'].includes(is_active)) {
    return res.status(400).json({ error: "is_active must be 'Y' or 'N'" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO samaansync.suppliers (supplier_id, name, contact_info, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [supplier_id, name, contact_info || null, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding supplier:', err.stack);

    if (err.code === '23505') {
      return res.status(409).json({ error: 'Supplier with this ID or name already exists' });
    }

    res.status(500).send('Server error');
  }
});

router.post('/update', authenticateToken, async (req, res) => {
  const supplier_id = req.headers['supplier_id'];
  const { name, contact_info, is_active } = req.body;

  if (!supplier_id || !name) {
    return res.status(400).json({ error: 'supplier_id (in header) and name are required' });
  }

  if (is_active && !['Y', 'N'].includes(is_active)) {
    return res.status(400).json({ error: "is_active must be 'Y' or 'N'" });
  }

  try {
    const result = await pool.query(
      `UPDATE samaansync.suppliers
       SET name = $1, contact_info = $2, is_active = $3
       WHERE supplier_id = $4 RETURNING *`,
      [name, contact_info || null, is_active || 'Y', supplier_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating supplier ${supplier_id}:`, err.stack);
    res.status(500).send('Server error');
  }
});

module.exports = router;
