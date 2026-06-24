const User = require('../models/User');
const Note = require('../models/Note');
const Chat = require('../models/Chat');
const Task = require('../models/Task');
const Vault = require('../models/Vault');
const Quote = require('../models/Quote');
const Finance = require('../models/Finance');
const Mess = require('../models/Mess');
const Health = require('../models/Health');
const mongoose = require('mongoose');
const os = require('os');
const bcrypt = require('bcryptjs');

exports.getStats = async (req, res) => {
  try {
    const [
      userCount,
      noteCount,
      chatCount,
      taskCount,
      vaultCount,
      quoteCount,
      financeCount,
      messCount,
      healthCount
    ] = await Promise.all([
      User.countDocuments(),
      Note.countDocuments(),
      Chat.countDocuments(),
      Task.countDocuments(),
      Vault.countDocuments(),
      Quote.countDocuments(),
      Finance.countDocuments(),
      Mess.countDocuments(),
      Health.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        users: userCount,
        notes: noteCount,
        chats: chatCount,
        tasks: taskCount,
        vault: vaultCount,
        quotes: quoteCount,
        finance: financeCount,
        mess: messCount,
        health: healthCount
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};

exports.getSystemInfo = async (req, res) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const dbStatus = mongoose.connection.readyState; 
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

    const dbStatusMap = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting'
    };

    res.json({
      success: true,
      system: {
        uptime: Math.floor(uptime),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
        },
        database: dbStatusMap[dbStatus] || 'Unknown',
        platform: os.platform(),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ success: false, message: 'Server error fetching system info' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user directory' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, name, role, authorizedModules } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name || '',
      role: role || 'user',
      authorizedModules: authorizedModules || ['notes', 'chat', 'tasks', 'finance', 'vault', 'drive', 'reminders', 'health', 'mess', 'quotes', 'calls', 'calendar']
    });

    const userObj = newUser.toObject();
    delete userObj.passwordHash;

    res.status(201).json({ success: true, user: userObj });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Server error creating user' });
  }
};

exports.updateUserFeatures = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, authorizedModules, name, password } = req.body;

    const updates = {};
    if (role !== undefined) updates.role = role;
    if (authorizedModules !== undefined) updates.authorizedModules = authorizedModules;
    if (name !== undefined) updates.name = name;
    if (password !== undefined && password.trim() !== '') {
      updates.passwordHash = await bcrypt.hash(password, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user features:', error);
    res.status(500).json({ success: false, message: 'Server error updating user features' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.userId) {
      return res.status(400).json({ success: false, message: 'Cannot delete own admin account' });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
};
