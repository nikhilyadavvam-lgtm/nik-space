# 🧠 Digital Brain — Backend, Database & AI Guide
> Stack: Node.js · Express · MongoDB Atlas · JWT · AES-256 · Claude/OpenRouter AI

---

## 🏗️ Architecture Overview

```
Client (Next.js)
    │
    │  HTTPS + JWT
    ▼
Express API (Node.js)
    │
    ├─ Middleware (auth, validation, rate-limit)
    ├─ Routes  → Controllers → Services
    │
    ├─ MongoDB (Atlas Free Tier)
    └─ AI Service (OpenRouter / Claude API)
         └─ Safety filter blocks sensitive modules
```

---

## 📦 Required Packages

```bash
mkdir digital-brain-backend && cd digital-brain-backend
npm init -y

# Core
npm install express mongoose dotenv cors helmet

# Auth
npm install jsonwebtoken bcryptjs

# Validation
npm install zod express-zod-api    # OR: joi

# Rate Limiting & Security
npm install express-rate-limit
npm install express-mongo-sanitize  # Prevent NoSQL injection

# AI
npm install openai                  # Works with OpenRouter too

# Dev
npm install -D typescript tsx nodemon @types/node @types/express
```

---

## ⚙️ Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts             ← MongoDB connect
│   │   └── env.ts            ← Env validation on startup
│   │
│   ├── middleware/
│   │   ├── auth.ts           ← JWT verify
│   │   ├── rateLimit.ts      ← Per-route limiters
│   │   └── validate.ts       ← Zod schema wrapper
│   │
│   ├── models/               ← Mongoose schemas
│   │   ├── User.ts
│   │   ├── Note.ts
│   │   ├── Chat.ts
│   │   ├── Task.ts
│   │   ├── Project.ts
│   │   ├── Vault.ts
│   │   ├── Finance.ts
│   │   └── Reminder.ts
│   │
│   ├── controllers/          ← Request/response handlers
│   │   ├── authController.ts
│   │   ├── notesController.ts
│   │   ├── chatController.ts
│   │   ├── tasksController.ts
│   │   ├── vaultController.ts
│   │   ├── financeController.ts
│   │   ├── remindersController.ts
│   │   ├── projectsController.ts
│   │   └── aiController.ts
│   │
│   ├── routes/
│   │   ├── index.ts          ← Mount all routers
│   │   ├── auth.ts
│   │   ├── notes.ts
│   │   ├── chat.ts
│   │   ├── tasks.ts
│   │   ├── vault.ts
│   │   ├── finance.ts
│   │   ├── reminders.ts
│   │   ├── projects.ts
│   │   ├── ai.ts
│   │   └── backup.ts
│   │
│   ├── services/
│   │   ├── aiService.ts      ← Sensitivity filter + AI calls
│   │   └── backupService.ts
│   │
│   └── server.ts             ← App entry point
│
├── .env
├── tsconfig.json
└── package.json
```

---

## 🚀 Server Entry Point

```ts
// src/server.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import { connectDB } from './config/db'
import routes from './routes'

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(mongoSanitize())

// Routes
app.use('/api', routes)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`))
})
```

---

## 🔐 Auth System

### JWT Flow
```
POST /auth/register  → hash password → save user → return JWT
POST /auth/login     → verify password → return JWT
All other routes     → middleware verifies JWT → attach userId
```

### User Model
```ts
// src/models/User.ts
import { Schema, model } from 'mongoose'

const userSchema = new Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  createdAt:    { type: Date, default: Date.now }
})

export const User = model('User', userSchema)
```

### Auth Controller
```ts
// src/controllers/authController.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'

export async function register(req, res) {
  try {
    const { email, password } = req.body
    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ error: 'Email in use' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ email, passwordHash })

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '30d' })
    res.status(201).json({ token })
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '30d' })
    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: 'Login failed' })
  }
}
```

### Auth Middleware
```ts
// src/middleware/auth.ts
import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

---

## 🗄️ MongoDB Schemas

> **Critical rule:** Backend stores only encrypted strings. It never validates or reads content fields.

### Notes
```ts
const noteSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:     { type: String, required: true },   // encrypted
  content:   { type: String, default: '' },       // encrypted
  tags:      [{ type: String }],                  // plain (for filtering)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})
noteSchema.index({ userId: 1, createdAt: -1 })
```

### Chat Threads
```ts
const messageSchema = new Schema({
  text:      { type: String, required: true },  // encrypted
  role:      { type: String, enum: ['user', 'ai'], default: 'user' },
  timestamp: { type: Date, default: Date.now }
})

const chatSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  threadName: { type: String, required: true },  // encrypted
  messages:   [messageSchema]
})
```

### Tasks
```ts
const taskSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },  // encrypted
  description: { type: String, default: '' },      // encrypted
  status:      { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  order:       { type: Number, default: 0 },       // for kanban ordering
  createdAt:   { type: Date, default: Date.now }
})
```

### Projects
```ts
const projectSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true },  // encrypted
  description: { type: String, default: '' },      // encrypted
  techStack:   [{ type: String }],                 // plain tags
  createdAt:   { type: Date, default: Date.now }
})
```

### Vault
```ts
const vaultSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  service:  { type: String, required: true },  // encrypted
  username: { type: String, default: '' },      // encrypted
  password: { type: String, required: true },  // encrypted
  notes:    { type: String, default: '' },      // encrypted
  createdAt:{ type: Date, default: Date.now }
})
```

### Finance
```ts
const financeSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, enum: ['income', 'expense'], required: true },
  amount:   { type: String, required: true },    // encrypted
  category: { type: String, required: true },    // encrypted
  note:     { type: String, default: '' },        // encrypted
  date:     { type: Date, default: Date.now }
})
financeSchema.index({ userId: 1, date: -1 })
```

### Reminders
```ts
const reminderSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true },  // encrypted
  time:     { type: String },                   // ISO string, plain
  active:   { type: Boolean, default: true },
  location: {
    lat:    Number,
    lng:    Number,
    radius: { type: Number, default: 200 }      // meters
  },
  createdAt: { type: Date, default: Date.now }
})
```

---

## 🔌 API Routes (Full)

```ts
// src/routes/index.ts
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import authRoutes from './auth'
import notesRoutes from './notes'
// ... import all

const router = Router()

router.use('/auth',      authRoutes)
router.use('/notes',     requireAuth, notesRoutes)
router.use('/chats',     requireAuth, chatRoutes)
router.use('/tasks',     requireAuth, tasksRoutes)
router.use('/projects',  requireAuth, projectsRoutes)
router.use('/vault',     requireAuth, vaultRoutes)
router.use('/finance',   requireAuth, financeRoutes)
router.use('/reminders', requireAuth, remindersRoutes)
router.use('/ai',        requireAuth, aiRoutes)
router.use('/backup',    requireAuth, backupRoutes)

export default router
```

### Generic CRUD Pattern
Every resource follows the same controller shape:

```ts
// Example: notesController.ts
import { Note } from '../models/Note'

export async function getNotes(req, res) {
  const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 })
  res.json(notes)
}

export async function createNote(req, res) {
  const note = await Note.create({ ...req.body, userId: req.userId })
  res.status(201).json(note)
}

export async function updateNote(req, res) {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },  // ← userId check prevents cross-user access
    { ...req.body, updatedAt: new Date() },
    { new: true }
  )
  if (!note) return res.status(404).json({ error: 'Not found' })
  res.json(note)
}

export async function deleteNote(req, res) {
  await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId })
  res.json({ success: true })
}
```

---

## 🤖 AI Integration

### Safety Filter (Core — never bypass)
```ts
// src/services/aiService.ts
const SENSITIVE_KEYWORDS = ['password', 'bank', 'upi', 'otp', 'pin', 'secret', 'credential', 'vault', 'cvv']
const BLOCKED_ROUTES = ['vault', 'finance']  // Never allow AI for these modules

export function isSensitive(text: string, module?: string): boolean {
  if (module && BLOCKED_ROUTES.includes(module)) return true
  return SENSITIVE_KEYWORDS.some(k => text.toLowerCase().includes(k))
}
```

### AI Service (OpenRouter — free Claude/Mistral access)
```ts
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!
})

export async function summarizeText(text: string): Promise<string> {
  if (isSensitive(text)) throw new Error('Content blocked: contains sensitive data')

  const response = await client.chat.completions.create({
    model: 'mistralai/mistral-7b-instruct:free',  // Free on OpenRouter
    messages: [
      { role: 'system', content: 'Summarize the following note briefly and clearly.' },
      { role: 'user', content: text }
    ],
    max_tokens: 300
  })

  return response.choices[0].message.content || ''
}

export async function semanticSearch(query: string, notes: string[]): Promise<string[]> {
  if (isSensitive(query)) return []
  // Basic: filter notes whose decrypted content matches query
  // Advanced: use embeddings (OpenRouter supports this too)
  return notes.filter(n => n.toLowerCase().includes(query.toLowerCase()))
}
```

### AI Controller
```ts
// src/controllers/aiController.ts
import { summarizeText } from '../services/aiService'

