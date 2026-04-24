const Expense = require('../models/Expense');

exports.getExpenses = async (req, res) => {
  try {
    const { type, category, startDate, endDate, search } = req.query;
    let query = { userId: req.user.userId };

    if (search) query.title = { $regex: search, $options: 'i' };
    if (type && type !== 'All') query.type = type.toLowerCase();
    if (category && category !== 'All') query.category = category;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { title, amount, type, category, date, note } = req.body;

    if (!title || amount == null || !type) {
      return res.status(400).json({ success: false, message: 'Please provide required fields' });
    }

    if (amount < 0) {
      return res.status(400).json({ success: false, message: 'Amount cannot be negative' });
    }

    const expense = await Expense.create({
      userId: req.user.userId,
      title,
      amount,
      type,
      category,
      date,
      note
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.body.amount && req.body.amount < 0) {
      return res.status(400).json({ success: false, message: 'Amount cannot be negative' });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOneAndDelete({ _id: id, userId: req.user.userId });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.status(200).json({ success: true, message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
