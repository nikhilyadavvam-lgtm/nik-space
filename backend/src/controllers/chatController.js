const Chat = require('../models/Chat');
const User = require('../models/User');

const IMAGE_CONTENT_PREFIX = '[Image]: ';

function stripImageFallback(content = '') {
  return content
    .split('\n')
    .filter((line) => !line.startsWith(IMAGE_CONTENT_PREFIX))
    .join('\n')
    .trim();
}

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

    const cleanContent = stripImageFallback(content);
    const messageContent = cleanContent || (imageUrl ? '[Image]' : '');
    chat.messages.push({ role, content: messageContent, imageUrl });
    chat.updatedAt = new Date();

    // Auto-title from first user message only if it still has the default title
    if (chat.messages.length === 1 && role === 'user' && chat.title === 'New Chat') {
      // Use first 50 chars of the message as title
      chat.title = messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : '');
    }

    await chat.save();

    // Contact chat mirroring logic
    if (chat.title.startsWith('Chat with ')) {
      const recipientName = chat.title.replace('Chat with ', '').trim();
      const sender = await User.findById(req.userId);
      const recipient = await User.findOne({ name: recipientName });
      
      if (sender && recipient) {
        const mirrorTitle = `Chat with ${sender.name}`;
        let mirrorChat = await Chat.findOne({ userId: recipient._id, title: mirrorTitle });
        
        if (!mirrorChat) {
          mirrorChat = new Chat({
            userId: recipient._id,
            title: mirrorTitle,
            messages: []
          });
        }
        
        // Add the mirrored message so it shows on the left (as 'assistant' role)
        mirrorChat.messages.push({
          role: 'assistant',
          content: messageContent,
          imageUrl
        });
        mirrorChat.updatedAt = new Date();
        await mirrorChat.save();
      }
    }

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

// PUT /api/chats/:id/messages/:messageId/react
async function toggleReaction(req, res) {
  try {
    const { emoji } = req.body;
    const userId = req.userId;
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const message = chat.messages.id(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (!message.reactions) {
      message.reactions = [];
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ emoji, userId });
    }

    await chat.save();
    res.json(chat);
  } catch (err) {
    console.error('Toggle reaction error:', err);
    res.status(500).json({ error: 'Failed to toggle reaction' });
  }
}

module.exports = { getChats, getChat, createChat, addMessage, deleteChat, updateChat, updateMessage, deleteMessage, toggleReaction };
