const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true, // encrypted on client
  },
  imageUrl: {
    type: String,
    default: null,
  },
  reactions: [
    {
      emoji: {
        type: String,
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New Chat',
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'message-square',
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

chatSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
