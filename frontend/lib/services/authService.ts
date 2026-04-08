import { apiClient, APIError } from "../api/client";
import {
  LoginRequestDTO,
  LoginResponseDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
  UserDTO,
} from "@/types/dto";
import { UserRole } from "@/types/database";

class AuthService {
  private listeners: Set<() => void> = new Set();

  onChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  async login(credentials: LoginRequestDTO): Promise<LoginResponseDTO> {
    try {
      const response = await apiClient.post<LoginResponseDTO>(
        "/auth/login",
        credentials
      );
      apiClient.setAccessToken(response.accessToken);
      localStorage.setItem("currentUser", JSON.stringify(response.user));
      localStorage.setItem("refreshToken", response.refreshToken);
      this.notify();
      return response;
    } catch (err) {
      if (err instanceof APIError) {
        if (err.code === "INVALID_CREDENTIALS") {
          throw new Error("Неверный email или пароль");
        }
        throw new Error(err.message);
      }
      throw err;
    }
  }

  async register(data: RegisterRequestDTO): Promise<RegisterResponseDTO> {
    try {
      return await apiClient.post<RegisterResponseDTO>("/auth/register", data);
    } catch (err) {
      if (err instanceof APIError) {
        if (err.code === "EMAIL_TAKEN") {
          throw new Error("Пользователь с таким email уже существует");
        }
        throw new Error(err.message);
      }
      throw err;
    }
  }

  async logout(): Promise<void> {
    apiClient.setAccessToken(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("refreshToken");
    this.notify();
  }

  getCurrentUser(): UserDTO | null {
    if (typeof window === "undefined") return null;

    const userStr = localStorage.getItem("currentUser");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!apiClient.getAccessToken();
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}

export const authService = new AuthService();
