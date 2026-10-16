from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException, status, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.exceptions import (
    ValidationError,
    NotFoundError,
    ForbiddenError,
    InternalServerError,
)
from app.utils import extract_pdf_toString
from app.models import (
    CreateSessionRequest,
    FileUploadRequest,
    ApiResponse,
    CreateSessionResponse,
    EndSessionResponse,
    DashboardSessionItem,
)
from app.services.rag import RAGService
from app.services.s3 import S3Service
from app.services.ai import interview_coach
from app.logging_config import logger
from app.auth import get_current_user
from prisma import Prisma
from datetime import datetime, timezone
from typing import List
import json
import uuid
import os
from urllib.parse import quote

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="TalentAgent API")
app.state.limiter = limiter

db = Prisma()
rag_service = RAGService()
s3_service = S3Service()


def get_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def error_response(e: HTTPException, message: str) -> ApiResponse:
    return ApiResponse(
        success=False,
        statusCode=e.status_code,
        message=message,
        error=e.detail,
        timestamp=get_timestamp(),
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    client_id = get_remote_address(request)
    logger.warning(f"Rate limit exceeded by {client_id} on {request.url.path}")
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "statusCode": 429,
            "message": "Too many requests",
            "error": "Rate limit exceeded. Please try again later.",
            "timestamp": get_timestamp(),
        },
    )


@app.on_event("startup")
async def startup():
    logger.info("Attempting to connect to Postgres...")
    await db.connect()
    logger.info("Database connected!")


@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()


origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Custom response headers are hidden from browser JS unless explicitly exposed
    expose_headers=["X-AI-Response-Text", "X-Session-Complete"],
)


@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    if db.is_connected():
        return {"status": "healthy", "database": "connected"}
    return {"status": "unhealthy", "database": "disconnected"}


@app.post("/create_session", status_code=201)
@limiter.limit("5/hour")
async def create_session(
    request: Request,
    file: UploadFile = File(...),
    jobDescription: str = Form(...),
    jobTitle: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(""),  # empty form fields count as "missing", so default it
    current_user: dict = Depends(get_current_user),
) -> ApiResponse[CreateSessionResponse]:
    tmp_file_path = None
    clerk_id = current_user["user_id"]
    first_name_arg = first_name
    last_name_arg = last_name

    client_id = get_remote_address(request)
    logger.info(f"Create session request from {client_id} for user {clerk_id}")

    try:
        FileUploadRequest(
            filename=file.filename, file_size=file.size, content_type=file.content_type
        )
        CreateSessionRequest(
            jobTitle=jobTitle,
            jobDescription=jobDescription,
            first_name=first_name,
            last_name=last_name,
            clerk_id=clerk_id,
        )

        file_content = await file.read()

        if len(file_content) > FileUploadRequest.MAX_FILE_SIZE:
            raise ValidationError(
                f"File exceeds size limit of {FileUploadRequest.MAX_FILE_SIZE // (1024*1024)}MB"
            )

        file_ext = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        tmp_file_path = f"/tmp/{unique_filename}"

        with open(tmp_file_path, "wb") as buffer:
            buffer.write(file_content)

        s3_url = s3_service.upload_file(
            file_content=file_content, file_name=unique_filename
        )
        if not s3_url:
            raise InternalServerError()

        user = await db.user.find_unique(where={"clerkId": clerk_id})
        if not user:
            user = await db.user.create(
                data={
                    "clerkId": clerk_id,
                    "firstName": first_name_arg,
                    "lastName": last_name_arg,
                    "email": f"clerk_{clerk_id}@placeholder.local",
                }
            )

        resume_text = extract_pdf_toString(file_content)
        if not resume_text:
            raise ValidationError(
                "Could not extract text from PDF. Ensure it's a valid PDF."
            )

        newsession = await db.interviewsessions.create(
            data={
                "jobTitle": jobTitle,
                "jobDescription": jobDescription,
                "resumeText": resume_text,
                "resumeUrl": s3_url,
                "status": "SETUP",
                "userId": user.id,
            }
        )

        rag_service.process_file(tmp_file_path, newsession.id)
        logger.info(f"Session created: {newsession.id} for user {user.id}")

        return ApiResponse(
            success=True,
            statusCode=201,
            message="Session created successfully",
            data=CreateSessionResponse(
                sessionId=newsession.id,
                jobTitle=newsession.jobTitle,
                createdAt=newsession.createdAt.isoformat(),
            ),
            timestamp=get_timestamp(),
        )

    except ValidationError as e:
        logger.warning(f"Validation error in create_session: {e.detail}")
        return error_response(e, "Validation error")

    except InternalServerError as e:
        logger.error(f"Internal error in create_session: {e.detail}", exc_info=True)
        return error_response(e, "Internal server error")

    except ValueError as e:
        logger.warning(f"Pydantic validation error in create_session: {e}")
        return ApiResponse(
            success=False,
            statusCode=422,
            message="Validation error",
            error=str(e),
            timestamp=get_timestamp(),
        )

    except Exception as e:
        logger.error(f"Unexpected error in create_session: {e}", exc_info=True)
        return ApiResponse(
            success=False,
            statusCode=500,
            message="Internal server error",
            error="An unexpected error occurred",
            timestamp=get_timestamp(),
        )

    finally:
        if tmp_file_path and os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)


