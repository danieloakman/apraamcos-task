import {
  Query,
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuthStore } from "./authStore";
import { useShallow } from "zustand/react/shallow";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";

export const NAMED_QUERY_KEYS = [
  "login",
  "logout",
  "request-sensitive-code",
  "verify-sensitive-code",
  "current-user",
  "update-current-user",
] as const;
export type NamedQueryKey = (typeof NAMED_QUERY_KEYS)[number];
const createQueryKey = (key: NamedQueryKey, ...extra: unknown[]): QueryKey => [
  key,
  ...extra,
];
const includesQueryKeys =
  (...keys: NamedQueryKey[]) =>
  (q: Query) =>
    keys.some(k => q.queryKey.includes(k));

function getAuthHeaders() {
  const token = useAuthStore.getState().getAuthToken();
  const headers: any = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function fetchWithAuth(
  url: string,
  { headers, ...options }: RequestInit = {}
) {
  const response = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...headers },
  });
  if (response.status === 401) {
    const authStore = useAuthStore.getState();
    if (authStore.sensitiveAuthToken) {
      // Try again without the sensitive auth token:
      authStore.setSensitiveAuthToken(null);
      return fetchWithAuth(url, options);
    } else {
      authStore.clearAllTokens();
    }
  }
  return response;
}

export const useHasAuth = () =>
  useAuthStore(useShallow(s => s.isAuthenticated()));

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: createQueryKey("login"),
    mutationFn: async (params: { email: string; password: string }) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();
      useAuthStore.getState().setAuthToken(data.token);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: includesQueryKeys("current-user"),
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: createQueryKey("logout"),
    mutationFn: async () => {
      useAuthStore.getState().clearAllTokens();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: includesQueryKeys("current-user"),
      });
    },
  });
}

export function useCurrentUser() {
  const hasAuth = useHasAuth();
  return useQuery({
    queryKey: createQueryKey("current-user"),
    queryFn: async () => {
      const response = await fetchWithAuth(`${API_BASE_URL}/users/me`);
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    enabled: hasAuth,
  });
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: createQueryKey("update-current-user"),
    mutationFn: async (data: any) => {
      const response = await fetchWithAuth(`${API_BASE_URL}/users/me`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: includesQueryKeys("current-user"),
      });
    },
  });
}

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
  const queryClient = useQueryClient();
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
      useAuthStore.getState().setSensitiveAuthToken(data.token);
      queryClient.invalidateQueries({
        predicate: includesQueryKeys("current-user"),
      });
      return data;
    },
    enabled: !!code && code.length === 6,
  });
};
