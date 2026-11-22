const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

// CORS configuration allowing frontend clients on other ports/origins[cite: 1, 6]
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(__dirname));

// In-memory data store[cite: 6]
let products = [
  { id: 1, name: 'Laptop Dell XPS 15', price: 35000000, category: 'Electronics' },
  { id: 2, name: 'Logitech MX Master 3S Mouse', price: 2400000, category: 'Accessories' }
];

// GET: List products with optional category query filtering[cite: 6, 8]
app.get('/api/v1/products', (req, res) => {
  const { category } = req.query;
  let result = products;

  if (category && category !== 'All Categories') {
    result = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  res.json({ success: true, count: result.length, data: result });
});

// POST: Add new product[cite: 6, 7]
app.post('/api/v1/products', (req, res) => {
  const { name, price, category } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Product name and price are required!' });
  }

  const newProduct = {
    id: Date.now(),
    name,
    price: Number(price),
    category: category || 'General'
  };

  products.push(newProduct);
  res.status(201).json({ success: true, message: 'Product added successfully', data: newProduct });
});

// PUT: Update product by ID[cite: 7]
app.put('/api/v1/products/:id', (req, res) => {
  const productId = Number(req.params.id);
  const { name, price, category } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Product name and price are required!' });
  }

  const index = products.findIndex(p => p.id === productId);
  if (index === -1) {
    return res.status(404).json({ success: false, message: `Product ID ${productId} not found` });
  }

  products[index] = { id: productId, name, price: Number(price), category: category || 'General' };
  res.json({ success: true, message: 'Product updated successfully', data: products[index] });
});

// DELETE: Remove product by ID[cite: 7]
app.delete('/api/v1/products/:id', (req, res) => {
  const productId = Number(req.params.id);
  const exists = products.some(p => p.id === productId);

  if (!exists) {
    return res.status(404).json({ success: false, message: `Product ID ${productId} not found` });
  }

  products = products.filter(p => p.id !== productId);
  res.json({ success: true, message: `Deleted product ID ${productId}` });
});

app.listen(PORT, () => {
  console.log(`Backend API running at: http://localhost:${PORT}`);
});