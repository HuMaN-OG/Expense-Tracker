const mongoose = require('mongoose');
const Expense = require('../models/Expense');

exports.getSummary = async (req, res) => {
  try {
    const summary = await Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] }
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] }
          }
        }
      }
    ]);

    const stats = summary.length > 0 ? summary[0] : { totalIncome: 0, totalExpense: 0 };
    const balance = stats.totalIncome - stats.totalExpense;

    res.status(200).json({
      success: true,
      data: {
        totalIncome: Number(stats.totalIncome.toFixed(2)),
        totalExpense: Number(stats.totalExpense.toFixed(2)),
        balance: Number(balance.toFixed(2))
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMonthlyBreakdown = async (req, res) => {
  try {
    const monthly = await Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$date" }
          },
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] }
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] }
          }
        }
      },
      { $sort: { "_id": 1 } },
      {
        $project: {
          month: "$_id",
          totalIncome: 1,
          totalExpense: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({ success: true, data: monthly });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoryBreakdown = async (req, res) => {
  try {
    const { month } = req.query; // Expecting YYYY-MM
    let match = { 
      userId: new mongoose.Types.ObjectId(req.user.userId),
      type: "expense"
    };

    if (month) {
      const [year, monthVal] = month.split('-').map(Number);
      const start = new Date(year, monthVal - 1, 1);
      const end = new Date(year, monthVal, 0, 23, 59, 59, 999);
      match.date = { $gte: start, $lte: end };
    }

    const categories = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" }
        }
      },
      {
        $project: {
          category: "$_id",
          total: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({ success: true, data: categories });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
