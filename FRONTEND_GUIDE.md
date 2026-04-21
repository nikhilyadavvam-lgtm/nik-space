# 🧠 Digital Brain — Frontend Build Guide
> Stack: Use react-Native · jabascript · Tailwind CSS · Motion (Framer Motion v11) · Lucide Icons · Outfit Font

---

## 🎨 Design Philosophy

**Theme:** Refined monochrome — black, white, and intentional gray shades.
No color noise. Clarity through contrast. Motion adds life without distraction.

**Aesthetic Direction:**
- Editorial minimalism with surgical spacing
- Dark/Light mode as a first-class citizen (not an afterthought)
- Micro-interactions that feel native, not decorative
- Typography does the heavy lifting — Outfit Medium at every level

---

## 🔤 Typography System

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap');

:root {
  --font-primary: 'Outfit', sans-serif;
  --font-weight-body: 400;
  --font-weight-ui: 500;      /* Medium — your primary weight */
  --font-weight-heading: 600;
  --font-weight-light: 300;
}
```

**Scale (Tailwind custom):**

| Token       | Size     | Use                       |
|-------------|----------|---------------------------|
| `text-xs`   | 11px     | Labels, metadata          |
| `text-sm`   | 13px     | Secondary text, subtitles |
| `text-base` | 15px     | Body content              |
| `text-lg`   | 18px     | Card titles               |
| `text-2xl`  | 24px     | Section headings          |
| `text-4xl`  | 36px     | Page titles               |

---

## 🎨 Color System (CSS Variables)

```css
/* Light Mode */
:root {
  --bg-base:        #ffffff;
  --bg-subtle:      #f8f8f8;
  --bg-muted:       #f0f0f0;
  --border:         #e4e4e4;
  --border-strong:  #cccccc;
  --text-primary:   #0a0a0a;
  --text-secondary: #555555;
  --text-muted:     #999999;
  --accent:         #0a0a0a;     /* Black on light */
  --accent-fg:      #ffffff;
  --surface:        #ffffff;
  --surface-hover:  #f4f4f4;
  --shadow-sm:      0 1px 3px rgba(0,0,0,0.06);
  --shadow-md:      0 4px 16px rgba(0,0,0,0.08);
}

/* Dark Mode */
.dark {
  --bg-base:        #0a0a0a;
  --bg-subtle:      #111111;
  --bg-muted:       #1a1a1a;
  --border:         #222222;
  --border-strong:  #333333;
  --text-primary:   #f0f0f0;
  --text-secondary: #aaaaaa;
  --text-muted:     #666666;
  --accent:         #f0f0f0;     /* White on dark */
  --accent-fg:      #0a0a0a;
  --surface:        #141414;
  --surface-hover:  #1e1e1e;
  --shadow-sm:      0 1px 3px rgba(0,0,0,0.3);
  --shadow-md:      0 4px 16px rgba(0,0,0,0.4);
}
```

---

## 📦 Required Libraries

```bash
# Core
npx create-expo-app nikspace
npm install nativewind tailwindcss
npx tailwindcss init



# Motion & Animation
npm install motion                  # Motion for React (Framer Motion v11 API)

# Icons (Lucide — use sparingly, 20px default)
npm install lucide-react

# Theme
npm install next-themes             # Dark/light mode switcher

# Utilities
npm install clsx tailwind-merge     # Conditional classnames
npm install @radix-ui/react-dialog  # Accessible modals (free)
npm install @radix-ui/react-tooltip # Tooltips
npm install @radix-ui/react-switch  # Toggle switches
npm install @radix-ui/react-tabs    # Tab navigation

# Forms
npm install react-hook-form
npm install zod                     # Schema validation

# Charts (Finance module)
npm install recharts                # Free, composable

# Markdown Editor (Notes)
npm install @uiw/react-md-editor    # Free markdown editor

# HTTP
npm install axios
npm install @tanstack/react-query   # Data fetching + caching

# Drag & Drop (Kanban)
npm install @dnd-kit/core @dnd-kit/sortable
```

---

## 🏗️ Project Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.jsx
│   │   └── register/page.jsx
│   ├── (dashboard)/
│   │   ├── layout.jsx            ← Sidebar + top nav shell
│   │   ├── page.jsx              ← Home grid
│   │   ├── notes/page.jsx
│   │   ├── chat/page.jsx
│   │   ├── tasks/page.jsx
│   │   ├── projects/page.jsx
│   │   ├── vault/page.jsx
│   │   ├── finance/page.jsx
│   │   └── reminders/page.jsx
│   ├── layout.jsx                ← Root layout (fonts, theme provider)
│   └── globals.css
│
├── components/
│   ├── ui/                       ← Primitive building blocks
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Badge.jsx
│   │   ├── Modal.jsx
│   │   └── ThemeToggle.jsx
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── TopBar.jsx
│   │   └── MobileNav.jsx
│   ├── modules/
│   │   ├── notes/
│   │   ├── chat/
│   │   ├── kanban/
│   │   ├── vault/
│   │   ├── finance/
│   │   └── reminders/
│   └── shared/
│       ├── SearchBar.jsx
│       ├── EmptyState.jsx
│       └── LoadingSpinner.jsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useEncryption.ts
│   └── useTheme.ts
│
├── lib/
│   ├── api.ts                    ← Axios instance
│   ├── encryption.ts             ← AES-256 client logic
│   ├── queryClient.ts
│   └── utils.ts
│
├── store/
│   └── authStore.ts              ← Zustand (optional, lightweight)
│
└── types/
    └── index.ts
```

