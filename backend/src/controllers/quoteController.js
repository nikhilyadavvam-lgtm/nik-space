const Quote = require('../models/Quote');

// GET /api/quotes
async function getQuotes(req, res) {
  try {
    const quotes = await Quote.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
}

// POST /api/quotes
async function createQuote(req, res) {
  try {
    const { text, author } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const quote = await Quote.create({
      userId: req.userId,
      text,
      author: author || 'Unknown'
    });
    res.status(201).json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quote' });
  }
}

// PUT /api/quotes/:id
async function updateQuote(req, res) {
  try {
    const { text, author } = req.body;
    const update = { updatedAt: new Date() };
    if (text !== undefined) update.text = text;
    if (author !== undefined) update.author = author;

    const quote = await Quote.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quote' });
  }
}

// DELETE /api/quotes/:id
async function deleteQuote(req, res) {
  try {
    const quote = await Quote.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete quote' });
  }
}

module.exports = { getQuotes, createQuote, updateQuote, deleteQuote };
