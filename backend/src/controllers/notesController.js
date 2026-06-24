const mongoose = require('mongoose');
const Folder = require('../models/Folder');
const NoteChannel = require('../models/NoteChannel');

// GET /api/notes
// Fetches all folders populated with their respective channels in a nested structure
async function getNotes(req, res) {
  try {
    const folders = await Folder.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      {
        $lookup: {
          from: 'notechannels', // collection name in mongodb
          localField: '_id',
          foreignField: 'folderId',
          as: 'channels'
        }
      },
      { $sort: { name: 1 } }
    ]);
    res.json(folders);
  } catch (err) {
    console.error('Get notes hierarchy error:', err);
    res.status(500).json({ error: 'Failed to fetch notes directory' });
  }
}

// GET /api/notes/:id
// Fetches details of a single channel/note
async function getNote(req, res) {
  try {
    const channel = await NoteChannel.findOne({ _id: req.params.id, userId: req.userId });
    if (!channel) return res.status(404).json({ error: 'Note channel not found' });
    res.json(channel);
  } catch (err) {
    console.error('Get note channel error:', err);
    res.status(500).json({ error: 'Failed to fetch note channel' });
  }
}

// POST /api/notes
// Creates a channel. Fallback: Creates a default "General" folder if no folderId is provided.
async function createNote(req, res) {
  try {
    const { title, content, tags, isPinned, folderId, type } = req.body;
    let resolvedFolderId = folderId;

    if (!resolvedFolderId) {
      let defaultFolder = await Folder.findOne({ name: 'General', userId: req.userId });
      if (!defaultFolder) {
        defaultFolder = await Folder.create({
          name: 'General',
          userId: req.userId
        });
      }
      resolvedFolderId = defaultFolder._id;
    }

    const channel = await NoteChannel.create({
      userId: req.userId,
      folderId: resolvedFolderId,
      title: title || 'Untitled Channel',
      type: type || 'text',
      content: content || '',
      tags: tags || [],
      isPinned: isPinned || false,
    });

    res.status(201).json(channel);
  } catch (err) {
    console.error('Create note channel error:', err);
    res.status(500).json({ error: 'Failed to create note channel' });
  }
}

// POST /api/notes/folders
// Creates a new project folder
async function createFolder(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const folder = await Folder.create({
      userId: req.userId,
      name: name.trim(),
    });
    res.status(201).json(folder);
  } catch (err) {
    console.error('Create folder error:', err);
    res.status(500).json({ error: 'Failed to create project folder' });
  }
}

// PUT /api/notes/:id
// Updates a channel (content, title, pins, etc.)
async function updateNote(req, res) {
  try {
    const { title, content, tags, isPinned, folderId } = req.body;
    const update = { updatedAt: new Date() };
    
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (tags !== undefined) update.tags = tags;
    if (isPinned !== undefined) update.isPinned = isPinned;
    if (folderId !== undefined) update.folderId = folderId;

    const channel = await NoteChannel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );
    if (!channel) return res.status(404).json({ error: 'Note channel not found' });
    res.json(channel);
  } catch (err) {
    console.error('Update note channel error:', err);
    res.status(500).json({ error: 'Failed to update note channel' });
  }
}

// DELETE /api/notes/:id
// Deletes a channel
async function deleteNote(req, res) {
  try {
    const channel = await NoteChannel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!channel) return res.status(404).json({ error: 'Note channel not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete note channel error:', err);
    res.status(500).json({ error: 'Failed to delete note channel' });
  }
}

// DELETE /api/notes/folders/:id
// Deletes a folder and all channels nested inside it
async function deleteFolder(req, res) {
  try {
    const folder = await Folder.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!folder) return res.status(404).json({ error: 'Folder not found' });

    // Cascade delete all note channels belonging to this folder
    await NoteChannel.deleteMany({ folderId: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete folder error:', err);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
}

// POST /api/notes/:id/messages
// Adds a chat message inside a chat channel
async function addChannelMessage(req, res) {
  try {
    const { role, content, imageUrl } = req.body;
    const channel = await NoteChannel.findOne({ _id: req.params.id, userId: req.userId });
    if (!channel) return res.status(404).json({ error: 'Note channel not found' });

    channel.messages.push({ role, content, imageUrl });
    channel.updatedAt = new Date();

    await channel.save();
    res.status(201).json(channel);
  } catch (err) {
    console.error('Add channel message error:', err);
    res.status(500).json({ error: 'Failed to add message to channel' });
  }
}

// PUT /api/notes/:id/messages/:messageId
// Updates a message content inside a chat channel
async function updateChannelMessage(req, res) {
  try {
    const { content } = req.body;
    const channel = await NoteChannel.findOne({ _id: req.params.id, userId: req.userId });
    if (!channel) return res.status(404).json({ error: 'Note channel not found' });

    const message = channel.messages.id(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    message.content = content;
    channel.updatedAt = new Date();
    await channel.save();
    
    res.json(channel);
  } catch (err) {
    console.error('Update channel message error:', err);
    res.status(500).json({ error: 'Failed to update channel message' });
  }
}

// DELETE /api/notes/:id/messages/:messageId
// Deletes a message inside a chat channel
async function deleteChannelMessage(req, res) {
  try {
    const channel = await NoteChannel.findOne({ _id: req.params.id, userId: req.userId });
    if (!channel) return res.status(404).json({ error: 'Note channel not found' });

    channel.messages.pull({ _id: req.params.messageId });
    channel.updatedAt = new Date();
    await channel.save();

    res.json(channel);
  } catch (err) {
    console.error('Delete channel message error:', err);
    res.status(500).json({ error: 'Failed to delete channel message' });
  }
}

module.exports = {
  getNotes,
  getNote,
  createNote,
  createFolder,
  updateNote,
  deleteNote,
  deleteFolder,
  addChannelMessage,
  updateChannelMessage,
  deleteChannelMessage
};
