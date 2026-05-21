export const ADMIN_SESSION_KEY = "titem_admin_session";
export const ADMIN_USERNAME = "enhmaa";
export const ADMIN_PASSWORD = "112233";

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function adminLogin(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_SESSION_KEY, "true");
    return true;
  }
  return false;
}

export function adminLogout(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
