# 🎯 InterviewGym - AI-Powered Interview Coach

![Status](https://img.shields.io/badge/status-active-success)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> **Practice your interview skills with an AI interviewer that mimics real recruiters.** Get instant feedback on your resume and interview performance with detailed analytics.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Environment Setup](#-environment-setup)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Known Limitations](#-known-limitations)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)

---

## ✨ Features

### 🎤 **Interactive AI Interviews**
- Real-time voice-based interviews with AI recruiter "Alex"
- Dynamic conversation flow that adapts to candidate responses
- Fallback questions to maintain conversation when errors occur
- Smart icebreakers for interview start

### 📊 **Resume Analysis**
- Automated resume scoring against job description
- Identifies missing keywords from job posting
- Tailored feedback on resume-to-job fit
- Resume text extraction and semantic understanding

### 🎯 **Performance Feedback**
- Detailed interview performance report (0-10 score)
- Strengths identification
- Areas for improvement suggestions
- Session history and progress tracking

### 🔐 **Secure Authentication**
- Clerk-based authentication (no passwords to manage)
- Protected routes and user isolation
- Automatic session management

### 🎨 **Beautiful Modern UI**
- Dark theme with gradient backgrounds
- Real-time UI state management
- Loading states and error boundaries
- Responsive design

---

## 🏗️ Tech Stack

### **Frontend**
| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | React framework with SSR support |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first styling |
| **Clerk** | Authentication & user management |
| **Lucide React** | Modern icon library |
| **Web Speech API** | Browser-native speech recognition |

### **Backend**
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | Async Python web framework |
| **Prisma ORM** | Type-safe database access |
| **PostgreSQL** | Relational database |
| **LangChain** | LLM orchestration framework |
| **ChromaDB** | Vector database (embeddings) |
| **Hugging Face** | Pre-trained ML models |
| **Groq API** | Fast LLM inference |
| **Edge TTS** | Text-to-speech conversion |
| **Boto3 + MinIO** | S3-compatible file storage |

### **Infrastructure**
| Tool | Purpose |
|------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Prisma Migrations** | Database versioning |
| **MinIO** | S3-compatible object storage (local dev) |

---

## 🎨 Architecture

### **System Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Home Page   │  │Interview Page│  │  Dashboard   │       │
│  │ (Setup form) │  │   (Chat)     │  │  (Reports)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                 │                │
│         │    HTTP/JSON    │                 │                │
│         └─────────────────┴─────────────────┘                │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   FastAPI      │
                    │   Backend      │
                    └───────┬────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
     ┌────▼───┐        ┌────▼────┐      ┌───▼──────┐
     │ Prisma │        │RAGService│      │InterviewCoach│
     │   ORM  │        │(LangChain)      │(AI Logic)    │
     └────┬───┘        └────┬────┘      └───┬──────┘
          │                 │                │
    ┌─────▼──────┐   ┌──────▼──────┐   ┌───▼──────┐
    │ PostgreSQL │   │   ChromaDB   │   │Groq API  │
    │ Database   │   │(Vector DB)   │   │(LLM)     │
    └────────────┘   └──────────────┘   └──────────┘
```

### **Data Flow**

```
1. USER UPLOADS RESUME
   User Form → Frontend → FastAPI (/create_session)
   ↓
2. BACKEND PROCESSES
   a) Extract resume text (PyPDF)
   b) Split into chunks (LangChain)
   c) Create embeddings (Hugging Face)
   d) Store in vector DB (ChromaDB)
   e) Create database session (Prisma → PostgreSQL)
   ↓
3. INTERVIEW STARTS
   User speaks → Web Speech API → /chat endpoint
   ↓
4. AI PROCESSES
   a) Search relevant resume chunks (ChromaDB)
   b) Generate response with Groq LLM
   c) Convert response to audio (Edge TTS)
   d) Send back to frontend
   ↓
