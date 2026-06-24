const mongoose = require('mongoose');

const noteChannelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['text', 'chat'],
    default: 'text',
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      default: 'user',
    },
    content: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isPinned: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for fast queries inside a folder
noteChannelSchema.index({ folderId: 1, isPinned: -1, updatedAt: -1 });

module.exports = mongoose.model('NoteChannel', noteChannelSchema);
