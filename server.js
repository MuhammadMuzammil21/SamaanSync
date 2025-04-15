require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('basic-auth');

const app = express();
app.use(bodyParser.json());

// Basic Auth Middleware
const auth = (req, res, next) => {
  const user = basicAuth(req);
  if (!user || user.name !== 'admin' || user.pass !== 'password123') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

app.use('/auth', require('./routes/auth'));
app.use('/inventory', require('./routes/inventory'));
app.use('/pricing', require('./routes/pricing'));
app.use('/productCategories', require('./routes/productCategories'));
app.use('/products', require('./routes/products'));
app.use('/productTransactions', require('./routes/productTransactions'));
app.use('/storeProducts', require('./routes/storeProducts'));
app.use('/stores', require('./routes/stores'));
app.use('/suppliers', require('./routes/suppliers'));
app.use('/supplierOrderProducts', require('./routes/supplierOrderProducts'));

app.listen(5000, () => console.log('Server running on port 5000'));
