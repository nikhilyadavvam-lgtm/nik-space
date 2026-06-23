const Finance = require('../models/Finance');

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Finance.find({ userId: req.userId }).sort({ date: -1 });
    res.json({ expenses });
  } catch (error) {
    console.error('Fetch Expenses Error:', error);
    res.status(500).json({ error: 'Server error fetching expenses' });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { amount, category, title, note, spentOn, entryType } = req.body;
    const expense = new Finance({
      userId: req.userId,
      amount,
      category,
      title,
      note,
      entryType: entryType || 'expense',
      spentOn: spentOn || new Date(),
      description: note, // For backward compatibility
      date: spentOn || new Date(), // For backward compatibility
    });
    await expense.save();
    res.status(201).json({ expense });
  } catch (error) {
    console.error('Expense Creation Error:', error);
    res.status(500).json({ 
      error: 'Server error creating expense',
      message: error.message 
    });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Finance.findOneAndDelete({ _id: id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully', expenseId: id });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting expense' });
  }
};
