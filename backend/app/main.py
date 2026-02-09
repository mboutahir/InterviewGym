from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
from fastapi import HTTPException, status, File, UploadFile, Form, BackgroundTasks
#Standard API responses return Text
from fastapi.responses import FileResponse
from app.utils import extract_pdf_toString
from prisma import Prisma
import json
import uuid
from urllib.parse import quote
from app.services.rag import RAGService
from app.services.s3 import S3Service
#here we have the instance of interview coach
from app.services.ai import interview_coach
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
    allow_origins=["*"],
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
            raise HTTPException(status_code=500, detail="Failed to upload resume to S3 Storage")
        user = await db.user.find_unique(where={'email': email})
        if not user:
            user = await db.user.create(
                data={
                   "email": email,
                   "firstName": first_name,
                   "lastName": last_name,
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
                "userId": user.id

        })
        result = rag_service.process_file(tmp_file_path, newsession.id)
        return  {
            "status": "success",
            "sessionId": newsession.id
        }

    
    except Exception as e:
        # 👇 ADD THESE LINES TO SEE THE ERROR IN THE TERMINAL
        print("------------------------------------------------------------------")
        print(f"🔥 CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc() 
        print("------------------------------------------------------------------")
        
        # Keep this line so the frontend still gets a response
        raise HTTPException(status_code=500, detail=f"Critical Error: {str(e)}")
    finally:
        #cleanup
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)        
@app.post("/chat/{session_id}", status_code=status.HTTP_201_CREATED)
#BackgroundTasks special fat api feature that runs after the response
async def chat_response(session_id: str, background_tasks: BackgroundTasks, user_message: str = Form(...)):
    try:
        session = await db.interviewsessions.find_unique(
            where={"id": session_id},
            include={"user": True}
            )
        if not session :
            raise HTTPException(status_code=404, detail="Session not found")
        await db.interviewmessage.create(
            data={
                "role" : "user",
                "content" : user_message,
                "sessionId": session_id
            }
        )
        previous_messages = await db.interviewmessage.find_many(
            where={"sessionId": session_id},
            order={"createdAt": "asc"},
            take=10
        )
        chat_history = []
        for msg in previous_messages:
            chat_history.append({"role": msg.role.lower(), "content": msg.content})

        context_text = rag_service.search_resume(user_message, session_id)

        ai_text = await interview_coach.generate_Response(resource_context=context_text, job_description=session.jobDescription,
                                                        user_message=user_message,
                                                        chat_history=chat_history,job_title= session.jobTitle)
        await db.interviewmessage.create(
            data = {
            "role" : "assistant",
            "content" : ai_text,
            "sessionId": session_id
            }
        )
        safe_header_text = quote(ai_text)
        file_name = f"{uuid.uuid4()}.mp3"
        audio_path = f"/tmp/{file_name}"
        success = await interview_coach.tts_response(ai_text, audio_path)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to generate voice audio")
        background_tasks.add_task(os.remove, audio_path)
        return FileResponse(
            audio_path,
            media_type = "audio/mpeg",
            filename= file_name,
            headers={"X-AI-Response-Text": safe_header_text}

        )
    except Exception as e:
            # 👇 ADD THESE LINES TO SEE THE ERROR IN THE TERMINAL
            print("------------------------------------------------------------------")
            print(f"🔥 CRITICAL ERROR: {str(e)}")
            import traceback
            traceback.print_exc() 
            print("------------------------------------------------------------------")
            
            # Keep this line so the frontend still gets a response
            raise HTTPException(status_code=500, detail=f"Critical Error: {str(e)}")

