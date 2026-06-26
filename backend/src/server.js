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
const PORT = process.env.PORT || 5000;

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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

app.set('io', io);

// Map of online userIds -> { socketId, name, emoji }
const onlineUsers = new Map();

// Map of sessionId -> { id, status, callerId, receiverId, callerSocketId, receiverSocketId, offer, answer, candidatesQueue: [] }
const callSessions = new Map();

function getSessionId(userA, userB) {
  return [userA.toString(), userB.toString()].sort().join('_');
}

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
  socket.join(`user:${socket.userId}`);

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

      const sessionId = getSessionId(socket.userId, toUserId);
      let session = callSessions.get(sessionId);

      if (session && session.status === 'connected') {
        console.log(`🔌 WebRTC: Renegotiation / ICE restart initiated for session ${sessionId}`);
        session.status = 'renegotiating';
      } else {
        session = {
          id: sessionId,
          status: 'ringing',
          callerId: socket.userId,
          receiverId: toUserId,
          callerSocketId: socket.id,
          receiverSocketId: null,
          offer,
          candidatesQueue: [],
        };
        callSessions.set(sessionId, session);
      }

      const target = onlineUsers.get(toUserId);
      if (target) {
        // Direct route lookup for maximum speed / low latency
        const targetSocket = io.sockets.sockets.get(target.socketId);
        if (targetSocket) {
          targetSocket.emit('call:incoming', {
            fromUserId: socket.userId,
            offer,
            isVideo,
          });
        } else {
          io.to(target.socketId).emit('call:incoming', {
            fromUserId: socket.userId,
            offer,
            isVideo,
          });
        }
      } else {
        // Clear session if user is offline
        callSessions.delete(sessionId);
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
    const sessionId = getSessionId(socket.userId, toUserId);
    const session = callSessions.get(sessionId);

    if (!session) {
      console.warn(`⚠️ Rejected call accept: Session ${sessionId} not found`);
      return;
    }

    if (session.status !== 'ringing' && session.status !== 'renegotiating') {
      console.warn(`⚠️ Rejected call accept: Session state is ${session.status}`);
      return;
    }

    session.status = 'connected';
    session.receiverSocketId = socket.id;
    session.answer = answer;

    const target = onlineUsers.get(toUserId);
    if (target) {
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('call:accepted', { answer });
      } else {
        io.to(target.socketId).emit('call:accepted', { answer });
      }
    }

    // Flush any buffered candidates now that the remote description can be set safely
    if (session.candidatesQueue && session.candidatesQueue.length > 0) {
      console.log(`🔌 WebRTC: Flushing ${session.candidatesQueue.length} buffered candidates for session ${sessionId}`);
      session.candidatesQueue.forEach((item) => {
        const itemTarget = onlineUsers.get(item.toUserId);
        if (itemTarget) {
          const itemSocket = io.sockets.sockets.get(itemTarget.socketId);
          if (itemSocket) {
            itemSocket.emit('call:ice-candidate', { candidate: item.candidate });
          } else {
            io.to(itemTarget.socketId).emit('call:ice-candidate', { candidate: item.candidate });
          }
        }
      });
      session.candidatesQueue = [];
    }
  });

  socket.on('call:decline', ({ toUserId }) => {
    const sessionId = getSessionId(socket.userId, toUserId);
    callSessions.delete(sessionId);

    const target = onlineUsers.get(toUserId);
    if (target) {
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('call:declined');
      } else {
        io.to(target.socketId).emit('call:declined');
      }
    }
  });

  socket.on('call:ice-candidate', ({ toUserId, candidate }) => {
    const sessionId = getSessionId(socket.userId, toUserId);
    const session = callSessions.get(sessionId);

    if (!session) {
      console.warn(`⚠️ ICE candidate ignored: Session ${sessionId} not active`);
      return;
    }

    // Buffer candidates during the initial ringing phase to prevent race conditions on slow peers
    if (session.status === 'ringing') {
      console.log(`🔌 WebRTC: Buffering ICE candidate for session ${sessionId}`);
      session.candidatesQueue.push({ toUserId, candidate });
      return;
    }

    const target = onlineUsers.get(toUserId);
    if (target) {
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('call:ice-candidate', { candidate });
      } else {
        io.to(target.socketId).emit('call:ice-candidate', { candidate });
      }
    }
  });

  socket.on('call:hangup', ({ toUserId }) => {
    const sessionId = getSessionId(socket.userId, toUserId);
    callSessions.delete(sessionId);

    const target = onlineUsers.get(toUserId);
    if (target) {
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.emit('call:hangup');
      } else {
        io.to(target.socketId).emit('call:hangup');
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 WebRTC: User disconnected ${socket.userId}`);
    onlineUsers.delete(socket.userId);

    // Clean up all active sessions containing this user
    for (const [sessionId, session] of callSessions.entries()) {
      if (session.callerId === socket.userId || session.receiverId === socket.userId) {
        const peerId = session.callerId === socket.userId ? session.receiverId : session.callerId;
        const target = onlineUsers.get(peerId);
        if (target) {
          const targetSocket = io.sockets.sockets.get(target.socketId);
          if (targetSocket) {
            targetSocket.emit('call:hangup');
          } else {
            io.to(target.socketId).emit('call:hangup');
          }
        }
        callSessions.delete(sessionId);
        console.log(`🔌 WebRTC: Cleaned up session ${sessionId} due to user disconnect`);
      }
    }

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