5. INTERVIEW ENDS
   User finishes → /end_session endpoint
   ↓
6. ANALYSIS
   a) Generate interview feedback (Groq LLM)
   b) Score resume match (Groq LLM)
   c) Store results (Prisma → PostgreSQL)
    d) Display in dashboard
```

### **Smart Infrastructure Choice: S3 with MinIO**

This project uses **Boto3** (AWS SDK) with **MinIO** as the S3-compatible storage backend. Here's why this is a smart architectural decision:

**Benefits:**
- 🎯 **Drop-in AWS S3 Compatibility** - Uses standard S3 API via Boto3, so switching to AWS is just changing environment variables
- 💰 **Cost-Efficient Development** - MinIO runs locally/in Docker, no AWS charges during development
- 🚀 **Production-Ready** - Already using industry-standard AWS SDK, scales seamlessly to real S3
- 📁 **File Persistence** - Actual file storage (not mocked), tests real S3 operations locally
- 🔄 **Zero Migration Risk** - Code unchanged when deploying to AWS production

**Environment Variables:**
```bash
# Local Development (MinIO)
AWS_ENDPOINT_URL="http://localhost:9000"
AWS_BUCKET_NAME="resumes"

# Production (AWS S3) - Just change the endpoint URL
AWS_ENDPOINT_URL="https://s3.amazonaws.com"
```

---## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.9+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### **1. Clone Repository**

```bash
git clone https://github.com/yourusername/interview-gym.git
cd interview-gym
```

### **2. Setup Environment Variables**

**Backend (`.env` in `/backend`)**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/recruiter_db?schema=public"

# AI/LLM
GROQ_API_KEY="gsk_your_key_here"

# AWS S3 (optional, currently mocked)
AWS_ENDPOINT_URL="http://localhost:9000"
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="minioadmin"
AWS_BUCKET_NAME="resumes"
AWS_REGION="us-east-1"
```

**Frontend (`.env.local` in `/frontend`)**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

### **3. Start Database**

```bash
# Using Docker Compose
docker-compose up -d db

# Or use existing PostgreSQL
psql -h localhost -U user -d recruiter_db
```

### **4. Setup Backend**

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup Prisma
prisma generate

# Run migrations
prisma migrate dev --name init

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### **5. Setup Frontend**

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit **http://localhost:3000** in your browser! 🎉

---

## 📚 Environment Setup

### **Development** (Local)

```bash
# Terminal 1: Database
docker-compose up -d db

# Terminal 2: Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 3: Frontend
cd frontend
npm run dev
```

### **Production** (Docker)

```bash
# Build and run all services
docker-compose up --build -d

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 📖 API Documentation

### **Base URL**
```
http://localhost:8000
```

### **1. Create Interview Session**
```http
POST /create_session
Content-Type: multipart/form-data

Parameters:
  - file (PDF) - Resume file
  - jobTitle (string) - Target job title
  - jobDescription (string) - Job posting text
  - first_name (string) - User first name
  - last_name (string) - User last name
  - email (string) - User email
```

**Response:**
```json
{
  "status": "success",
  "sessionId": "uuid-string"
}
```

---

### **2. Chat with AI**
```http
POST /chat/{sessionId}
Content-Type: application/x-www-form-urlencoded

Parameters:
  - user_message (string) - User's response
