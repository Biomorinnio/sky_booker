const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "APIError";
  }
}

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

class APIClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken");
    }
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { requiresAuth = false, ...fetchConfig } = config;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (fetchConfig.headers) {
      Object.assign(headers, fetchConfig.headers);
    }

    if (requiresAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined") {
          this.setAccessToken(null);
          localStorage.removeItem("currentUser");
          localStorage.removeItem("refreshToken");
          window.location.href = "/auth/login";
        }
        throw new APIError(
          response.status,
          data?.error?.code || "UNKNOWN_ERROR",
          data?.error?.message || "An error occurred",
          data?.error?.details
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        500,
        "NETWORK_ERROR",
        "Failed to connect to the server"
      );
    }
  }

  async get<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
      requiresAuth,
    });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
      requiresAuth,
    });
  }

  async delete<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      requiresAuth,
    });
  }
}

export const apiClient = new APIClient(API_BASE_URL);
