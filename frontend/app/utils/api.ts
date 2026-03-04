/**
 * Centralized API client with consistent response handling
 * All API calls go through this to ensure uniform error handling
 */

import { ApiResponse } from "@/app/types/api";

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public details?: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * Generic API call wrapper - handles all response standardization
 * @template T - The type of data expected in the response
 * @param url - Endpoint URL
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Parsed and validated response data
 */
async function apiCall<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    try {
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
            ...options,
        });

        const data: ApiResponse<T> = await response.json();

        // Check success flag first
        if (!data.success) {
            throw new ApiError(
                data.statusCode,
                data.message || "API request failed",
                data.error
            );
        }

        // Ensure data exists
        if (data.data === null || data.data === undefined) {
            throw new ApiError(
                data.statusCode,
                "No data in response",
                "Server returned success but no data"
            );
        }

        return data.data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (error instanceof SyntaxError) {
            throw new ApiError(500, "Invalid JSON response", error.message);
        }

        if (error instanceof TypeError) {
            throw new ApiError(0, "Network error", error.message);
        }

        throw new ApiError(500, "Unknown error", String(error));
    }
}

/**
 * GET request helper
 */
export async function apiGet<T>(url: string, headers?: HeadersInit): Promise<T> {
    return apiCall<T>(url, { method: "GET", headers });
}

/**
 * POST request helper
 */
export async function apiPost<T>(
    url: string,
    body?: Record<string, unknown>
): Promise<T> {
    return apiCall<T>(url, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
    });
}

/**
 * POST with FormData (for file uploads)
 */
export async function apiPostForm<T>(
    url: string,
    formData: FormData
): Promise<T> {
    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData,
        });

        const data: ApiResponse<T> = await response.json();

        if (!data.success) {
            throw new ApiError(data.statusCode, data.message, data.error);
        }

        if (!data.data) {
            throw new ApiError(data.statusCode, "No data in response");
        }

        return data.data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Form upload failed", String(error));
    }
}

/**
 * PUT request helper
 */
export async function apiPut<T>(
    url: string,
    body?: Record<string, unknown>
): Promise<T> {
    return apiCall<T>(url, {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
    });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(url: string): Promise<T> {
    return apiCall<T>(url, { method: "DELETE" });
}

export { apiCall };
