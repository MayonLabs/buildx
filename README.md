# 🤖 Botx

**The Open Source, Self-Hosted AI Chatbot Builder.**

Build, manage, and embed AI chatbots powered by Google Gemini. No subscription fees, no data lock-in.

![Dashboard Preview](https://github.com/user-attachments/assets/placeholder-dashboard.png)

## ✨ Features

- **🚀 Self-Hosted Foundation**: Next.js 14+, MongoDB, and NextAuth. You own the code and the data.
- **🧠 Gemini AI Powered**: integrated with Google's state-of-the-art Gemini models (1.5 Flash, 1.5 Pro, 2.0 Flash).
- **🎨 Visual Bot Builder**: Customize system prompts, temperature, and themes (colors, welcome messages).
- **📝 Rich Text Support**: Full Markdown support for bold, italics, lists, and code blocks in chat.
- **📊 Dynamic Dashboard**: Real-time analytics for your bots and knowledge base.
- **💬 Universal Chat Engine**: Multi-turn conversation support with LangChain.
- **🔌 Embed Anywhere**: One-line `<script>` tag to add your bot to any website.
- **🌍 Public Share Pages**: Standalone, themed chat pages for every bot.
- **🔐 Secure**: Environment-based admin authentication.

## 🚀 One-Click Deploy

Deploy directly to Vercel with a single click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fbot-cms&env=ADMIN_EMAIL,ADMIN_PASSWORD,AUTH_SECRET,MONGODB_URI,GEMINI_API_KEY)

### 🛠 Technical Architecture

- **Framework**: Next.js 14+ (App Router)
- **Database**: MongoDB (Mongoose) - *Optimized for serverless: Implements Mongoose connection caching to prevent connection pool exhaustion on Vercel.*
- **Auth**: NextAuth.js (Credentials)
- **AI**: Google Gemini Pro & Flash
- **Vector Search (RAG)**:
  - **Implementation**: MongoDB Atlas Vector Search.
  - **Setup**: **Automated** (Index created automatically on first bot creation).
  - **Scale**: Enterprise-grade (serverless).

## 🛠️ Local Development

### Prerequisites

- Node.js 18+
- MongoDB Database (local or Atlas)
- Google Gemini API Key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/bot-cms.git
   cd bot-cms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   
   Set the following **Environment Variables** in your hosting dashboard (e.g., Vercel Project Settings) or in a `.env` file for local development:
   
   | Variable | Description |
   |----------|-------------|
   | `ADMIN_EMAIL` | Email for admin login (e.g., `admin@example.com`) |
   | `ADMIN_PASSWORD` | Password for admin login |
   | `AUTH_SECRET` | Random string for session encryption (`openssl rand -base64 32`) |
   | `MONGODB_URI` | Your MongoDB connection string |
   | `GEMINI_API_KEY` | Your Google API Key from [AI Studio](https://aistudio.google.com/) |

4. **Run Development Server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` to see your app.

## 🧩 Project Structure

```
src/
├── app/
│   ├── api/            # API Routes (Bots, Chat, Auth)
│   ├── dashboard/      # Admin Dashboard Pages
│   ├── share/          # Public Chat Pages
│   └── login/          # Login Page
├── models/             # Mongoose Schemas
├── lib/                # Database & Utils
└── components/         # UI Components
public/
└── embed.js            # Widget Embedding Script
```

## 🔒 Security Note

- **Admin Access**: This CMS uses simple environment-based authentication for a single admin user. It is designed for personal or internal team use.
- **API Keys**: Your Gemini API key is stored securely on the server and never exposed to the client. Public chat requests are proxied through `/api/chat`.

## 📄 License

MIT © Kishore M
