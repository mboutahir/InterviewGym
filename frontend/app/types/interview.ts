/**
 * Type definitions for Interview module
 * Single source of truth for data structures
 */

// ========== API Response Types ==========

export type SessionStatus = "SETUP" | "IN_PROGRESS" | "COMPLETE";

export interface InterviewFeedback {
    score: number;  // 0-10
    feedback: string;  // Summary
    strengths: string[];  // What they did well
    improvements: string[];  // Areas to improve
}

export interface ResumeFeedback {
    score: number;  // 0-100 (%)
    feedback: string;  // Summary
    keywords_missing: string[];  // Keywords from job description not in resume
}

export interface InterviewSession {
    id: string;
    userId: string;
    jobTitle: string;
    jobDescription: string;
    resumeText: string;
    resumeUrl: string;
    status: SessionStatus;
    rating: number;  // Interview score (0-10)
    feedback: InterviewFeedback | string;  // Can be JSON string or parsed object
    resumeScore: number;  // Resume match (0-100)
    resumeFeedback: ResumeFeedback | string;  // Can be JSON string or parsed object
    createdAt: string;  // ISO date string
    updatedAt?: string;  // ISO date string (optional)
}

export interface CreateSessionResponse {
    status: "success" | "error";
    sessionId: string;
}

export interface DashboardResponse {
    status: "success" | "error";
    data: InterviewSession[];
    error?: string;
}

// ========== UI State Types ==========

export type InterviewUIState =
    | "idle"
    | "listening"
    | "processing"
    | "playing"
    | "ending"
    | "complete"
    | "error";

export interface InterviewPageState {
    currentState: InterviewUIState;
    userMessage: string;
    aiResponse: string;
    audioUrl: string | null;
    error: string | null;
    messageHistory: Array<{
        role: "user" | "assistant";
        content: string;
    }>;
}

// ========== Form Types ==========

export interface CreateSessionFormData {
    jobTitle: string;
    jobDescription: string;
    firstName: string;
    lastName: string;
    email: string;
    resumeFile: File;
}

// ========== API Error Types ==========

export interface ApiError {
    status: "error";
    statusCode: number;
    message: string;
    detail?: string;
}
