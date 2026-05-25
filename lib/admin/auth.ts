export const ADMIN_SESSION_KEY = "titem_admin_session";

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function setAdminLoggedIn(): void {
  localStorage.setItem(ADMIN_SESSION_KEY, "true");
}

export function adminLogout(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
