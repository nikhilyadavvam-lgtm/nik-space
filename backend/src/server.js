const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
const { validateEnv } = require('./config/env');
const routes = require('./routes');

// Validate environment on startup
validateEnv();

const app = express();
const PORT = process.env.PORT || 10000;

app.set('trust proxy', 1); 

// ── Inline NoSQL injection sanitizer ──
function sanitize(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitize(obj[key]);
    }
  }
  return obj;
}

// ── Security middleware ──
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  if (req.body) sanitize(req.body);
  next();
});


app.get('/', (req, res) => {
  res.json({ message: 'Welcome to NIK SPACE backend' });

});
// ── Routes ──
app.use('/api', routes);

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start server & Socket.io Signaling ──
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { sendPushNotification } = require('./utils/pushNotification');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Map of online userIds -> { socketId, name, emoji }
const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Authentication error: Token is required'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', async (socket) => {
  console.log(`🔌 WebRTC: User connected ${socket.userId} on socket ${socket.id}`);

  try {
    const user = await User.findById(socket.userId);
    if (user) {
      onlineUsers.set(socket.userId, {
        socketId: socket.id,
        name: user.name,
        emoji: user.emoji || '⚡',
      });

      // Broadcast updated online presence map to all connected sockets
      const presenceList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
        userId: id,
        name: data.name,
        emoji: data.emoji,
        online: true,
      }));
      io.emit('presence-update', presenceList);
    }
  } catch (err) {
    console.error('Socket user registration error:', err);
  }

  // WebRTC signaling forwards
  socket.on('call:initiate', async ({ toUserId, offer, isVideo }) => {
    try {
      const caller = await User.findById(socket.userId);
      if (!caller || (caller.role !== 'admin' && !(caller.authorizedModules || []).includes('calls'))) {
        socket.emit('call:error', { message: 'Calling feature is not enabled for your account.' });
        return;
      }

      const receiver = await User.findById(toUserId);
      if (!receiver || (receiver.role !== 'admin' && !(receiver.authorizedModules || []).includes('calls'))) {
        socket.emit('call:error', { message: 'The user you are trying to call does not have calls enabled.' });
        return;
      }

      const target = onlineUsers.get(toUserId);
      if (target) {
        io.to(target.socketId).emit('call:incoming', {
          fromUserId: socket.userId,
          offer,
          isVideo,
        });
      } else {
        // Send Expo Push Notification
        if (receiver.expoPushToken) {
          sendPushNotification(
            receiver.expoPushToken,
            'Missed Call',
            `Incoming ${isVideo ? 'video' : 'voice'} call from ${caller.name || 'someone'}`,
            { type: 'call', isVideo, fromUserId: socket.userId }
          );
        }
        socket.emit('call:error', { message: 'User is currently offline. A push notification has been sent.' });
      }
    } catch (err) {
      console.error('Signaling validation error:', err);
      socket.emit('call:error', { message: 'An internal error occurred while placing the call.' });
    }
  });

  socket.on('call:accept', ({ toUserId, answer }) => {
    const target = onlineUsers.get(toUserId);
    if (target) {
      io.to(target.socketId).emit('call:accepted', {
        answer,
      });
    }
  });

  socket.on('call:decline', ({ toUserId }) => {
    const target = onlineUsers.get(toUserId);
    if (target) {
      io.to(target.socketId).emit('call:declined');
    }
  });

  socket.on('call:ice-candidate', ({ toUserId, candidate }) => {
    const target = onlineUsers.get(toUserId);
    if (target) {
      io.to(target.socketId).emit('call:ice-candidate', {
        candidate,
      });
    }
  });

  socket.on('call:hangup', ({ toUserId }) => {
    const target = onlineUsers.get(toUserId);
    if (target) {
      io.to(target.socketId).emit('call:hangup');
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 WebRTC: User disconnected ${socket.userId}`);
    onlineUsers.delete(socket.userId);

    // Broadcast updated presence list
    const presenceList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
      userId: id,
      name: data.name,
      emoji: data.emoji,
      online: true,
    }));
    io.emit('presence-update', presenceList);
  });
});

connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NIK SPACE backend running on http://0.0.0.0:${PORT}`);
  });
});
