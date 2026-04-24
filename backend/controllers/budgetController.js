const Budget = require('../models/Budget');

exports.getBudgets = async (req, res) => {
  try {
    const { month } = req.query; // format: YYYY-MM
    let query = { userId: req.user.userId };
    if (month) {
      query.month = month;
    }

    const budgets = await Budget.find(query);
    res.status(200).json({ success: true, data: budgets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.setBudget = async (req, res) => {
  try {
    const { category, limit, month } = req.body;

    if (!category || limit == null || !month) {
      return res.status(400).json({ success: false, message: 'Please provide required fields' });
    }

    if (limit < 0) {
      return res.status(400).json({ success: false, message: 'Limit cannot be negative' });
    }

    const filter = { userId: req.user.userId, category, month };
    const update = { limit };

    const budget = await Budget.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
