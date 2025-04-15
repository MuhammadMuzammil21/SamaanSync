const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken,async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bazaardb.inventory');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching inventory', err);
    res.status(500).send('Server error');
  }
});

router.get('/item', authenticateToken, async (req, res) => {
  const inventory_id = req.headers['inventory_id'];
  const store_id = req.headers['store_id'];
  if (!inventory_id) {
    return res.status(400).json({ message: 'Inventory ID is required in the header' });
  }

  try {
    const result = await pool.query('SELECT * FROM bazaardb.inventory WHERE inventory_id = $1 AND store_id = $2', [inventory_id, store_id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching inventory', err);
    res.status(500).send('Server error');
  }
});

router.get("/status", authenticateToken, async (req, res) => {
  const store_id = req.headers['store_id'];
    if (!store_id) {
    return res.status(400).json({ message: 'Store ID is required in the header' });
  }
   try {
    const result = await pool.query('SELECT * FROM bazaardb.inventory WHERE store_id = $1', [store_id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching inventory', err);
    res.status(500).send('Server error');
  }

})

router.post('/', authenticateToken, async (req, res) => {
  const { store_id, product_id, current_quantity } = req.body;
  try {
    const existingRecord = await pool.query(
      `SELECT * FROM bazaardb.inventory WHERE store_id = $1 AND product_id = $2`,
      [store_id, product_id]
    );

    if (existingRecord.rows.length > 0) {
      return res.status(400).json({
        message: `Record already exists for product ${product_id} in store ${store_id}.`
      });
    } else {
      const result = await pool.query(
        `INSERT INTO bazaardb.inventory (store_id, product_id, current_quantity, last_updated)
         VALUES ($1, $2, $3, NOW())`,
        [store_id, product_id, current_quantity]
      );

      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    console.error('Error adding inventory', err);
    res.status(500).send('Server error');
  }
});


router.post('/update', authenticateToken, async (req, res) => {
  const inventory_id = req.headers['inventory_id'];
  const { current_quantity } = req.body;

  if (!inventory_id) {
    return res.status(400).json({ message: 'Inventory ID is required in the header' });
  }

  try {
    const result = await pool.query(
      `UPDATE bazaardb.inventory SET current_quantity = $1, last_updated = CURRENT_TIMESTAMP
       WHERE inventory_id = $2 RETURNING *`,
      [current_quantity, inventory_id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Inventory not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating inventory', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
