
export type SessionStatus = "SETUP" | "IN_PROGRESS" | "COMPLETE";

export interface InterviewFeedback {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
}

export interface ResumeFeedback {
    score: number;
    feedback: string;
    keywords_missing: string[];
}

export interface InterviewSession {
    id: string;
    userId: string;
    jobTitle: string;
    jobDescription: string;
    resumeText: string;
    resumeUrl: string;
    status: SessionStatus;
    rating: number;
    feedback: InterviewFeedback | string;
    resumeScore: number;
    resumeFeedback: ResumeFeedback | string;
    createdAt: string;
    updatedAt?: string;
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

export interface CreateSessionFormData {
    jobTitle: string;
    jobDescription: string;
    firstName: string;
    lastName: string;
    email: string;
    resumeFile: File;
}

export interface ApiError {
    status: "error";
    statusCode: number;
    message: string;
    detail?: string;
}
