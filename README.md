# 🎯 AI Resume Analyzer & ATS Optimizer

An intelligent, full-stack web application that analyzes resumes against job descriptions using **Google Gemini AI**, provides ATS compatibility scores, highlights missing keywords, and generates a downloadable ATS-optimized PDF resume.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Resume Parsing** | Supports PDF, DOCX, and TXT formats |
| 🤖 **AI Analysis** | Gemini AI scores your resume against the job description |
| 🔍 **Keyword Gap Detection** | Identifies missing ATS keywords |
| ✏️ **AI Resume Rewriting** | Rewrites your experience section with stronger language and integrated keywords |
| 📥 **PDF Download** | Generates a clean, ATS-friendly PDF of your optimized resume |
| 👤 **Guest Mode** | Try without signing up (2 analyses + 1 PDF download) |
| 🔐 **Auth System** | JWT-based login/register for unlimited use |
| 📊 **Dashboard** | View past analyses if logged in |

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **AI:** Google Gemini API (`@google/generative-ai`)
- **Database:** PostgreSQL + Sequelize ORM
- **PDF Generation:** PDFKit
- **Resume Parsing:** pdf-parse, mammoth
- **Auth:** JWT + bcryptjs
- **Templating:** Nunjucks
- **Frontend:** Vanilla HTML, CSS, JavaScript

---

## 🚀 Local Setup

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [PostgreSQL](https://www.postgresql.org/) installed and running
- A **Google Gemini API key** → [Get one here](https://aistudio.google.com/app/apikey)

---

### 2. Clone the Repository

```bash
git clone https://github.com/PrajanyaSahu/Ai-Resume.git
cd Ai-Resume
```

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Create the Database

Open **pgAdmin** or **psql** and run:

```sql
CREATE DATABASE resume_ats;
```

---

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/resume_ats

# JWT secret (any long random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Server port
PORT=8000
NODE_ENV=development
```

> **Tip:** Generate a secure JWT secret with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

### 6. Start the Server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The app will be available at **http://localhost:8000**

> On first run, Sequelize auto-creates all database tables — no manual migrations needed.

---

## 📁 Project Structure

```
AI-Resume-Analyzer-master/
├── server.js                   # App entry point
├── package.json
├── .env                        # Environment variables (not committed)
│
├── backend/
│   ├── core/
│   │   ├── config.js           # App configuration & limits
│   │   ├── database.js         # Sequelize DB connection
│   │   ├── security.js         # JWT auth middleware
│   │   └── guestLimiter.js     # IP-based guest usage tracking
│   │
│   ├── models/
│   │   ├── user.js
│   │   ├── resume.js
│   │   ├── analysis.js
│   │   ├── optimized_resume.js
│   │   └── usage_limit.js
│   │
│   ├── routers/
│   │   ├── auth.js             # /api/auth — login, register
│   │   ├── analysis.js         # /api/analysis — upload & analyze
│   │   └── optimizer.js        # /api/optimizer — rewrite & PDF download
│   │
│   └── services/
│       ├── Aiservice.js        # Gemini AI integration
│       ├── resumeParser.js     # PDF/DOCX/TXT parsing
│       └── pdfGenerator.js     # ATS PDF generation (PDFKit)
│
└── frontend/
    ├── templates/              # Nunjucks HTML pages
    │   ├── index.html
    │   ├── upload.html
    │   ├── results.html
    │   ├── dashboard.html
    │   ├── login.html
    │   └── register.html
    └── static/
        ├── css/
        └── js/
            ├── app.js          # Main frontend logic
            └── common.js
```

---

## 🧪 Usage

1. Go to **http://localhost:8000**
2. Click **"Analyze Resume"**
3. Upload your resume (PDF / DOCX / TXT)
4. Paste the job description and job title
5. View your **ATS Match Score**, keyword gaps, and strengths
6. Click **"Optimize Resume"** to let AI rewrite your experience
7. Click **"Download PDF"** to get your ATS-ready resume

---

## ⚠️ Guest Limits

Guest users (not logged in) get:
- **2 free resume analyses** per day (tracked by IP)
- **1 free PDF download** per day

Create a free account to unlock unlimited access.

---

## 🌐 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini AI API key |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | Secret for signing JWT tokens |
| `PORT` | No | Server port (default: `8000`) |
| `NODE_ENV` | No | `development` or `production` |

---

## 📄 License

MIT License — free to use and modify.

---

## 🙋 Author

**Prajanya Sahu** — [GitHub](https://github.com/PrajanyaSahu/Ai-Resume)
