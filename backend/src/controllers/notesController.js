const Note = require('../models/Note');

// GET /api/notes
async function getNotes(req, res) {
  try {
    const notes = await Note.find({ userId: req.userId })
      .sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
}

// GET /api/notes/:id
async function getNote(req, res) {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
}

// POST /api/notes
async function createNote(req, res) {
  try {
    const { title, content, tags, isPinned } = req.body;
    const note = await Note.create({
      userId: req.userId,
      title,
      content: content || '',
      tags: tags || [],
      isPinned: isPinned || false,
    });
    res.status(201).json(note);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
}

// PUT /api/notes/:id
async function updateNote(req, res) {
  try {
    const { title, content, tags, isPinned } = req.body;
    const update = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (tags !== undefined) update.tags = tags;
    if (isPinned !== undefined) update.isPinned = isPinned;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
}

// DELETE /api/notes/:id
async function deleteNote(req, res) {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
}

module.exports = { getNotes, getNote, createNote, updateNote, deleteNote };
