# 🚀 InterviewGym Setup Guide

## Critical Setup Steps

### 1. Get Your Clerk JWT Public Key

#### Where to find it:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Go to **API Keys** section (usually under Settings)
4. Look for **JWT Signing Key** or **API Key**
5. Copy the **Public Key** (should start with `-----BEGIN PUBLIC KEY-----`)

#### Example format:
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds...
...many more lines...
-----END PUBLIC KEY-----
```

#### Add to your `.env` file:
```bash
# Open /backend/.env and find the CLERK_JWT_PUBLIC_KEY line:
CLERK_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n<YOUR_KEY_HERE>\n-----END PUBLIC KEY-----"
```

**Important**: 
- Replace `<YOUR_KEY_HERE>` with your actual Clerk public key
- Keep the `\n` for newlines (this is how Python handles multi-line strings in env variables)
- Don't include extra spaces or quotes within the key

### 2. Verify MinIO is Running

MinIO handles file uploads (resumes). It should be running in Docker:

```bash
# Check if MinIO container is running
docker ps | grep minio

# Expected output:
# CONTAINER ID   IMAGE              STATUS
# 6d34e1806929   minio/minio:latest Up 4 minutes   0.0.0.0:9000->9000/tcp
```

If MinIO is NOT running:

```bash
# Start all services with Docker Compose
cd /Users/mohammedboutahir/Desktop/roro
docker-compose up -d

# Verify it started
docker-compose ps
```

### 3. Restart Backend to Load New Configuration

After updating `.env`:

```bash
# Kill the old backend process
pkill -f "uvicorn main:app"

# Or manually stop it (Ctrl+C in terminal)

# Restart backend
cd /Users/mohammedboutahir/Desktop/roro/backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## Testing the Setup

### 1. **Verify Clerk Authentication**
- Go to http://localhost:3000
- Click "Sign In" or "Sign Up"
- Sign in with your email through Clerk
- Should see your email displayed

### 2. **Test Session Creation**
- Fill in job title and description
- Upload a PDF resume
- Click "Start Interview"

**Expected flow:**
```
✅ Frontend gets JWT token from Clerk
✅ Frontend sends token in Authorization header
✅ Backend verifies JWT signature
✅ Backend creates session in database
✅ Redirects to interview page
```

**If you see "Failed to start session":**
- Check browser console (F12) for error details
- Check backend logs for specific error
- Verify CLERK_JWT_PUBLIC_KEY is correct in .env

### 3. **View Dashboard**
- After session is created, go to http://localhost:3000/dashboard
- Should see your interview session listed

---

## Common Issues & Fixes

### Issue: "TypeError: Expecting a PEM-formatted key"
**Cause**: CLERK_JWT_PUBLIC_KEY is not in .env or wrong format

**Fix**: 
```bash
# 1. Get your actual key from Clerk dashboard
# 2. Add it to .env file:
CLERK_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n<ACTUAL_KEY>\n-----END PUBLIC KEY-----"

# 3. Restart backend
pkill -f "uvicorn"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Issue: "Failed to ensure bucket exists: Could not connect..."
**Cause**: MinIO container not running or not responding

**Fix**:
```bash
# Check if MinIO is running
docker ps | grep minio

# If not running, start it:
cd /Users/mohammedboutahir/Desktop/roro
docker-compose up -d minio

# Verify it's accessible:
curl http://localhost:9000/minio/health/live
# Should return: 200 OK
```

### Issue: "Not authenticated" or "Token invalid"
**Cause**: JWT token not being sent or Clerk key is wrong

**Fix**:
1. Check that you're signed in (see email at top-right)
2. Verify CLERK_JWT_PUBLIC_KEY in .env is correct and complete
3. Restart backend after updating .env

---

## Environment Variables Reference

### `.env` file should contain:

```properties
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/recruiter_db?schema=public"

# Groq API for AI responses
GROQ_API_KEY="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"

# MinIO S3 Configuration
AWS_ENDPOINT_URL="http://localhost:9000"
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="minioadmin"
AWS_BUCKET_NAME="resumes"
AWS_REGION="us-east-1"

# ⭐ CRITICAL: Clerk JWT Public Key
CLERK_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n<YOUR_KEY_HERE>\n-----END PUBLIC KEY-----"
```

---

## Architecture Verification

Once everything is set up, verify the complete flow:

```
User (Clerk) ← ✅ Authentication
    ↓
Frontend (Next.js) ← ✅ Gets JWT token
    ↓
Backend (FastAPI) ← ✅ Verifies JWT
    ↓
Database (PostgreSQL) ← ✅ Stores sessions
    ↓
MinIO (S3) ← ✅ Stores resume files
    ↓
AI (Groq) ← ✅ Generates interview responses
```

All components working = fully functional application! 🎉

---

## Need Help?

Check logs:
- **Frontend errors**: Browser console (F12)
- **Backend errors**: Terminal running uvicorn
- **Database errors**: Check PostgreSQL is running (`docker ps`)
- **MinIO errors**: Check MinIO is running (`docker ps | grep minio`)