---

## 🌓 Dark/Light Mode Switcher

```jsx
// app/layout.jsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

```jsx
// components/ui/ThemeToggle.jsx
'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] 
                 hover:bg-[var(--surface-hover)] transition-colors duration-200"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {theme === 'dark'
            ? <Sun size={16} className="text-[var(--text-secondary)]" />
            : <Moon size={16} className="text-[var(--text-secondary)]" />
          }
        </motion.div>
      </AnimatePresence>
    </button>
  )
}
```

---

## 🏠 Home Grid (Module Dashboard)

```jsx
// app/(dashboard)/page.jsx
'use client'
import { motion } from 'motion/react'
import { FileText, MessageSquare, CheckSquare, FolderOpen,
         Lock, TrendingUp, Bell, Cpu } from 'lucide-react'

const modules = [
  { id: 'notes',     label: 'Notes',     icon: FileText,     href: '/notes'     },
  { id: 'chat',      label: 'Chat',      icon: MessageSquare,href: '/chat'      },
  { id: 'tasks',     label: 'Tasks',     icon: CheckSquare,  href: '/tasks'     },
  { id: 'projects',  label: 'Projects',  icon: FolderOpen,   href: '/projects'  },
  { id: 'vault',     label: 'Vault',     icon: Lock,         href: '/vault'     },
  { id: 'finance',   label: 'Finance',   icon: TrendingUp,   href: '/finance'   },
  { id: 'reminders', label: 'Reminders', icon: Bell,         href: '/reminders' },
  { id: 'ai',        label: 'AI',        icon: Cpu,          href: '/ai'        },
]

export default function HomePage() {
  return (
    <div className="p-6">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-medium text-[var(--text-primary)] mb-6"
      >
        Your Brain
      </motion.h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {modules.map((mod, i) => (
          <motion.a
            key={mod.id}
            href={mod.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group p-5 rounded-xl border border-[var(--border)]
                       bg-[var(--surface)] hover:bg-[var(--surface-hover)]
                       hover:border-[var(--border-strong)]
                       transition-colors duration-200 cursor-pointer"
          >
            <mod.icon
              size={20}
              className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)]
                         transition-colors duration-200 mb-3"
            />
            <p className="text-sm font-medium text-[var(--text-secondary)]
                          group-hover:text-[var(--text-primary)] transition-colors">
              {mod.label}
            </p>
          </motion.a>
        ))}
      </div>
    </div>
  )
}
```

---

## 📐 Layout Shell (Sidebar)

```jsx
// components/layout/Sidebar.jsx
'use client'
import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-56 h-screen border-r border-[var(--border)]
                 bg-[var(--bg-base)] flex flex-col py-5 px-3 fixed left-0 top-0"
    >
      {/* Logo */}
      <div className="px-2 mb-8">
        <span className="text-base font-medium text-[var(--text-primary)] tracking-tight">
          digital brain
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg
                         text-sm font-medium transition-all duration-150
                         ${active
                           ? 'bg-[var(--bg-muted)] text-[var(--text-primary)]'
                           : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                         }`}
            >
              <item.icon size={15} strokeWidth={1.8} />
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* Bottom: theme toggle + user */}
      <div className="flex items-center justify-between px-2">
        <ThemeToggle />
      </div>
    </motion.aside>
  )
}
```

---

## ✨ Animation Patterns

### Page Entry
```jsx
// Wrap every page in this
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.25, ease: 'easeOut' }}
>
  {/* page content */}
</motion.div>
```

### Staggered List
```jsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } }
}

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => (
    <motion.li key={i.id} variants={item}>...</motion.li>
  ))}
</motion.ul>
```

### Modal Entrance
```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.96, y: 8 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.96, y: 8 }}
  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
>
```

### Button Tap Feedback
```jsx
<motion.button whileTap={{ scale: 0.97 }}>...</motion.button>
```

---

## 🔐 Encryption on Client