@app.post("/chat/{session_id}", status_code=201)
@limiter.limit("20/minute")
async def chat_response(
    request: Request,
    session_id: str,
    background_tasks: BackgroundTasks,
    user_message: str = Form(...),
    current_user: dict = Depends(get_current_user),
):
    client_id = get_remote_address(request)
    logger.info(f"Chat request from {client_id} for session {session_id}")

    try:
        session = await db.interviewsessions.find_unique(
            where={"id": session_id}, include={"user": True}
        )
        if not session:
            raise NotFoundError("Session not found")

        if session.user.clerkId != current_user["user_id"]:
            raise ForbiddenError("You do not have permission to access this session")

        # Last 10 messages BEFORE saving the new one (the new one is passed separately to the LLM)
        previous_messages = await db.interviewmessage.find_many(
            where={"sessionId": session_id}, order={"createdAt": "desc"}, take=10
        )
        chat_history = [
            {"role": msg.role.lower(), "content": msg.content}
            for msg in reversed(previous_messages)
        ]

        await db.interviewmessage.create(
            data={"role": "user", "content": user_message, "sessionId": session_id}
        )

        ai_question_count = await db.interviewmessage.count(
            where={"sessionId": session_id, "role": "assistant"}
        )

        # If we already have 6+ AI responses, auto-end without asking another question
        if ai_question_count >= 6:
            messages = await db.interviewmessage.find_many(
                where={"sessionId": session_id}, order={"createdAt": "asc"}
            )
            history = [
                {"role": msg.role.lower(), "content": msg.content} for msg in messages
            ]

            try:
                feedback = await interview_coach.generate_feedback(
                    chat_history=history, job_description=session.jobDescription
                )
                resume_feedback = await interview_coach.analyze_resume(
                    jobDescription=session.jobDescription, resume=session.resumeText
                )

                if not feedback or not feedback.get("score"):
                    feedback = {
                        "score": 0,
                        "feedback": "Interview completed but feedback generation failed.",
                        "strengths": [],
                        "improvements": [],
                    }

                if not resume_feedback or not resume_feedback.get("score"):
                    resume_feedback = {
                        "score": 0,
                        "feedback": "Resume analysis failed.",
                        "keywords_missing": [],
                    }

                await db.interviewsessions.update(
                    where={"id": session_id},
                    data={
                        "rating": feedback.get("score", 0),
                        "feedback": json.dumps(feedback),
                        "status": "COMPLETE",
                        "resumeScore": resume_feedback.get("score", 0),
                        "resumeFeedback": json.dumps(resume_feedback),
                    },
                )
            except Exception as feedback_err:
                logger.error(
                    f"Error generating feedback before question: {feedback_err}",
                    exc_info=True,
                )
                await db.interviewsessions.update(
                    where={"id": session_id},
                    data={"status": "COMPLETE"},
                )

            logger.info(
                f"Session {session_id} auto-completed for user {current_user['user_id']} after {ai_question_count} questions"
            )

            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Interview Complete!",
                    "isSessionComplete": True,
                },
            )

        context_text = rag_service.search_resume(user_message, session_id)

        ai_text = await interview_coach.generate_Response(
            resource_context=context_text,
            job_description=session.jobDescription,
            user_message=user_message,
            chat_history=chat_history,
            job_title=session.jobTitle,
        )
        await db.interviewmessage.create(
            data={"role": "assistant", "content": ai_text, "sessionId": session_id}
        )

        messages_after = await db.interviewmessage.find_many(
            where={"sessionId": session_id}, order={"createdAt": "asc"}
        )
        history_after = [
            {"role": msg.role.lower(), "content": msg.content} for msg in messages_after
        ]
        ai_count_after = len(
            [msg for msg in history_after if msg["role"] == "assistant"]
        )

        # If this was our 6th question, generate feedback in background and mark complete
        if ai_count_after >= 6:
            try:
                feedback = await interview_coach.generate_feedback(
                    chat_history=history_after, job_description=session.jobDescription
                )
                resume_feedback = await interview_coach.analyze_resume(
                    jobDescription=session.jobDescription, resume=session.resumeText
                )

                if not feedback or not feedback.get("score"):
                    feedback = {
                        "score": 0,
                        "feedback": "Interview completed but feedback generation failed.",
                        "strengths": [],
                        "improvements": [],
                    }

                if not resume_feedback or not resume_feedback.get("score"):
                    resume_feedback = {
                        "score": 0,
                        "feedback": "Resume analysis failed.",
                        "keywords_missing": [],
                    }

                await db.interviewsessions.update(
                    where={"id": session_id},
                    data={
                        "rating": feedback.get("score", 0),
                        "feedback": json.dumps(feedback),
                        "status": "COMPLETE",
                        "resumeScore": resume_feedback.get("score", 0),
                        "resumeFeedback": json.dumps(resume_feedback),
                    },
                )

                logger.info(
                    f"Session {session_id} auto-completed after question {ai_count_after}"
                )
            except Exception as feedback_err:
                logger.error(
                    f"Error generating feedback for session {session_id}: {feedback_err}",
                    exc_info=True,
                )
                await db.interviewsessions.update(
                    where={"id": session_id},
                    data={"status": "COMPLETE"},
                )

        safe_header_text = quote(ai_text)
        file_name = f"{uuid.uuid4()}.mp3"
        audio_path = f"/tmp/{file_name}"

        success = await interview_coach.tts_response(ai_text, audio_path)
        if not success:
            raise InternalServerError()

        background_tasks.add_task(os.remove, audio_path)

        response_headers = {"X-AI-Response-Text": safe_header_text}
        if ai_count_after >= 6:
            response_headers["X-Session-Complete"] = "true"

        return FileResponse(
            audio_path,
            media_type="audio/mpeg",
            filename=file_name,
            headers=response_headers,
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Unexpected error in chat_response: {e}", exc_info=True)
        raise InternalServerError()


@app.post("/end_session/{session_id}", status_code=200)
@limiter.limit("10/hour")
async def end_session(
    request: Request,
    session_id: str,
    current_user: dict = Depends(get_current_user),
) -> ApiResponse[EndSessionResponse]:

    client_id = get_remote_address(request)
    logger.info(f"End session request from {client_id} for session {session_id}")

    try:
        session = await db.interviewsessions.find_unique(
            where={"id": session_id}, include={"user": True}
        )
        if not session:
            raise NotFoundError("Session not found")

        if session.user.clerkId != current_user["user_id"]:
            raise ForbiddenError("You do not have permission to access this session")

        messages = await db.interviewmessage.find_many(
            where={"sessionId": session_id}, order={"createdAt": "asc"}
        )
        history = [
            {"role": msg.role.lower(), "content": msg.content} for msg in messages
        ]

        feedback = await interview_coach.generate_feedback(
            chat_history=history, job_description=session.jobDescription
        )
        resume_feedback = await interview_coach.analyze_resume(
            jobDescription=session.jobDescription, resume=session.resumeText
        )

        if not feedback or not feedback.get("score"):
            logger.warning(f"Empty feedback for session {session_id}, using defaults")
            feedback = {
                "score": 0,
                "feedback": "Interview completed but feedback generation failed.",
                "strengths": [],
                "improvements": [],
            }

        if not resume_feedback or not resume_feedback.get("score"):
            logger.warning(f"Empty resume feedback for session {session_id}, using defaults")
            resume_feedback = {
                "score": 0,
                "feedback": "Resume analysis failed.",
                "keywords_missing": [],
            }

        await db.interviewsessions.update(
            where={"id": session_id},
            data={
                "rating": feedback.get("score", 0),
                "feedback": json.dumps(feedback),
                "status": "COMPLETE",
                "resumeScore": resume_feedback.get("score", 0),
                "resumeFeedback": json.dumps(resume_feedback),
            },
        )

        logger.info(f"Session {session_id} completed for user {current_user['user_id']}")

        return ApiResponse(
            success=True,
            statusCode=200,
            message="Session ended and analysis complete",
            data=EndSessionResponse(
                interview_feedback=feedback,
                resume_analysis=resume_feedback,
            ),
            timestamp=get_timestamp(),
        )

    except NotFoundError as e:
        return error_response(e, "Not found")

    except ForbiddenError as e:
        return error_response(e, "Forbidden")

    except InternalServerError as e:
        logger.error(f"Internal error in end_session: {e.detail}", exc_info=True)
        return error_response(e, "Internal server error")

    except Exception as e:
        logger.error(f"Unexpected error in end_session: {e}", exc_info=True)
        return ApiResponse(
            success=False,
            statusCode=500,
            message="Internal server error",
            error="An unexpected error occurred",
            timestamp=get_timestamp(),
        )


@app.get("/dashboard", status_code=200)
@limiter.limit("30/minute")
async def get_dashboard(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> ApiResponse[List[DashboardSessionItem]]:

    client_id = get_remote_address(request)
    logger.info(f"Dashboard request from {client_id} for user {current_user['user_id']}")

    try:
        user_clerk_id = current_user["user_id"]
        user = await db.user.find_unique(where={"clerkId": user_clerk_id})

        # Return empty list instead of 404 if user doesn't exist yet
        if not user:
            return ApiResponse(
                success=True,
                statusCode=200,
                message="No sessions found",
                data=[],
                timestamp=get_timestamp(),
            )

        sessions = await db.interviewsessions.find_many(
            where={"userId": user.id}, order={"createdAt": "desc"}
        )

        session_items = [
            DashboardSessionItem(
                id=s.id,
                userId=s.userId,
                jobTitle=s.jobTitle,
                jobDescription=s.jobDescription,
                resumeText=s.resumeText,
                resumeUrl=s.resumeUrl,
                status=s.status,
                rating=s.rating or 0,
                resumeScore=s.resumeScore or 0,
                createdAt=s.createdAt.isoformat(),
                feedback=s.feedback,             # ← now included
                resumeFeedback=s.resumeFeedback, # ← now included
            )
            for s in sessions
        ]

        logger.info(f"Dashboard fetched for user {user.id}: {len(session_items)} sessions")

        return ApiResponse(
            success=True,
            statusCode=200,
            message=f"Retrieved {len(session_items)} sessions",
            data=session_items,
            timestamp=get_timestamp(),
        )

    except InternalServerError as e:
        logger.error(f"Internal error in get_dashboard: {e.detail}", exc_info=True)
        return error_response(e, "Internal server error")

    except Exception as e:
        logger.error(f"Unexpected error in get_dashboard: {e}", exc_info=True)
        return ApiResponse(
            success=False,
            statusCode=500,
            message="Internal server error",
            error="An unexpected error occurred",
            timestamp=get_timestamp(),
        )