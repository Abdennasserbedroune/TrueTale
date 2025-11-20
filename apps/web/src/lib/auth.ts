import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const authAPI = axios.create({
  baseURL: `${API_URL}/api/auth`,
  withCredentials: true,
});

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  role?: "reader" | "writer";
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: "reader" | "writer";
  profile?: string;
  bio?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function register(data: RegisterData) {
  const response = await authAPI.post("/register", data);
  return response.data;
}

export async function verify(token: string) {
  const response = await authAPI.post("/verify", { token });
  return response.data;
}

export async function login(data: LoginData) {
  const response = await authAPI.post("/login", data);
  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
    authAPI.defaults.headers.common["Authorization"] = `Bearer ${response.data.accessToken}`;
  }
  return response.data;
}

export async function logout() {
  await authAPI.post("/logout");
  localStorage.removeItem("accessToken");
  delete authAPI.defaults.headers.common["Authorization"];
}

export async function me(): Promise<{ user: User }> {
  const token = localStorage.getItem("accessToken");
  if (token) {
    authAPI.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  const response = await authAPI.get("/me");
  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await authAPI.post("/forgot", { email });
  return response.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await authAPI.post("/reset", { token, newPassword });
  return response.data;
}

export async function refreshToken() {
  const response = await authAPI.post("/refresh");
  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
    authAPI.defaults.headers.common["Authorization"] = `Bearer ${response.data.accessToken}`;
  }
  return response.data;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setAccessToken(token: string) {
  localStorage.setItem("accessToken", token);
  authAPI.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshToken();
        return authAPI(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        delete authAPI.defaults.headers.common["Authorization"];
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