```ts
// lib/encryption.ts
// Uses Web Crypto API — no extra library needed

export async function encrypt(text: string, masterKey: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(masterKey.padEnd(32, '0').slice(0, 32)),
    'AES-GCM', false, ['encrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    new TextEncoder().encode(text)
  )
  return btoa(JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  }))
}

export async function decrypt(ciphertext: string, masterKey: string): Promise<string> {
  const { iv, data } = JSON.parse(atob(ciphertext))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(masterKey.padEnd(32, '0').slice(0, 32)),
    'AES-GCM', false, ['decrypt']
  )
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    keyMaterial,
    new Uint8Array(data)
  )
  return new TextDecoder().decode(decrypted)
}
```

---

## 📡 API Layer

```ts
// lib/api.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' }
})

// Auto-attach JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
```

---

## 📦 Module: Notes

```
notes/
├── NotesList.jsx     ← Animated list, search filter
├── NoteEditor.jsx    ← Markdown editor (@uiw/react-md-editor)
├── NoteCard.jsx      ← Title + preview + date
└── useNotes.ts       ← React Query hooks (fetch, create, update, delete)
```

**Key behavior:**
- Encrypt `title` + `content` before POST/PUT
- Decrypt after GET
- Debounce autosave (500ms) on editor change

---

## 📋 Module: Kanban Tasks

```
kanban/
├── KanbanBoard.jsx   ← 3 columns with @dnd-kit
├── TaskCard.jsx      ← Draggable card with motion
├── AddTaskModal.jsx
└── useTasks.ts
```

**Columns:** `todo` · `in-progress` · `done`

**Drag animation:**
```jsx
import { DndContext, DragOverlay } from '@dnd-kit/core'
// On dragEnd → PUT /tasks/:id with new status
```

---

## 🔑 Module: Vault

```
vault/
├── VaultList.jsx     ← Blurred values, reveal on icon click
├── VaultItem.jsx     ← Eye icon toggle (Lucide Eye/EyeOff)
├── AddCredential.jsx
└── useVault.ts
```

**Security gate:**
- On route entry → show PIN / password re-confirm modal
- Never pass raw passwords to AI endpoints

---

## 📊 Module: Finance

```
finance/
├── FinanceDashboard.jsx  ← Summary cards + Recharts pie/bar
├── TransactionList.jsx
├── AddTransaction.jsx
└── useFinance.ts
```

**Chart example (Recharts):**
```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
// Custom tooltip styled with CSS vars
// No AI calls for finance data — strictly local + backend
```

---

## 🔔 Module: Reminders

```
reminders/
├── ReminderList.jsx      ← Toggle active/inactive
├── AddReminder.jsx       ← Time + optional lat/lng
├── LocationPicker.jsx    ← navigator.geolocation
└── useReminders.ts
```

---

## 🤖 AI Module (Controlled)

```
ai/
├── AIChat.jsx        ← Chat-style interface
├── AISummarize.jsx   ← Paste note → get summary
└── useAI.ts
```

```ts
// Always check before sending
function isSensitive(text: string): boolean {
  const keywords = ['password', 'bank', 'upi', 'otp', 'pin', 'secret']
  return keywords.some(k => text.toLowerCase().includes(k))
}

async function summarize(text: string) {
  if (isSensitive(text)) throw new Error('Sensitive content blocked from AI')
  return api.post('/ai/summarize', { text })
}
```

---

## 🚫 No-Crash Patterns

| Problem | Fix |
|---|---|
| Decryption failure | Wrap in try/catch, show "Content unavailable" |
| JWT expired | Axios interceptor handles auto-redirect |
| Empty states | Always render `<EmptyState>` component, never null |
| Missing env vars | Check on app start, throw readable error |
| Hydration mismatch | `suppressHydrationWarning` on `<html>`, lazy-load theme |
| Image missing | Add fallback src or skeleton |

---

## 🗺️ Build Phase Plan

| Phase | Modules | Priority |
|-------|---------|----------|
| 1 — MVP | Auth, Notes, Home Grid, Theme Toggle | Week 1–2 |
| 2 — Core | Chat, Tasks/Kanban, Layout polish | Week 3–4 |
| 3 — Sensitive | Vault (with gate), Finance + Charts | Week 5–6 |
| 4 — Smart | AI module, Reminders with location | Week 7–8 |
| 5 — Polish | Animations, Search, Backup UI | Week 9 |

---

## ✅ Checklist Before Each Module

- [ ] Encrypt data before sending to backend
- [ ] Decrypt data after receiving from backend
- [ ] Handle loading state (skeleton or spinner)
- [ ] Handle error state (graceful message)
- [ ] Handle empty state (friendly illustration or text)
- [ ] Motion entrance animation on mount
- [ ] Works in both dark + light mode
- [ ] Uses `font-medium` (Outfit 500) for all UI text
- [ ] Lucide icons at 16–20px, `strokeWidth={1.8}`
