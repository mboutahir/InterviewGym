/**
 * Standard API Response Types
 * Single source of truth for API response structures
 */

export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T | null;
    error?: string;
    timestamp: string;
}

export interface CreateSessionResponse {
    sessionId: string;
    jobTitle: string;
    createdAt: string;
}

export interface EndSessionResponse {
    interview_feedback: Record<string, unknown>;
    resume_analysis: Record<string, unknown>;
}

export interface DashboardSessionItem {
    id: string;
    jobTitle: string;
    status: string;
    rating: number;
    resumeScore: number;
    createdAt: string;
}
