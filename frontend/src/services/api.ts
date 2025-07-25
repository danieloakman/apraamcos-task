import { useMutation, useQuery } from "@tanstack/react-query";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";

let sensitiveAuthToken: string | null = null;
function getAuthToken(): string | null {
  if (sensitiveAuthToken) return sensitiveAuthToken;
  return localStorage.getItem("auth_token");
}

function getAuthHeaders() {
  const token = getAuthToken();
  const headers: any = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export const apiService = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Invalid email or password");
    }

    const data = await response.json();
    localStorage.setItem("auth_token", data.token);
    return data;
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }
    return response.json();
  },

  async updateCurrentUser(data: any) {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to update user");
    }
    return response.json();
  },

  logout(): void {
    localStorage.removeItem("auth_token");
  },

  isAuthenticated(): boolean {
    return getAuthToken() !== null;
  },
};

export const useRequestSensitiveCode = () => {
  return useMutation({
    mutationKey: ["request-code"],
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/sensitive/request`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      console.log(res);
      if (!res.ok) {
        throw new Error(
          `Failed to request code: ${res.status} ${res.statusText}`
        );
      }
    },
  });
};

export const useVerifySensitiveCode = (code?: string) => {
  return useQuery({
    queryKey: ["verify-code", code],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/sensitive/verify`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        throw new Error("Failed to verify code");
      }
      const data = await response.json();
      sensitiveAuthToken = data.token;
      return data;
    },
    enabled: !!code && code.length === 6,
  });
};