export async function summarize(req, res) {
  const { text, module } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided' })
  if (isSensitive(text, module)) return res.status(403).json({ error: 'Sensitive content blocked' })

  try {
    const summary = await summarizeText(text)
    res.json({ summary })
  } catch (err) {
    res.status(500).json({ error: 'AI service unavailable' })
  }
}
```

### Free AI Model Options (OpenRouter)

| Model | Cost | Good For |
|---|---|---|
| `mistralai/mistral-7b-instruct:free` | Free | Summarization, search |
| `google/gemma-3-12b-it:free` | Free | General chat, ideas |
| `meta-llama/llama-3.1-8b-instruct:free` | Free | Notes, project help |
| `anthropic/claude-3-haiku` | Very cheap | High quality when needed |

---

## ☁️ Backup System

```ts
// src/controllers/backupController.ts
import { Note } from '../models/Note'
// ... import all models

export async function createBackup(req, res) {
  const userId = req.userId

  const [notes, tasks, projects, reminders] = await Promise.all([
    Note.find({ userId }),
    Task.find({ userId }),
    Project.find({ userId }),
    Reminder.find({ userId })
    // Intentionally exclude vault/finance from auto-backup
    // User must explicitly include those
  ])

  const backup = {
    exportedAt: new Date().toISOString(),
    userId,
    data: { notes, tasks, projects, reminders }
    // All data is already encrypted — safe to export as-is
  }

  res.json(backup)
}

export async function restoreBackup(req, res) {
  const { data } = req.body
  const userId = req.userId

  // Delete existing + reinsert (atomic-ish)
  await Promise.all([
    Note.deleteMany({ userId }),
    Task.deleteMany({ userId }),
    // ...
  ])

  await Promise.all([
    Note.insertMany(data.notes.map(n => ({ ...n, userId }))),
    Task.insertMany(data.tasks.map(t => ({ ...t, userId }))),
    // ...
  ])

  res.json({ success: true })
}
```

---

## 🔒 Security Checklist

| Item | Implementation |
|---|---|
| Passwords | `bcryptjs` with cost factor 12 |
| JWT | 30-day expiry, signed with strong secret |
| NoSQL injection | `express-mongo-sanitize` |
| Rate limiting | 100 req/15min on auth, 200/15min on API |
| User isolation | Every query includes `userId: req.userId` |
| AI blocking | Sensitive keywords + module blocklist |
| CORS | Whitelist only client URL |
| Helmet | Sets secure HTTP headers |
| Env secrets | Never commit `.env`, validate on startup |

### Rate Limiter Setup
```ts
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, try again later' }
})

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
})
```

---

## 🌍 Environment Variables

```env
# .env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/digitalbrain
JWT_SECRET=use-a-64-char-random-string-here
CLIENT_URL=http://localhost:3000

# AI (OpenRouter — free tier available)
OPENROUTER_API_KEY=sk-or-...
```

---

## 📦 MongoDB Atlas Setup (Free Tier)

1. Go to https://cloud.mongodb.com → Create free M0 cluster
2. Create database user (username + password)
3. Whitelist IP: `0.0.0.0/0` (for dev) or your server IP
4. Copy connection string → paste in `.env` as `MONGODB_URI`
5. Recommended indexes:
   ```js
   db.notes.createIndex({ userId: 1, createdAt: -1 })
   db.tasks.createIndex({ userId: 1, status: 1 })
   db.finance.createIndex({ userId: 1, date: -1 })
   ```

---

## 🗺️ Build Phase Plan

| Phase | What to Build | Est. Time |
|---|---|---|
| 1 | Server setup, MongoDB connect, Auth (register/login), JWT middleware | Day 1–2 |
| 2 | Notes CRUD, Tasks CRUD, basic routes working | Day 3–4 |
| 3 | Chat, Projects, Reminders CRUD | Day 5–6 |
| 4 | Vault (with strict auth check), Finance | Day 7–8 |
| 5 | AI service with safety filter, `/ai/summarize` + `/ai/search` | Day 9–10 |
| 6 | Backup export/import, rate limiting, final security pass | Day 11–12 |

---

## 🧪 Testing Each Endpoint

Use [Bruno](https://www.usebruno.com/) (free, local Postman alternative):

```
1. POST /api/auth/register  → get token
2. POST /api/auth/login     → get token
3. Add token to header: Authorization: Bearer <token>
4. POST /api/notes          → { title: "encrypted...", content: "encrypted..." }
5. GET  /api/notes          → returns array
6. PUT  /api/notes/:id      → update
7. DELETE /api/notes/:id    → delete
8. POST /api/ai/summarize   → { text: "some note text" }
```

---

## ✅ Backend Checklist Per Module

- [ ] Model file exists in `/models`
- [ ] Controller has GET, POST, PUT/PATCH, DELETE
- [ ] Route is registered in `/routes/index.ts` with `requireAuth`
- [ ] Every query filters by `userId: req.userId`
- [ ] Error responses use consistent shape: `{ error: "message" }`
- [ ] No raw sensitive data logged to console
- [ ] AI endpoints check `isSensitive()` before calling external API
- [ ] Vault & Finance routes are explicitly excluded from AI processing
