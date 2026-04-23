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
