const NoteChannel = require('../models/NoteChannel');
const Task = require('../models/Task');
const Chat = require('../models/Chat');
const Vault = require('../models/Vault');
const User = require('../models/User');

// GET /api/search?q=query
async function globalSearch(req, res) {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json({ notes: [], tasks: [], chats: [], vault: [] });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const authorized = user.authorizedModules || [];
    const isAdmin = user.role === 'admin';
    const hasAccess = (mod) => isAdmin || authorized.includes(mod);

    const regex = new RegExp(q, 'i');

    // Run queries conditionally depending on user access
    const searchPromises = [
      hasAccess('notes') 
        ? NoteChannel.find({ userId: req.userId, $or: [{ title: regex }, { content: regex }] }).select('title content type updatedAt')
        : Promise.resolve([]),
      hasAccess('tasks')
        ? Task.find({ userId: req.userId, title: regex }).select('title status dueDate')
        : Promise.resolve([]),
      hasAccess('chat')
        ? Chat.find({ userId: req.userId, $or: [{ title: regex }, { 'messages.content': regex }] }).select('title updatedAt messages')
        : Promise.resolve([]),
      hasAccess('vault')
        ? Vault.find({ userId: req.userId, accountName: regex }).select('accountName updatedAt')
        : Promise.resolve([])
    ];

    const [notes, tasks, chats, vault] = await Promise.all(searchPromises);

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
