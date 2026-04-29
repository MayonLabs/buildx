<div align="center">
  <img src="public/Buildx_logo.svg" alt="Buildx" height="60" />
  <h1>Buildx</h1>
  <p>
    <strong>The Open Source, Self-Hosted AI Chatbot Builder.</strong>
  </p>
  <p>
    Build, manage, and embed AI chatbots powered by Google Gemini.<br/>
    No subscription fees. No data lock-in. You own everything.
  </p>
  <p>
    <a href="./LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-green" alt="License: MIT" />
    </a>
    <a href="https://github.com/MayonLabs/buildx">
      <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="Version" />
    </a>
    <img src="https://img.shields.io/badge/Next.js-16.x-black" alt="Next.js" />
    <img src="https://img.shields.io/badge/Gemini-2.5-orange" alt="Gemini 2.5" />
  </p>
</div>

> ⭐ If you find this project useful, please star it on GitHub!

---

## Table of Contents

- [Features](#-features)
- [Deploy](#-deploy-2-minutes)
- [Environment Variables](#-environment-variables)
- [Architecture](#-technical-architecture)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Embed Widget](#-embed-widget)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

| | Feature | Details |
|---|---|---|
| 🚀 | **Self-Hosted** | Full Next.js 16 App Router stack. You own the code and all data. |
| 🧠 | **Gemini 2.5 Powered** | Supports `gemini-2.5-flash`, `gemini-2.5-pro`, and `gemini-2.5-flash-lite`. |
| 🎨 | **Visual Bot Builder** | Pixel-level control over every part of the chat widget — colors, fonts, icons, layout, welcome messages, and widget position. |
| 📚 | **Knowledge Base (RAG)** | Upload **PDF** and **Word** documents. Automatic chunking, embedding, and vector indexing. |
| 🔍 | **Qdrant Vector Search** | RAG powered by **Qdrant** — self-hosted or Qdrant Cloud. Configure the URL and collection name in the dashboard. |
| 📝 | **Rich Text Responses** | Full Markdown rendering — bold, italics, tables, lists, and code blocks. |
| 🔌 | **Embed Anywhere** | Single `<script>` tag embeds the widget on any website. Domain whitelisting included. |
| 🌍 | **Public Share Pages** | Every bot gets a standalone, fully-themed shareable chat URL. |
| 🛡️ | **Security First** | Encrypted API key storage, domain whitelisting, IP-based rate limiting, and JWT sessions. |
| 🩺 | **System Health Check** | Live `/api/health` endpoint monitors database and Gemini configuration status. |
| ⚡ | **Serverless Ready** | Mongoose connection pooling optimized for Vercel and edge deployments. |

---

## 🚀 Deploy (2 Minutes)

Buildx uses a **"Fork & Deploy"** workflow so you fully own the code and can pull future updates with one click.

### 1️⃣ Fork the Repository

[![Fork on GitHub](https://img.shields.io/badge/Step%201-Fork%20Repository-181717?style=for-the-badge&logo=github)](https://github.com/MayonLabs/buildx/fork)

### 2️⃣ Deploy to Vercel

Copy your fork URL and paste it into the deploy wizard:

[![Deploy Wizard](https://img.shields.io/badge/Step%202-Launch%20Deploy%20Wizard-0070f3?style=for-the-badge&logo=vercel)](https://buildx.mayonlabs.in/deploy.html)

### 3️⃣ First Login → Configure Gemini

After deploy, go to **Dashboard → Settings → Gemini API Key** and paste your key. It is stored encrypted in your database — no env variable needed.

---

## 🔑 Environment Variables

| Variable | Required | Description | How to get it |
| :--- | :---: | :--- | :--- |
| `ADMIN_EMAIL` | ✅ | Admin dashboard login email | You decide |
| `ADMIN_PASSWORD` | ✅ | Admin dashboard login password | You decide |
| `AUTH_SECRET` | ✅ | JWT session encryption key | `openssl rand -base64 32` or [generate here](https://generate-secret.vercel.app/32) |
| `MONGODB_URI` | ✅ | MongoDB connection string | [MongoDB Atlas free tier](https://www.mongodb.com/cloud/atlas/register) |
| `ENCRYPTION_KEY` | ⚠️ | AES key for encrypting stored API keys | `openssl rand -hex 32` |

> ⚠️ `ENCRYPTION_KEY` is strongly recommended for production. Without it, API keys (Gemini, Qdrant) are stored in plaintext in the database.

> 🔒 **Security Note:** The Deploy Wizard runs entirely in your browser — we never see your credentials.

### MongoDB URI format

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/buildx?retryWrites=true&w=majority
```

> Replace `<password>` with your actual password — do **not** keep the `< >` brackets.

---

## 🔄 Updating Buildx

1. Go to your forked repository on GitHub.
2. Click **"Sync Fork"** (below the green Code button).
3. Vercel detects the push and automatically redeploys.

---

## 🛠 Technical Architecture

| Component | Technology | Version |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 16.1.4 |
| **Database** | MongoDB (Mongoose) | 8.21.0 |
| **Auth** | NextAuth.js | 5.0.0-beta.30 |
| **AI / LLM** | Google Gemini API | 2.5 (flash / pro / flash-lite) |
| **AI SDK** | Google Generative AI SDK | 0.24.1 |
| **Vector DB** | Qdrant | Self-hosted or Cloud |
| **UI Library** | React | 19.2.3 |
| **Styling** | Tailwind CSS | 4 |
| **Document Parsing** | pdf-parse, mammoth (Word) | Latest |

---

## 🧩 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/              # NextAuth handlers
│   │   ├── bots/[id]/
│   │   │   ├── knowledge/     # Upload / delete knowledge docs
│   │   │   ├── vector-test/   # Test vector search for a bot
│   │   │   └── route.ts       # CRUD for individual bot
│   │   ├── chat/              # Public chat endpoint (RAG pipeline)
│   │   ├── health/            # System health check
│   │   └── settings/          # Global settings (Gemini key, vector DB)
│   ├── dashboard/
│   │   ├── bots/[id]/         # Edit bot
│   │   ├── bots/new/          # Create bot
│   │   ├── docs/              # Knowledge base manager
│   │   ├── api-keys/          # API key management
│   │   └── settings/          # App settings
│   ├── login/                 # Admin login
│   ├── setup/                 # First-run setup wizard
│   └── share/[botId]/         # Public shareable chat page
│
├── components/
│   └── dashboard/
│       ├── bot-editor/
│       │   ├── design-tab.tsx  # Full visual theme editor
│       │   └── security-tab.tsx# Domain whitelist & bot toggle
│       ├── sidebar.tsx
│       └── system-health.tsx   # Health status widget
│
├── lib/
│   ├── db.ts                  # MongoDB connection pooling
│   ├── encrypt.ts             # AES encryption helpers
│   ├── gemini.ts              # Gemini API integration
│   ├── rate-limit.ts          # IP-based rate limiting
│   └── vector/
│       ├── index.ts           # Vector provider factory
│       ├── settings-cache.ts  # Cached global settings
│       ├── types.ts           # Shared vector interfaces
│       └── providers/
│           └── qdrant.ts
│
├── models/
│   ├── bot.model.ts           # Bot schema (theme, AI config, domains)
│   ├── knowledge-base.model.ts
│   ├── knowledge-chunk.model.ts
│   ├── rate-limit.model.ts
│   └── settings.model.ts      # Global app settings (API keys, vector config)
│
├── auth.ts                    # NextAuth configuration
└── middleware.ts              # Route protection

public/
├── embed.js                   # Widget embedding script
└── Buildx_logo.svg
```

---

## 📚 API Reference

### `POST /api/chat` — Send a message

```bash
curl -X POST https://yourdomain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "YOUR_BOT_PUBLIC_ID",
    "message": "What are your business hours?",
    "history": []
  }'
```

**Response:**
```json
{ "message": "We are open Monday to Friday, 9am – 6pm.", "model": "gemini-2.5-flash" }
```

**Body parameters:**

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `botId` | string | ✅ | Bot's `publicId` or MongoDB `_id` |
| `message` | string | ✅ | The user's message |
| `history` | array | — | Prior turns to pass as context (client-managed) |

**History format:**
```json
"history": [
  { "role": "user",  "content": "Hello" },
  { "role": "model", "content": "Hi! How can I help you?" }
]
```

> **Note:** Conversation history is stateless — the server does not persist sessions. Pass previous turns in `history` on each request if you need context carry-over.

---

### `GET /api/health` — System status

```bash
curl https://yourdomain.com/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "services": {
    "database": { "status": "connected", "latency": "12ms" },
    "gemini":   { "status": "configured" }
  }
}
```

---

## 🔌 Embed Widget

Add this single line to any HTML page:

```html
<script
  src="https://yourdomain.com/embed.js"
  data-bot-id="YOUR_BOT_PUBLIC_ID"
></script>
```

The chat widget appears at the bottom-right corner (or whichever position you configured in the bot editor). Domain whitelisting in the bot's Security tab controls which sites may load it.

---

## 🎨 Visual Bot Builder

Every part of the widget is customizable from the **Design** tab:

| Element | What you can change |
| :--- | :--- |
| Launcher button | Background color, icon, border radius |
| Header | Background, text color, title, font, custom icon |
| Chat window | Background color, footer color, background image |
| User messages | Bubble color, text color, avatar, font, border radius |
| Bot messages | Bubble color, text color, avatar, font, border radius |
| Input area | Background, text color, placeholder color, font |
| Send button | Background color, icon color |
| Welcome message | Text and style (color, size, font, weight) |
| Widget position | Bottom-right / bottom-left / top-right / top-left |

---

## 🔍 Vector Database Setup

Buildx uses **Qdrant** for vector search. You can run it locally with Docker or use [Qdrant Cloud](https://cloud.qdrant.io/) for a managed instance.

Configure the connection in **Dashboard → Settings → Vector Database**:

| Setting | Description |
| :--- | :--- |
| **URL** | Qdrant host URL (e.g. `http://localhost:6333` or your cloud endpoint) |
| **Collection Name** | Name of the Qdrant collection Buildx will use |
| **API Key** | Required for Qdrant Cloud; leave blank for local instances |

**Quick local setup with Docker:**
```bash
docker run -p 6333:6333 qdrant/qdrant
```

---

## 🔐 Security

| | Feature | Details |
|---|---|---|
| ✅ | **Encrypted key storage** | Gemini and Qdrant API keys are AES-encrypted at rest using `ENCRYPTION_KEY` |
| ✅ | **JWT sessions** | Admin sessions are signed with `AUTH_SECRET` |
| ✅ | **Domain whitelisting** | Per-bot allowed domain list blocks unauthorized embed sites |
| ✅ | **IP rate limiting** | Chat endpoint is rate-limited by IP to prevent abuse |
| ✅ | **Bot toggle** | Disable a bot instantly without deleting it |
| ✅ | **Server-side keys** | API keys are never exposed to the browser |

> **Production checklist:** strong `ADMIN_PASSWORD`, set `ENCRYPTION_KEY`, enable MongoDB Atlas IP Access List, enforce HTTPS.

---

## 🐛 Troubleshooting

### "MONGODB_URI is not defined"
- Ensure `.env.local` exists in the project root.
- Check the variable name is exactly `MONGODB_URI`.
- Restart the dev server after adding env variables.

### "Gemini API key not configured"
- Go to **Dashboard → Settings → Gemini API Key**.
- Paste your key from [Google AI Studio](https://aistudio.google.com/) and click **Save**.
- The key is stored encrypted in your database — no env variable needed.

### "MongoServerError: bad auth"
- Remove the `< >` from the password in your URI:
  - ❌ `mongodb+srv://admin:<mypassword>@...`
  - ✅ `mongodb+srv://admin:mypassword@...`
- In Atlas → **Network Access**, add your deployment IP (or allow all IPs for testing).

### Bot chat returns 404
- Verify the bot has `isActive: true` in the dashboard.
- Check the `publicId` used in the request matches the bot.
- If domain whitelisting is on, verify your domain is in the allowed list.

### Vector search returns no results
- Confirm the Qdrant URL, collection name, and API key are saved in **Settings → Vector Database**.
- Use the **Vector Test** button in the bot's knowledge page to diagnose the connection.
- For local Qdrant: ensure the Docker container is running and the port is accessible.

### Rate limit errors (429)
- The API enforces per-IP limits on the chat endpoint.
- Wait a few minutes before retrying.
- For high-traffic production use, configure a reverse proxy or increase the limit in `src/lib/rate-limit.ts`.

---

## 📄 License

MIT © [Mayon Labs](https://github.com/MayonLabs)

---

**Have questions or found a bug?** Open an [issue](https://github.com/MayonLabs/buildx/issues) on GitHub.
