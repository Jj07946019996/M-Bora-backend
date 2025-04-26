// M Bora Backend (Node.js + Express + MongoDB)

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String
});
const User = mongoose.model('User', userSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  name: String,
  phone: String,
  amount: Number,
  date: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// Middleware for authentication
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ name, email, phone, password: hashed });
    res.json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ error: 'Email already in use' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Send money
app.post('/api/send', auth, async (req, res) => {
  const { name, phone, amount } = req.body;
  await Transaction.create({ userId: req.user.id, type: 'send', name, phone, amount });
  res.json({ message: 'Money sent (simulated)' });
});

// Receive money
app.post('/api/receive', auth, async (req, res) => {
  const { name, phone, amount } = req.body;
  await Transaction.create({ userId: req.user.id, type: 'receive', name, phone, amount });
  res.json({ message: 'Money received (simulated)' });
});

// Transaction history
app.get('/api/history', auth, async (req, res) => {
  const history = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
  res.json(history);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));