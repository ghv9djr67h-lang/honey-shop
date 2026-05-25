"use server";

function getAdminCredentials() {
  return {
    username: (process.env.ADMIN_USERNAME ?? "enhmaa").trim(),
    password: (process.env.ADMIN_PASSWORD ?? "112233").trim(),
  };
}

export async function verifyAdminLogin(username: string, password: string) {
  const { username: expectedUsername, password: expectedPassword } = getAdminCredentials();
  return username.trim() === expectedUsername && password === expectedPassword;
}

export async function verifyPassword(password: string) {
  const { password: expectedPassword } = getAdminCredentials();
  return password === expectedPassword;
}
