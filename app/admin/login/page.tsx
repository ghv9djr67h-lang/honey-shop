"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminLogin, isAdminLoggedIn } from "@/lib/admin/auth";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminLoggedIn()) router.replace("/admin");
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (adminLogin(username, password)) {
      router.replace("/admin");
    } else {
      setError("Нэр эсвэл нууц үг буруу байна");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-amber-100 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-lg font-black text-white">
            T
          </div>
          <h1 className="text-xl font-bold text-gray-900">ТИТЭМ Админ</h1>
          <p className="mt-1 text-sm text-gray-500">Нэвтрэх</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Хэрэглэгчийн нэр</span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Нууц үг</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
          >
            {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </button>
        </form>
      </div>
    </div>
  );
}
