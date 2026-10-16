# InterviewGym — AI Voice Interview Coach

Practice job interviews by voice with an AI recruiter that has read your résumé.
Upload a PDF résumé and a job description, answer six spoken questions, and get a
scored report on your interview and on how well your résumé matches the role.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-async-009688)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)
![LLM](https://img.shields.io/badge/LLM-Ollama%20%7C%20Groq-orange)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Security](#security)
- [Project Structure](#project-structure)
- [Design Decisions](#design-decisions)
- [Known Limitations & Roadmap](#known-limitations--roadmap)

---

## Features

**Voice interview**
- The AI recruiter ("Alex") opens with an icebreaker, then asks follow-up questions
  grounded in your answers, the job description and your résumé.
- Speech-to-text runs in the browser (Web Speech API); the answer is sent
  automatically after 3 seconds of silence.
- Replies are spoken back with neural text-to-speech (Edge TTS).
- The interview ends automatically after 6 questions, or manually at any time.
- If the LLM call fails, the interviewer falls back to a generic question so the
  conversation keeps going.

**Résumé-aware questions (RAG)**
- The résumé PDF is split into chunks, embedded and stored in ChromaDB.
- On every turn, the 3 chunks most similar to the candidate's answer are injected
  into the prompt.

**Feedback report**
- Interview score (0–10) with a summary, top 3 strengths and top 3 improvements.
- Résumé-vs-job match score (0–100) with a summary and missing keywords.
- Dashboard with the history of all your sessions.

**Pluggable LLM**
- Runs fully **local with Ollama** (free, résumés never leave your machine) or in
  the **cloud with Groq** (much faster). Switching is one line in `.env`.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript | UI |
| | Clerk | Sign-in / sign-up, JWT session tokens |
| | Tailwind CSS 4, Lucide icons | Styling |
| | Web Speech API | Speech-to-text in the browser |
| Backend | FastAPI (async Python 3.11) | REST API |
| | Pydantic v2 | Request validation, typed response envelope |
| | Prisma Client Python + PostgreSQL 15 | Data access, migrations |
| | PyJWT (RS256) | Verifies Clerk tokens locally |
| | slowapi | Per-IP rate limiting |
| AI | OpenAI-compatible client → **Ollama** (`qwen2.5:3b`) or **Groq** (`llama-3.3-70b-versatile`) | Interview questions, feedback, résumé scoring |
| | LangChain + `all-MiniLM-L6-v2` (Hugging Face) + ChromaDB | RAG over the résumé |
| | Edge TTS | Text-to-speech |
| Storage | MinIO via boto3 (S3 API) | Résumé PDF storage |
| Infra | Docker Compose, uv | Local Postgres + MinIO, Python deps |

---

## Architecture

```
┌──────────────────────── Browser (Next.js + Clerk) ────────────────────────┐
│  Setup form  ──►  Interview page (mic + audio)  ──►  Dashboard            │
│        every request: Authorization: Bearer <Clerk JWT>                   │
└───────────────────────────────────┬───────────────────────────────────────┘
                                    │ HTTP (multipart / JSON / audio)
                           ┌────────▼────────┐
                           │     FastAPI      │  Depends(get_current_user)
                           │                  │  → verifies JWT (RS256)
                           └──┬─────┬─────┬──┬┘
          ┌───────────────────┘     │     │  └──────────────────┐
   ┌──────▼──────┐   ┌──────────────▼┐  ┌─▼──────────────┐  ┌───▼──────┐
   │ PostgreSQL  │   │  RAGService   │  │ InterviewCoach │  │  MinIO   │
   │  (Prisma)   │   │ LangChain +   │  │ LLM + Edge TTS │  │ (boto3)  │
   │             │   │ ChromaDB      │  │                │  │          │
   └─────────────┘   └───────────────┘  └───────┬────────┘  └──────────┘
                                                │ OpenAI-compatible API
                                     ┌──────────┴──────────┐
                                     │ Ollama (local)  or  │
                                     │ Groq (cloud)        │
                                     └─────────────────────┘
```

### Request flow

1. **`POST /create_session`** — validate the PDF and form fields → upload the PDF
   to MinIO → extract its text into Postgres → chunk (500 chars, 50 overlap),
   embed and store the chunks in ChromaDB tagged with the session ID.
2. **`POST /chat/{id}`** — check the session belongs to the caller → retrieve the
   top-3 résumé chunks for the answer → send system prompt + last 10 messages +
   answer to the LLM → convert the reply to MP3 → return the audio, with the reply
   text in the `X-AI-Response-Text` header.
3. After the **6th question** (or on **`POST /end_session/{id}`**) — the LLM
   produces the interview report and the résumé analysis in JSON mode; both are
   stored and the session is marked `COMPLETE`.
4. **`GET /dashboard`** — returns the caller's sessions, newest first.

### Data model

```
User 1 ── * InterviewSessions 1 ── * InterviewMessage
(clerkId unique)  (job, résumé text/URL,      (role: user | assistant,
                   status, scores, feedback)   content, createdAt)
```

---

## Quick Start

### Prerequisites

- Docker Desktop
- Python 3.11 and [uv](https://docs.astral.sh/uv/)
- Node.js 20+
- A free [Clerk](https://clerk.com) application
- [Ollama](https://ollama.com) (for the local LLM) **or** a [Groq API key](https://console.groq.com/keys)

### 1. Clone and configure

```bash
git clone https://github.com/mboutahir/InterviewGym.git
cd InterviewGym
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Fill in the Clerk keys in both files (see [Configuration](#configuration)).

### 2. Start Postgres and MinIO

```bash
docker compose up -d     # Postgres on localhost:5433, MinIO on :9000 (console :9001)
```

### 3. Start the LLM (local option)

```bash
ollama serve             # or open the Ollama app
ollama pull qwen2.5:3b
```

Using Groq instead? Set `LLM_PROVIDER="groq"` and `GROQ_API_KEY` in `backend/.env`.

### 4. Backend

```bash
cd backend
uv sync
source .venv/bin/activate
prisma generate
prisma migrate deploy
uvicorn app.main:app --reload --port 8000
```

The first start downloads the embedding model (~90 MB).

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in **Chrome or Edge** (the Web Speech API is not
available in Firefox/Safari) and allow microphone access.

---

## Configuration

### `backend/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgresql://user:password@localhost:5433/recruiter_db?schema=public` |
| `LLM_PROVIDER` | `ollama` (local) or `groq` (cloud) |
| `LLM_MODEL` | Optional model override (defaults: `qwen2.5:3b` / `llama-3.3-70b-versatile`) |
| `OLLAMA_BASE_URL` | Optional, defaults to `http://localhost:11434/v1` |
| `GROQ_API_KEY` | Required only when `LLM_PROVIDER=groq` |
| `CLERK_JWT_PUBLIC_KEY` | Clerk's RSA public key in PEM format, newlines written as `\n` |
| `AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `AWS_REGION` | MinIO / S3 settings (defaults match `docker-compose.yml`) |

`CLERK_JWT_PUBLIC_KEY` is shown in the Clerk dashboard under **API Keys → JWT
public key**, or can be derived from
`https://<your-instance>.clerk.accounts.dev/.well-known/jwks.json`.

### `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_test_…`) |
| `CLERK_SECRET_KEY` | Clerk secret key (`sk_test_…`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `…_SIGN_UP_URL` | `/sign-in`, `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `…_AFTER_SIGN_UP_URL` | `/` |

---

## API Reference

All endpoints except `/health` require `Authorization: Bearer <Clerk JWT>`.
JSON responses use one envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "…",
  "data": { },
  "error": null,
  "timestamp": "2026-10-16T12:00:00+00:00"
}
```

| Method | Path | Body | Returns | Rate limit |
|---|---|---|---|---|
| `GET` | `/health` | — | `{"status": "healthy", "database": "connected"}` | — |
| `POST` | `/create_session` | multipart: `file` (PDF ≤ 5 MB), `jobTitle`, `jobDescription`, `first_name`, `last_name` | `data: {sessionId, jobTitle, createdAt}` | 5 / hour |
| `POST` | `/chat/{session_id}` | form: `user_message` | `audio/mpeg` + headers `X-AI-Response-Text` (URL-encoded), `X-Session-Complete: true` on the last question; JSON `{"isSessionComplete": true}` once the interview is over | 20 / minute |
| `POST` | `/end_session/{session_id}` | — | `data: {interview_feedback, resume_analysis}` | 10 / hour |
| `GET` | `/dashboard` | — | `data: [session, …]` for the caller | 30 / minute |

Interactive docs: **http://localhost:8000/docs** (Swagger UI).

Report formats:

```json
// interview_feedback
{ "score": 7, "feedback": "…", "strengths": ["…"], "improvements": ["…"] }

// resume_analysis
{ "score": 50, "feedback": "…", "keywords_missing": ["Docker", "…"] }
```

---

## Security

- **Authentication** — Clerk issues RS256-signed JWTs. The backend verifies the
  signature and expiry locally with Clerk's public key (no network call per
  request) and pins the algorithm to `RS256`.
- **Authorization / IDOR protection** — every session endpoint checks that the
  session's owner `clerkId` matches the token's `sub`; otherwise it returns `403`.
  The dashboard only queries the caller's own sessions.
- **Input validation** — Pydantic validators enforce field lengths, reject
  template/HTML characters in job fields, and restrict uploads to `.pdf` files
  with an `application/pdf` content type, ≤ 5 MB, no path traversal in the name.
- **Rate limiting** — per-IP limits on every endpoint (see table above) to protect
  the expensive LLM / embedding calls.
- **Error handling** — clients get a generic message for server errors; full stack
  traces go to `backend/logs/` only.
- **CORS** — only the frontend origin is allowed; only the two custom response
  headers the UI needs are exposed.
- **Route protection** — Next.js middleware redirects signed-out users to `/sign-in`.

---

## Project Structure

```
InterviewGym/
├── docker-compose.yml          # Postgres + MinIO
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app, routes, CORS, rate limiting
│   │   ├── auth.py             # Clerk JWT verification dependency
│   │   ├── models.py           # Pydantic request/response models
│   │   ├── exceptions.py       # Typed HTTP exceptions
│   │   ├── logging_config.py   # Console + file logging
│   │   ├── utils.py            # PDF text extraction
│   │   └── services/
│   │       ├── ai.py           # InterviewCoach: LLM prompts, feedback, TTS
│   │       ├── rag.py          # Chunking, embeddings, ChromaDB search
│   │       └── s3.py           # MinIO/S3 upload with retries
│   ├── prisma/
│   │   ├── schema.prisma       # Data model
│   │   └── migrations/
│   ├── pyproject.toml / uv.lock
│   ├── requirements.txt        # Used by the Dockerfile
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── page.tsx            # Setup form (résumé + job)
    │   ├── interview/[session_id]/page.tsx   # Voice interview
    │   ├── dashboard/page.tsx  # History + reports
    │   ├── sign-in/, sign-up/  # Clerk pages
    │   ├── types/, utils/      # API types, fetch helpers, type guards
    │   └── layout.tsx          # ClerkProvider
    ├── middleware.ts           # Route protection
    └── .env.example
```

---

## Design Decisions

- **One OpenAI-compatible client for every LLM.** Ollama and Groq both expose the
  OpenAI chat-completions API, so the provider is a config value, not a code
  path. It trades latency (Groq ≈ 2–3 s per turn) against cost and privacy (Ollama
  is free and fully local, ≈ 10–20 s per turn on an M-series laptop).
- **RAG instead of the full résumé in every prompt.** Keeps each prompt small and
  focused on what the candidate just talked about. The full text is still used
  for the one-off résumé-match analysis.
- **Session ID as Chroma metadata.** All résumés share one collection; a metadata
  filter isolates each session's chunks.
- **Speech-to-text in the browser, text-to-speech on the server.** Browser STT is
  free and adds no upload latency; server TTS gives a consistent voice.
- **JSON mode for reports.** `response_format={"type": "json_object"}` makes the
  reports machine-readable and lets the dashboard render them as structured data.
- **MinIO with the S3 API.** Local development needs no AWS account, and moving to
  AWS S3 is an environment-variable change.
- **Local JWT verification.** RS256 lets the backend verify tokens with a public
  key only, with no secret and no call to Clerk on each request.

---

## Known Limitations & Roadmap

- Embedding, S3 upload and report generation run inside the request; they should
  move to a background worker (e.g. arq/Celery) so the event loop is never blocked.
- The rate limiter is in-memory and per-process; use Redis for multiple instances.
- The Clerk public key is static; fetching and caching the JWKS would handle key
  rotation automatically.
- The frontend calls `http://127.0.0.1:8000` directly; it should come from an
  environment variable for deployment.
- Speech recognition only works in Chromium-based browsers; English only.
- No automated test suite yet (the auth dependency is designed to be overridden
  with `app.dependency_overrides` in tests).
- Vectors are never deleted from ChromaDB when a session ends.

---

## Author

**Mohammed Boutahir** — backend design and implementation
- GitHub: [github.com/mboutahir](https://github.com/mboutahir)
- LinkedIn: [mohammed-boutahir](https://www.linkedin.com/in/mohammed-boutahir-66b333281/)