```

**Response:**
```
Audio/MP3 file
Headers: X-AI-Response-Text: <encoded AI response>
```

---

### **3. End Session & Get Feedback**
```http
POST /end_session/{sessionId}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "interview_feedback": {
      "score": 8,
      "feedback": "Strong communication skills...",
      "strengths": ["Problem-solving", "..."],
      "improvements": ["Technical depth", "..."]
    },
    "resume_analysis": {
      "score": 75,
      "feedback": "Good match overall...",
      "keywords_missing": ["Kubernetes", "..."]
    }
  }
}
```

---

### **4. Get Dashboard**
```http
GET /dashboard/{userEmail}
```

**Response:**
```json
[
  {
    "id": "session-id",
    "jobTitle": "Senior Engineer",
    "status": "COMPLETE",
    "rating": 8,
    "resumeScore": 75,
    "createdAt": "2026-03-03T...",
    ...
  }
]
```

---

## 📁 Project Structure

```
interview-gym/
├── frontend/                    # Next.js React app
│   ├── app/
│   │   ├── page.tsx            # Home (setup form)
│   │   ├── layout.tsx          # App wrapper + Clerk
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Session history + reports
│   │   ├── interview/
│   │   │   └── [session_id]/   # Interview chat UI
│   │   ├── sign-in/            # Clerk auth page
│   │   └── sign-up/            # Clerk auth page
│   ├── lib/
│   │   └── api.ts             # API configuration
│   ├── middleware.ts          # Auth middleware
│   └── package.json
│
├── backend/                     # FastAPI Python app
│   ├── app/
│   │   ├── main.py            # FastAPI app + routes
│   │   ├── utils.py           # Helper functions
│   │   └── services/
│   │       ├── ai.py          # Interview coach (Groq)
│   │       ├── rag.py         # Resume search (LangChain)
│   │       └── s3.py          # File storage (mock)
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # DB version history
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Container image
│   └── .env                  # Environment variables
│
├── docker-compose.yml        # Multi-container config
├── README.md                # This file
└── CODE_REVIEW.md           # Detailed code analysis
```

---

## ⚠️ Known Limitations

### **Current (MVP Stage)**

1. **Resume Storage**: Using MinIO (S3-compatible) for local development, production-ready for AWS S3
2. **Audio Quality**: Browser Web Speech API limitations
3. **Interview Duration**: No timeout mechanism (session can hang)
4. **Concurrent Users**: Single database, no horizontal scaling
5. **Silence Detection**: Uses browser-native detection (inconsistent across browsers)
6. **Language Support**: English only
7. **Mobile**: Not fully optimized for mobile devices

### **Security Note for Development**
- ⚠️ GROQ_API_KEY is visible in `.env` file
- ⚠️ Database credentials are hardcoded (dev only!)
- ⚠️ No rate limiting on API endpoints
- ⚠️ Input validation is minimal

**These are acceptable for portfolio/demo but MUST be fixed before production!**

See `CODE_REVIEW.md` for detailed analysis and recommended fixes.

---

## 🚀 Future Improvements

### **Short Term (v1.1)**
- [x] ~~Implement real AWS S3 storage~~ - **Done with MinIO**
- [ ] Add database backup strategy
- [ ] Implement proper error handling & logging
- [ ] Add rate limiting (prevent API abuse)
- [ ] Comprehensive API documentation (Swagger/OpenAPI)
- [ ] Deploy MinIO + backend to production server

### **Medium Term (v2.0)**
- [ ] Multi-language support (Spanish, French, etc.)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard for admin
- [ ] Email notifications
- [ ] Video interview feature
- [ ] Interview recordings/playback

### **Long Term (v3.0+)**
- [ ] Horizontal scaling (Kubernetes)
- [ ] Real-time collaboration features
- [ ] Integration with LinkedIn/Indeed
- [ ] Premium subscription model
- [ ] Resume builder tool
- [ ] Mock interview marketplace

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### **Code Style**
- Python: PEP 8
- TypeScript: ESLint config included
- Commit messages: Conventional Commits

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Mohammed Boutahir**
- **GitHub**: [github.com/mboutahir](#)
- **LinkedIn**: [linkedin.com/in/mboutahir](#)

---

## 📝 Changelog

### **v1.0.0** (March 2026)
- ✅ Initial release
- ✅ Core interview functionality
- ✅ Resume analysis
- ✅ Dashboard with history

---

**Made with ❤️ by Mohammed Boutahir**

