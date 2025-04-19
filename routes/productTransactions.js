const express = require('express');
const router = express.Router();
const pool = require('../db');
const { checkOverstocking, checkStockout, insertTransaction, updateInventory } = require('../helpers/inventoryChecks');
const { authenticateToken } = require('../middleware/authMiddleware');


router.get('/', authenticateToken, async (req, res) => {
  const result = await pool.query('SELECT * FROM samaansync.product_transactions');
  res.json(result.rows);
});

router.get('/transaction', authenticateToken, async (req, res) => {
  const transaction_id = req.headers['transaction_id'];

  if (!transaction_id) {
    return res.status(400).json({ error: 'transaction_id is required in headers' });
  }

  const result = await pool.query(
    'SELECT * FROM samaansync.product_transactions WHERE transaction_id = $1',
    [transaction_id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  res.json(result.rows[0]);
});

router.get('/by-date', authenticateToken, async (req, res) => {
  const date = req.headers['date'];

  if (!date) {
    return res.status(400).json({ error: 'date is required in headers (YYYY-MM-DD)' });
  }

  const result = await pool.query(
    'SELECT * FROM samaansync.product_transactions WHERE DATE(timestamp) = $1',
    [date]
  );

  res.json(result.rows);
});

router.get('/transaction-summary', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE movement_type = 'stock_in') AS stock_in_count,
        COUNT(*) FILTER (WHERE movement_type = 'sell') AS sell_count,
        COUNT(*) FILTER (WHERE movement_type = 'remove') AS remove_count
      FROM samaansync.product_transactions;
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching stock summary:', err);
    res.status(500).json({ error: 'Failed to fetch stock summary' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { store_id, product_id, quantity, updated_by, supplier_id, movement_type } = req.body;

  if (!store_id || !product_id || !quantity || !updated_by || !supplier_id || !movement_type) {
    return res.status(400).json({ error: 'Empty Data' });
  }

  try {
    await pool.query('BEGIN');

    switch (movement_type) {
      case 'stock_in': {
        const isOverstocked = await checkOverstocking(store_id, product_id, pool, quantity);
        if (isOverstocked) {
          await pool.query('ROLLBACK');
          return res.status(400).json({ error: 'Overstocking would occur. Transaction aborted.' });
        }

        await insertTransaction(store_id, product_id, quantity, movement_type, updated_by, supplier_id, pool);
        await updateInventory(store_id, product_id, quantity, pool);
        break;
      }

      case 'sell': {
        const isStockOut = await checkStockout(store_id, product_id, pool, quantity);
        if (isStockOut) {
          await pool.query('ROLLBACK');
          return res.status(400).json({ error: 'Stock is below minimum quantity. Please reorder.' });
        }

        await insertTransaction(store_id, product_id, quantity, movement_type, updated_by, supplier_id, pool);
        await updateInventory(store_id, product_id, -quantity, pool);
        break;
      }

      case 'remove': {
        const { rows } = await pool.query(
          `SELECT current_quantity FROM samaansync.inventory
           WHERE store_id = $1 AND product_id = $2 FOR UPDATE`,
          [store_id, product_id]
        );

        if (rows.length === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ error: 'Inventory item not found.' });
        }

        if (quantity > rows[0].current_quantity) {
          await pool.query('ROLLBACK');
          return res.status(400).json({ error: 'Not enough quantity in inventory to remove.' });
        }

        await insertTransaction(store_id, product_id, quantity, movement_type, updated_by, supplier_id, pool);
        await updateInventory(store_id, product_id, -quantity, pool);
        break;
      }

      default:
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid movement_type' });
    }

    await pool.query('COMMIT');
    return res.status(200).json({ message: `${movement_type} transaction processed successfully.` });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Transaction failed:', err);
    return res.status(500).json({ error: 'Transaction failed.' });
  }
});

module.exports = router;
