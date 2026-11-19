const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health is only "ok" when MongoDB is connected.
app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    database: connected ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));

async function start() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGO_URI and JWT_SECRET must both be configured');
  }

  // Do not advertise a ready HTTP service before its database is reachable.
  await connectDB();
  const port = process.env.PORT || 5000;
  return app.listen(port, () => console.log(`Server started on port ${port}`));
}

if (require.main === module) {
  start().catch(error => {
    console.error('Backend startup failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, start };
