/**
 * Web Baca Novel Publik - Centralized API Client
 * Zero direct Supabase access. All queries route through FastAPI REST API.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((tokenRefreshed: boolean) => void)[] = [];

function onTokenRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (tokenRefreshed: boolean) => void) {
  refreshSubscribers.push(cb);
}

export async function apiClient<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers, ...restOptions } = options;

  let url = `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {};
  if (!(restOptions.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const mergedOptions: RequestInit = {
    ...restOptions,
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
    credentials: "include", // Mandatory: Send HttpOnly session cookies
  };

  let response: Response;
  try {
    response = await fetch(url, mergedOptions);
  } catch (networkErr: any) {
    throw new ApiError(0, "Gagal terhubung ke server. Periksa koneksi jaringan Anda.");
  }

  // Handle 401 Unauthorized for Staff Silent Refresh
  if (response.status === 401 && !endpoint.includes("/auth/staff/login") && !endpoint.includes("/auth/staff/refresh")) {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/staff")) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/api/auth/staff/refresh`, {
            method: "POST",
            credentials: "include",
          });
          if (refreshRes.ok) {
            onTokenRefreshed(true);
            isRefreshing = false;
            // Retry initial request
            return apiClient<T>(endpoint, options);
          } else {
            onTokenRefreshed(false);
            isRefreshing = false;
            if (window.location.pathname !== "/staff/login" && window.location.pathname !== "/staff/verify-otp") {
              window.location.href = "/staff/login";
            }
          }
        } catch {
          onTokenRefreshed(false);
          isRefreshing = false;
        }
      } else {
        // Wait for active refresh to settle
        const refreshPromise = new Promise<boolean>((resolve) => {
          addRefreshSubscriber((success) => resolve(success));
        });
        const success = await refreshPromise;
        if (success) {
          return apiClient<T>(endpoint, options);
        }
      }
    }
  }

  if (!response.ok) {
    let errorDetail = "Terjadi kesalahan pada server.";
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new ApiError(response.status, errorDetail);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
