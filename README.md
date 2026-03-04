# 🎯 InterviewGym - Enterprise-Grade AI Interview Coach

![Status](https://img.shields.io/badge/status-production--ready-success)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)
![Security](https://img.shields.io/badge/Security-Enterprise-green)
![License](https://img.shields.io/badge/license-MIT-green)

> **Enterprise-grade AI interview platform with advanced security, type safety, and real-time voice interaction.** Practice interview skills with an intelligent AI recruiter that adapts to your responses and provides detailed performance analytics.

**Latest Updates (v2.0):**
- ✅ Clerk JWT authentication with RS256 token verification
- ✅ Type-safe API with standardized responses
- ✅ Clerk-ID based user identification (no email dependency)
- ✅ IDOR vulnerability patched across all endpoints
- ✅ Role-based access control & authorization checks
- ✅ Unified state management for interview flow
- ✅ Production-ready error handling & logging
- ✅ Rate limiting on all public endpoints

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Security Implementation](#-security-implementation)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Interview Q&A](#-interview-qa)
- [Contributing](#-contributing)

---

## ✨ Features

### 🎤 **Interactive AI Interviews**
- Real-time voice-based interviews with adaptive AI
- Dynamic conversation flow that responds to candidate answers
- Automatic fallback to backup questions for continuity
- Smart icebreakers and interview pacing
- Seamless audio input/output with Web Speech API

### 📊 **Resume Analysis & Scoring**
- Automated resume vs. job description matching
- Keyword extraction and gap identification
- AI-powered resume scoring (0-10 scale)
- Personalized feedback on resume-to-role fit
- PDF text extraction with semantic understanding

### 🎯 **Performance Feedback & Analytics**
- Real-time interview scoring (0-10 scale)
- Detailed feedback report with strengths & areas for improvement
- Multi-criteria evaluation (communication, technical, presentation)
- Session history with progress tracking
- Historical comparison & improvement suggestions

### 🔐 **Enterprise Security**
- Clerk JWT authentication (RS256 algorithm)
- Token-based session isolation (clerk_id as primary key)
- Role-based access control (RBAC)
- IDOR vulnerability prevention on all endpoints
- Rate limiting: 5/hour (create), 20/min (chat), 10/hr (end_session)
- No stack trace exposure in error responses

### 🎨 **Beautiful & Responsive UI**
- Dark gradient theme with glassmorphism effects
- Real-time state management with visual feedback
- Loading & error boundary components
- Mobile-responsive design
- Accessible color contrasts (WCAG AA compliant)

---

## 🏗️ Tech Stack

### **Frontend Stack**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16 | SSR React framework |
| **TypeScript** | 5.0+ | Type-safe JavaScript |
| **Clerk** | Latest | Authentication & token management |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **Lucide React** | Latest | Icon library |
| **Web Speech API** | Native | Voice I/O |

### **Backend Stack**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | Latest | Async Python web framework |
| **Prisma ORM** | 0.15.0 | Type-safe database access |
| **PostgreSQL** | 15+ | Relational database |
| **Groq API** | Latest | LLM inference (Mixtral 8x7B) |
| **LangChain** | Latest | LLM orchestration |
| **ChromaDB** | Latest | Vector database for embeddings |
| **Edge TTS** | Latest | Text-to-speech |
| **Boto3 + MinIO** | Latest | S3-compatible storage |
| **PyJWT** | 2.11.0 | JWT verification (RS256) |

### **Infrastructure**
| Tool | Purpose |
|------|---------|
| **Docker & Docker Compose** | Containerization & orchestration |
| **PostgreSQL** | Production database |
| **MinIO** | S3-compatible local storage |
| **Prisma Migrate** | Database version control |

---

## 🎨 Architecture

### **Authentication Flow**

```
User (Clerk)
    ↓
Frontend (getToken)
    ↓ Bearer ${token}
Backend (verify_clerk_token)
    ↓
JWT Validation (RS256)
    ↓
ClerkID Extraction
    ↓
User Isolation & Authorization
```

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

