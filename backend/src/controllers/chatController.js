const Chat = require('../models/Chat');

// GET /api/chats — list all threads (without full messages)
async function getChats(req, res) {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .select('title description icon createdAt updatedAt messages')
      .sort({ updatedAt: -1 });

    // Return threads with lastMessage preview and message count
    const result = chats.map(chat => ({
      _id: chat._id,
      title: chat.title,
      description: chat.description,
      icon: chat.icon,
      messageCount: chat.messages.length,
      lastMessage: chat.messages.length > 0
        ? chat.messages[chat.messages.length - 1]
        : null,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));

    res.json(result);
  } catch (err) {
    console.error('Get chats error:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
}

// GET /api/chats/:id — single thread with all messages
async function getChat(req, res) {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
}

// POST /api/chats — create new thread
async function createChat(req, res) {
  try {
    const { title } = req.body;
    const chat = await Chat.create({
      userId: req.userId,
      title: title || 'New Chat',
      messages: [],
    });
    res.status(201).json(chat);
  } catch (err) {
    console.error('Create chat error:', err);
    res.status(500).json({ error: 'Failed to create chat' });
  }
}

// POST /api/chats/:id/messages — add message to thread
async function addMessage(req, res) {
  try {
    const { role, content, imageUrl } = req.body;
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    chat.messages.push({ role, content, imageUrl });
    chat.updatedAt = new Date();

    // Auto-title from first user message
    if (chat.messages.length === 1 && role === 'user') {
      // Use first 50 chars of the message as title
      chat.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }

    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    console.error('Add message error:', err);
    res.status(500).json({ error: 'Failed to add message' });
  }
}

// DELETE /api/chats/:id
async function deleteChat(req, res) {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
}

// PUT /api/chats/:id
async function updateChat(req, res) {
  try {
    const { title, icon, description } = req.body;
    const update = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (icon !== undefined) update.icon = icon;
    if (description !== undefined) update.description = description;

    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update chat' });
  }
}

// PUT /api/chats/:id/messages/:messageId
async function updateMessage(req, res) {
  try {
    const { content } = req.body;
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const message = chat.messages.id(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    message.content = content;
    chat.updatedAt = new Date();
    await chat.save();
    
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message' });
  }
}

// DELETE /api/chats/:id/messages/:messageId
async function deleteMessage(req, res) {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    // Use Mongoose pull to remove the message
    chat.messages.pull({ _id: req.params.messageId });
    chat.updatedAt = new Date();
    await chat.save();

    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
}

module.exports = { getChats, getChat, createChat, addMessage, deleteChat, updateChat, updateMessage, deleteMessage };
