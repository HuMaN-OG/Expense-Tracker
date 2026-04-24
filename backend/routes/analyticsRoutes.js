const express = require('express');
const router = express.Router();
const { getSummary, getMonthlyBreakdown, getCategoryBreakdown } = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/summary', getSummary);
router.get('/monthly', getMonthlyBreakdown);
router.get('/categories', getCategoryBreakdown);

module.exports = router;
