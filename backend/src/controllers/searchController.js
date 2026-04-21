const Note = require('../models/Note');
const Task = require('../models/Task');
const Chat = require('../models/Chat');
const Vault = require('../models/Vault');
// const Reminder = require('../models/Reminder'); 

// GET /api/search?q=query
async function globalSearch(req, res) {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json({ notes: [], tasks: [], chats: [], vault: [] });
    }

    const regex = new RegExp(q, 'i');

    const [notes, tasks, chats, vault] = await Promise.all([
      Note.find({ userId: req.userId, $or: [{ title: regex }, { content: regex }] }).select('title content updatedAt'),
      Task.find({ userId: req.userId, title: regex }).select('title status dueDate'),
      Chat.find({ userId: req.userId, $or: [{ title: regex }, { 'messages.content': regex }] }).select('title updatedAt messages'),
      Vault.find({ userId: req.userId, accountName: regex }).select('accountName updatedAt')
    ]);

    res.json({
      notes: notes || [],
      tasks: tasks || [],
      chats: chats || [],
      vault: vault || [],
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search' });
  }
}

module.exports = { globalSearch };
