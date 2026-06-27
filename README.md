# note_ai

AI-powered note summarization, quiz generation, and more.

> **Current version:** v2.0 — Full PRD implementation based on v1 codebase audit.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Auth | Supabase (email/password) |
| AI — Summarize | Groq `llama-3.1-8b-instant` (streamed) / Gemini 2.0 Flash fallback |
| AI — Quiz | Groq JSON mode / Gemini 2.0 Flash Lite fallback |
| AI — Chat | Groq streamed / Gemini 2.0 Flash fallback |
| AI — OCR | Gemini 2.0 Flash Vision (replaces Tesseract.js) |
| TTS | OpenAI TTS-1 / ElevenLabs fallback |
| Database | Neon Postgres (serverless, via `@neondatabase/serverless`) |
| PDF Export | `@react-pdf/renderer` (client-side) |
| Rich Editor | TipTap (ProseMirror-based) |
| PDF extraction | pdfjs-dist (client-side, 15 MB cap) |
| Animation | Framer Motion 12 |
| Icons | lucide-react |
| Deployment | Vercel (serverless API routes) |

---

## v2.0 Changes

### 1. Chat Context Memory

**New files:**
- `api/chat.js` — SSE-streamed chat API with Neon Postgres persistence
- `src/components/ChatPanel.jsx` — Scrollable follow-up Q&A below summaries

**Modified files:**
- `src/components/SummaryResult.jsx` — Integrates ChatPanel below summary

**Schema (Neon Postgres):**
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  note_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  note_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, note_id)
);
```

**Env variable:** `DATABASE_URL` — Neon pooled connection string

---

### 2. Faster Onboarding

**New files:**
- `src/components/Onboarding.jsx` — 5-step guided overlay: Welcome → Pick Template → Ready → Summary → Done

**Modified files:**
- `src/context/AuthContext.jsx` — Added `isNewUser` flag on `SIGNED_UP` event
- `src/App.jsx` — Shows onboarding on sign-up, stores `onboarding_complete` in Supabase `user_metadata`

---

### 3. Better Image Processing (Gemini Vision OCR)

**New files:**
- `api/ocr.js` — Server-side Gemini 2.0 Flash Vision extraction (supports PNG, JPG, WEBP, BMP, HEIC)

**Modified files:**
- `src/lib/ocr.js` — Replaced Tesseract.js `recognize()` with `fetch('/api/ocr')`
- `src/components/NoteInput.jsx` — Added HEIC acceptance, confidence badge
- `package.json` — Removed `tesseract.js` (~4.2 MB WASM bundle saving)

**Env variable:** `GEMINI_API_KEY` (reused from v1)

---

### 4. Notion-like Editor

**New files:**
- `src/components/RichEditor.jsx` — TipTap editor with inline toolbar (Bold, Italic, Code, H1/H2/H3, Bullet/Ordered lists, Blockquote)

**Modified files:**
- `src/components/NoteInput.jsx` — Simple/Rich mode toggle persisted to localStorage

---

### 5. Summary PDF Export

**New files:**
- `src/components/SummaryPdf.jsx` — `@react-pdf/renderer` document with markdown parsing

**Modified files:**
- `src/components/SummaryResult.jsx` — Download button now generates `[Title]_Summary_[Date].pdf`

---

### 6. Summary Podcast Button (TTS)

**New files:**
- `api/tts.js` — OpenAI TTS (primary) + ElevenLabs (fallback), returns MP3 stream

**Modified files:**
- `src/components/SummaryResult.jsx` — Headphones button + inline audio player with play/pause, seek, speed control, MP3 download

**Env variables:**
- `OPENAI_API_KEY` (primary)
- `ELEVENLABS_API_KEY` (optional fallback)

---

## Getting Started

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env` file (or set in Vercel dashboard):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
DATABASE_URL=your_neon_connection_string
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key    # optional
```

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

---

## Dependencies (v2.0 additions)

| Package | Feature | Server/Client |
|---------|---------|--------------|
| `@neondatabase/serverless` | Chat memory | Server only |
| `@tiptap/react` | Rich editor | Client (~120 KB, lazy) |
| `@tiptap/starter-kit` | Rich editor | Client |
| `@tiptap/extension-placeholder` | Rich editor | Client |
| `@react-pdf/renderer` | PDF export | Client (~180 KB, lazy) |
| `sharp` | HEIC conversion | Server only |

### Removed

| Package | Reason |
|---------|--------|
| `tesseract.js` | Replaced by Gemini Vision server route (~4.2 MB saving) |

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/summarize` | POST | SSE-streamed note summarization |
| `/api/quiz` | POST | JSON quiz generation |
| `/api/chat` | POST | SSE-streamed follow-up chat |
| `/api/ocr` | POST | Image text extraction (Gemini Vision) |
| `/api/tts` | POST | Text-to-speech MP3 stream |

---

## Project Structure

```
note_ai/
├── api/                    # Vercel serverless routes
│   ├── chat.js
│   ├── ocr.js
│   ├── quiz.js
│   ├── summarize.js
│   └── tts.js
├── src/
│   ├── components/
│   │   ├── Auth.jsx
│   │   ├── ChatPanel.jsx
│   │   ├── Features.jsx
│   │   ├── Header.jsx
│   │   ├── HowItWorks.jsx
│   │   ├── NoteInput.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Quiz.jsx
│   │   ├── RichEditor.jsx
│   │   ├── Skeleton.jsx
│   │   ├── SummaryPdf.jsx
│   │   └── SummaryResult.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   ├── ai.js
│   │   ├── ocr.js
│   │   ├── pdf.js
│   │   └── supabase.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── package.json
├── vite.config.js
└── README.md
```
