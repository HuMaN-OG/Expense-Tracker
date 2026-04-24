const express = require('express');
const router = express.Router();
const { getBudgets, setBudget } = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.route('/')
  .get(getBudgets)
  .post(setBudget);

module.exports = router;
