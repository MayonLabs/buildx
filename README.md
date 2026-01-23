<div align="center">
  <img src="public/Botx_logo.svg" alt="Botx" height="60" />
  <h1>Botx</h1>
  <p>
    <strong>The Open Source, Self-Hosted AI Chatbot Builder.</strong>
  </p>
  <p>
    Build, manage, and embed AI chatbots powered by Google Gemini. No subscription fees, no data lock-in.
  </p>
  <p>
    <a href="./LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-green" alt="License: MIT">
    </a>
  </p>
</div>

> ⭐ If you find this project useful, please consider giving it a star!

## Table of Contents

- [Features](#-features)
- [Deploy](#-deploy)
- [Architecture](#-technical-architecture)
- [API Documentation](#-api-documentation)
- [Usage Examples](#-usage-examples)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

![Dashboard Preview](/public/dashboard.png)

## ✨ Features

- **🚀 Self-Hosted Foundation**: Next.js 16+, MongoDB, and NextAuth. You own the code and the data.
- **🧠 Gemini AI Powered**: Integrated with Google's state-of-the-art Gemini models (2.0 Flash, 1.5 Pro, 1.5 Flash).
- **🎨 Visual Bot Builder**: Customize system prompts, temperature, and themes (colors, welcome messages, icons).
- **📚 Knowledge Base (RAG)**: Upload PDF & Word documents. Automatic vector indexing with MongoDB Atlas Vector Search.
- **📝 Rich Text Support**: Full Markdown support for bold, italics, lists, and code blocks in chat.
- **📊 Real-Time Analytics**: Track bot usage, message count, and performance metrics.
- **💬 Multi-Turn Conversations**: Full conversation history with LangChain integration.
- **🔌 Embed Anywhere**: One-line `<script>` tag to add your bot to any website with domain validation.
- **🌍 Public Share Pages**: Standalone, fully-themed chat pages for every bot.
- **🛡️ Advanced Security**: Domain whitelisting, IP-based rate limiting, and admin authentication.
- **🚀 Serverless Ready**: Optimized for Vercel with Mongoose connection pooling.
## 🚀 Deploy (2 Minutes)

Botx uses a **"Fork & Deploy"** workflow. This ensures you fully own the code and can pull future updates (new features/bug fixes) with a single click.

### 1️⃣ Fork the Repository
Create your own copy of Botx in your GitHub account.

[![Fork on GitHub](https://img.shields.io/badge/Step%201-Fork%20Repository-181717?style=for-the-badge&logo=github)](https://github.com/kishore00777/botx/fork)

### 2️⃣ Deploy Your Fork
Copy the URL of your new fork (e.g., `https://github.com/yourname/botx`) and paste it into our setup wizard.

[![Deploy Wizard](https://img.shields.io/badge/Step%202-Launch%20Deploy%20Wizard-0070f3?style=for-the-badge&logo=vercel)](https://botx.kishorem.in/deploy.html)

---

### 🔑 Environment Variables
The wizard will ask for these values. Click the links to get them for free.

| Variable | Description | Where to get it |
| :--- | :--- | :--- |
| `ADMIN_EMAIL` | Your login email | You decide this. |
| `ADMIN_PASSWORD` | Your login password | You decide this. |
| `AUTH_SECRET` | Session encryption key | [Generate one here](https://generate-secret.vercel.app/32) or run `openssl rand -base64 32` |
| `MONGODB_URI` | Database connection | [Get free cluster from MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) |
| `GEMINI_API_KEY` | Google AI Model Key | [Get free key from Google AI Studio](https://aistudio.google.com/app/apikey) |

> 🔒 **Security Note:** The Deploy Wizard runs entirely in your browser. It simply formats the Vercel import link for you—we never see your keys.

---

## 🔄 How to Update
Since you deployed your own fork, updating is easy:
1.  Go to your repository on GitHub.
2.  Click **"Sync Fork"** (under the green Code button).
3.  Vercel will detect the change and automatically redeploy the latest version!


> **Getting Your API Keys:**
>
> - MongoDB URI: Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
> - Gemini API Key: Get it free from [Google AI Studio](https://aistudio.google.com/)


## 🔄 Updating Botx

Botx deployments do not auto-update from this repository.

After the initial deployment, any updates pushed to your fork will automatically trigger
a redeploy on Vercel.

To get the latest changes:
1. Pull updates from `kishorem/botx` into your fork
2. Push the changes to your GitHub repository



### 🛠 Technical Architecture

| Component         | Technology                  | Version       |
| ----------------- | --------------------------- | ------------- |
| **Framework**     | Next.js (App Router)        | 16.x        |
| **Database**      | MongoDB (Mongoose)          | 8.21.0        |
| **Auth**          | NextAuth.js                 | 5.0.0-beta.30 |
| **AI/LLM**        | Google Gemini API           | Latest        |
| **Vector Search** | MongoDB Atlas Vector Search | Native        |
| **UI Library**    | React                       | 19.2.3        |
| **Styling**       | Tailwind CSS                | 4             |
| **AI Framework**  | LangChain                   | 1.2.10        |

**Key Features**:

- Mongoose connection pooling for serverless (Vercel)
- Automated vector index creation on first bot deployment
- Enterprise-grade RAG with MongoDB Atlas Vector Search
- No subscription required for AI models (BYOK - Bring Your Own Key)

## 📚 API Documentation

### Chat Endpoint (Public)

```bash
# Send message to bot
POST /api/chat
Body: {
  botId: "publicId or _id",
  message: "User message",
  history: [{ role: "user", content: "..." }]
}
Response: { reply: "Bot response" }
```



## 💻 Usage Examples

### Embed Bot on Website

Add this single line to your website's HTML:

```html
<script 
  src="https://yourdomain.com/embed.js" 
  data-bot-id="YOUR_BOT_PUBLIC_ID"
></script>
```

The bot widget will appear at the bottom-right corner.



### Send Message to Bot

```javascript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    botId: "YOUR_BOT_PUBLIC_ID",
    message: "What are your business hours?",
    history: [],
  }),
});
const { reply } = await response.json();
console.log("Bot says:", reply);
```

## 🧩 Project Structure

```
src/
├── app/
│   ├── api/                 # API Routes
│   │   ├── bots/           # Bot management endpoints
│   │   ├── chat/           # Public chat endpoint
│   │   ├── auth/           # Authentication routes
│   │   └── admin/          # Admin utilities
│   ├── dashboard/          # Admin Dashboard Pages
│   ├── share/              # Public Bot Chat Pages
│   ├── login/              # Admin Login
│   └── globals.css         # Global styles
├── models/                 # Mongoose Schemas
│   ├── bot.model.ts        # Bot configuration
│   ├── knowledge-base.model.ts
│   └── knowledge-chunk.model.ts
├── lib/
│   ├── db.ts              # MongoDB connection with pooling
│   ├── gemini.ts          # Gemini API integration
│   ├── atlas.ts           # Vector search utilities
│   └── rate-limit.ts      # Rate limiting logic
├── components/            # React components
│   ├── message-renderer.tsx
│   └── dashboard/         # Dashboard UI components
├── auth.ts               # NextAuth configuration
└── middleware.ts         # Route protection

public/
├── embed.js             # Widget embedding script
└── favicon.ico
```

## 🔐 Security

✅ **Admin Authentication**: Environment-based credentials with JWT sessions
✅ **API Keys**: Gemini API key stored server-side, never exposed to client
✅ **Domain Whitelisting**: Control which domains can embed your bot
✅ **Rate Limiting**: IP-based rate limiting on chat endpoint (prevents abuse)
✅ **Bot Status Control**: Enable/disable bots without deletion
✅ **Serverless Safe**: Connection pooling prevents database exhaustion on Vercel

> **For Production**: Use strong passwords, enable MongoDB IP whitelisting, and enable HTTPS.

## 🐛 Troubleshooting

### "MONGODB_URI is not defined"

- Ensure `.env.local` exists in root directory
- Check the variable name is exactly `MONGODB_URI`
- Restart dev server after adding env variables

### "GEMINI_API_KEY is not defined"

- Get a free API key from [Google AI Studio](https://aistudio.google.com/)
- Add it to `.env.local` and restart the server
- Check you're using Gemini API, not Google Cloud API

### Bot chat returns 404

- Verify bot is marked as `isActive: true`
- Check bot `publicId` or `_id` matches the request
- If using domain whitelisting, verify your domain is in the list

### Vector search not working

- Index is created automatically on first bot creation
- For manual index setup: `POST /api/admin/setup-index`
- Verify MongoDB Atlas has vector search enabled (M0+ cluster)

### Rate limit errors (429)

- The API limits requests by IP address
- Wait a few minutes before retrying
- Use a reverse proxy or cache in production

## License

MIT © kishorem

---

**Have questions?** Open an [issue](https://github.com/kishorem/botx/issues) on GitHub!
