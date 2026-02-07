from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
from fastapi import HTTPException, status, File, UploadFile, Form
from app.ai import analyze_resume
from app.utils import extract_pdf_toString
from prisma import Prisma
import json
import uuid
from app.services.rag import RAGService
from app.services.s3 import S3Service
import os


# (main.py) is the Logic that Uvicorn calls when a packet arrives.
# uvicorn is the web server that listens for incoming HTTP requests and forwards them to our FastAPI application.

app = FastAPI(
    title="TalentAgent API"
)  # create an instance of the fastapi class app is the webserver . When you run uvicorn app.main:app, uvicorn looks for this specific object to start listening on Port 8000.
db = Prisma()  # Create an instance of the Prisma class to interact with the database.
rag_service = RAGService()
s3_service = S3Service()

# startup shutdown are built in
@app.on_event("startup")
# cosume on startup event
async def startup():
    print("attempting to connect to Postgres...")
    await db.connect()
    print("Database Connected! ")


@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()


# Middleware is a function that runs before every single request reaches actual code. for security purposes.Firewall Rule.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],  # Allow both ports
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc)
    allow_headers=["*"],  # Allows all headers
)


# If you see a GET request for /health, don't handle it yourself. Call this function instead.
@app.get(
    "/health", status_code=status.HTTP_200_OK
)  # When a user sends a GET request to the URL /health, run the function below
async def health_check():  # : is for starting the code block
    if db.is_connected():
        return {"status": "healthy", "database": "connected "}
    else:
        return {"status": "unhealthy", "database": "disconnected "}


@app.post("/create_session", status_code=status.HTTP_201_CREATED)
# Variable Name: file
# Type: UploadFile (A class that handles binary file uploads)
# Translation: "I am creating a variable named file, and it will hold an object of type UploadFile."
# = File(...) (The Instruction)
# This is specific to FastAPI. In standard Python, the part after the = is usually a default value (like int x = 5). But here, it is an instruction to the web server:
# "Don't expect this data to come from the URL (like ?id=5)."
# "Don't expect it from a JSON body."
# "LOOK for it in the 'Form Data' section of the HTTP packet."
# ... is required :
# ou might think ... is me being lazy. It is not! In FastAPI/Pydantic, the literal three dots Ellipsis mean "This field is absolutely required."
# If you wrote = File(None), the file would be optional.
# Writing = File(...) means: "If the user sends a request without a file, reject it immediately with a 422 Error."
async def create_session(file: UploadFile = File(...), 
                            jobDescription: str = Form(...),
                            jobTitle: str = Form(...),
                            first_name: str = Form(...),
                            last_name: str = Form(...),
                            email: str = Form(...)):
    file_Content = await file.read()

    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    tmp_file_path = f"/tmp/{file_name}"
    with open(tmp_file_path, 'wb') as buffer:
        buffer.write(file_Content)
    try:
        s3_url = s3_service.upload_file(fileContent=file_Content, fileName=file_name)
        if not s3_url:
            print("⚠️ S3 Upload failed, but continuing flow.")
        user = await db.user.find_unique(where={'email': email})
        if not user:
            user = await db.user.create(
                data={
                   "email": email,
                   "FirstName": first_name,
                   "LastName": last_name,
                   "clerkId": str(uuid.uuid4())
                },
            )
        resume_text = extract_pdf_toString(file_Content)
        if not resume_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to extract text from PDF",
            )
        newsession = await db.interviewsessions.create(data={
                "jobTitle": jobTitle,
                "jobDescription": jobDescription,
                "resumeText": resume_text,
                "resumeUrl":  s3_url,
                "status": "SETUP",
                "UserId": user.id

        })
        result = rag_service.process_file(tmp_file_path, newsession.id)
        return  {
            "status": "success",
            "sessionId": newsession.id
        }

    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Critical Error: {str(e)}")
    finally:
        #cleanup
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)        
