from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Annotated, Optional, Generic, TypeVar, List, ClassVar
import re


class CreateSessionRequest(BaseModel):
    """Validated request for creating an interview session"""

    jobTitle: Annotated[
        str,
        Field(min_length=1, max_length=200, description="Job title (1-200 characters)"),
    ]

    jobDescription: Annotated[
        str,
        Field(
            min_length=10,
            max_length=5000,
            description="Full job description (10-5000 characters)",
        ),
    ]

    first_name: Annotated[
        str,
        Field(min_length=1, max_length=50, description="First name (1-50 characters)"),
    ]

    last_name: Annotated[
        str,
        Field(min_length=1, max_length=50, description="Last name (1-50 characters)"),
    ]

    clerk_id: str

    @field_validator("jobTitle", "jobDescription")
    @classmethod
    def no_special_chars(cls, v):
        dangerous_chars = ["<", ">", "{", "}", "$", "`"]
        if any(char in v for char in dangerous_chars):
            raise ValueError("Input contains invalid characters")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def alpha_only(cls, v):
        if not re.match(r"^[a-zA-Z\s\-']{1,50}$", v):
            raise ValueError("Names can only contain letters, spaces, and hyphens")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "jobTitle": "Senior Python Engineer",
                "jobDescription": "We're looking for a senior Python engineer...",
                "first_name": "Mohammed",
                "last_name": "Boutahir",
                "email": "mohammed@example.com",
            }
        }
    }


class FileUploadRequest(BaseModel):
    """Validated file upload"""

    MAX_FILE_SIZE: ClassVar[int] = 5 * 1024 * 1024
    ALLOWED_EXTENSIONS: ClassVar[set] = {"pdf"}

    filename: str
    file_size: int
    content_type: str

    @field_validator("file_size")
    @classmethod
    def validate_file_size(cls, v):
        if v > cls.MAX_FILE_SIZE:
            raise ValueError(
                f"File size must be under {cls.MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        if v == 0:
            raise ValueError("File cannot be empty")
        return v

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v):
        if v not in ["application/pdf"]:
            raise ValueError("Only PDF files are allowed")
        return v

    @field_validator("filename")
    @classmethod
    def validate_filename(cls, v):
        if not v.lower().endswith(".pdf"):
            raise ValueError("File must have .pdf extension")
        if "/" in v or "\\" in v or ".." in v:
            raise ValueError("Invalid filename")
        return v


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Standard API response wrapper for all endpoints"""

    success: bool
    statusCode: int
    message: str
    data: Optional[T] = None
    error: Optional[str] = None
    timestamp: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "statusCode": 200,
                "message": "Request successful",
                "data": {},
                "error": None,
                "timestamp": "2026-03-03T12:00:00Z",
            }
        }
    }


class CreateSessionResponse(BaseModel):
    sessionId: str
    jobTitle: str
    createdAt: str


class EndSessionResponse(BaseModel):
    interview_feedback: dict
    resume_analysis: dict


class DashboardSessionItem(BaseModel):
    id: str
    userId: str
    jobTitle: str
    jobDescription: str
    resumeText: str
    resumeUrl: str
    status: str
    rating: int
    resumeScore: int
    createdAt: str
    feedback: Optional[str] = None        # Interview feedback JSON string
    resumeFeedback: Optional[str] = None  # Resume feedback JSON string