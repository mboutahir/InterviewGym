import {
    InterviewSession,
    InterviewFeedback,
    ResumeFeedback,
    SessionStatus
} from "@/app/types/interview";

/**
 * Safe type guards - ensure data matches expected structure
 */

export function parseInterviewFeedback(data: unknown): InterviewFeedback | null {
    try {
        if (typeof data === "string") {
            data = JSON.parse(data);
        }

        if (!data || typeof data !== "object") {
            return null;
        }

        const obj = data as Record<string, unknown>;

        // Validate all required fields exist and have correct types
        if (
            typeof obj.score !== "number" ||
            typeof obj.feedback !== "string" ||
            !Array.isArray(obj.strengths) ||
            !Array.isArray(obj.improvements)
        ) {
            return null;
        }

        return {
            score: obj.score,
            feedback: obj.feedback,
            strengths: obj.strengths as string[],
            improvements: obj.improvements as string[]
        };
    } catch (error) {
        console.error("Failed to parse interview feedback:", error);
        return null;
    }
}

export function parseResumeFeedback(data: unknown): ResumeFeedback | null {
    try {
        if (typeof data === "string") {
            data = JSON.parse(data);
        }

        if (!data || typeof data !== "object") {
            return null;
        }

        const obj = data as Record<string, unknown>;

        if (
            typeof obj.score !== "number" ||
            typeof obj.feedback !== "string" ||
            !Array.isArray(obj.keywords_missing)
        ) {
            return null;
        }

        return {
            score: obj.score,
            feedback: obj.feedback,
            keywords_missing: obj.keywords_missing as string[]
        };
    } catch (error) {
        console.error("Failed to parse resume feedback:", error);
        return null;
    }
}

/**
 * Convert raw session data to properly typed InterviewSession
 * This ensures feedback and resumeFeedback are parsed if they're strings
 */
export function normalizeSession(data: any): InterviewSession | null {
    if (!isValidSession(data)) {
        return null;
    }

    // Parse feedback if it's a string
    let feedback: InterviewFeedback | string = data.feedback;
    if (typeof data.feedback === "string") {
        const parsed = parseInterviewFeedback(data.feedback);
        if (parsed) {
            feedback = parsed;
        }
    }

    // Parse resumeFeedback if it's a string
    let resumeFeedback: ResumeFeedback | string = data.resumeFeedback;
    if (typeof data.resumeFeedback === "string") {
        const parsed = parseResumeFeedback(data.resumeFeedback);
        if (parsed) {
            resumeFeedback = parsed;
        }
    }

    return {
        id: data.id,
        userId: data.userId,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        resumeText: data.resumeText,
        resumeUrl: data.resumeUrl,
        status: data.status as SessionStatus,
        rating: data.rating,
        feedback,
        resumeScore: data.resumeScore,
        resumeFeedback,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
    };
}

export function isValidSession(data: unknown): data is InterviewSession {
    if (!data || typeof data !== "object") {
        return false;
    }

    const obj = data as Record<string, unknown>;

    // Check all required fields
    const requiredFields = [
        "id",
        "userId",
        "jobTitle",
        "jobDescription",
        "resumeText",
        "resumeUrl",
        "status",
        "createdAt"
    ];

    for (const field of requiredFields) {
        if (!(field in obj)) {
            return false;
        }
    }

    // Validate status enum
    const validStatuses: SessionStatus[] = ["SETUP", "IN_PROGRESS", "COMPLETE"];
    if (!validStatuses.includes(obj.status as SessionStatus)) {
        return false;
    }

    return true;
}

export function isValidSessionStatus(value: unknown): value is SessionStatus {
    return value === "SETUP" || value === "IN_PROGRESS" || value === "COMPLETE";
}
