const TOKEN_KEY = "rachaplus:token";
const USERNAME_KEY = "rachaplus:username";

export const DEMO_TOKEN = "rachaplus-demo-token";
export const DEMO_EMAIL = "demo@rachaplus.com";
export const DEMO_PASSWORD = "Demo1234";
export const DEMO_USERNAME = "demo_player";

export function isDemoToken(token?: string | null): boolean {
  return token === DEMO_TOKEN;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USERNAME_KEY);
}

export function setUsername(username: string) {
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  // Limpeza de chaves legadas caso existam
  localStorage.removeItem("token");
  localStorage.removeItem("username");
}