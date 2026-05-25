"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { verifyPassword } from "@/app/actions/verify-password";
import { SITE_CONTENT_FIELDS, type SiteContent } from "@/lib/site-content";

const CMS_SESSION_KEY = "titem_cms_session";

type ContentRow = {
  id: keyof SiteContent;
  value: string;
  updated_at?: string;
};

export default function AdminContentPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(CMS_SESSION_KEY) === "true") {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    setLoading(true);
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const ordered = SITE_CONTENT_FIELDS.map((field) => {
          const row = data.find((item: ContentRow) => item.id === field.id);
          return {
            id: field.id,
            value: row?.value ?? "",
            updated_at: row?.updated_at,
          };
        });
        setRows(ordered);
        setDrafts(Object.fromEntries(ordered.map((row) => [row.id, row.value])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ачааллахад алдаа гарлаа"))
      .finally(() => setLoading(false));
  }, [authenticated]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const ok = await verifyPassword(password);
      if (!ok) throw new Error("Нууц үг буруу байна");

      sessionStorage.setItem(CMS_SESSION_KEY, "true");
      setAuthenticated(true);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSave(id: keyof SiteContent) {
    setSavingId(id);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, value: drafts[id] ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Хадгалахад алдаа гарлаа");

      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, value: drafts[id] ?? "" } : row)),
      );
      setMessage(`${SITE_CONTENT_FIELDS.find((f) => f.id === id)?.label ?? id} амжилттай хадгалагдлаа`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSavingId(null);
    }
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f4] px-4">
        <div className="w-full max-w-sm rounded-xl border border-[#e8dfd0] bg-white p-6 shadow-sm">
          <h1 className="font-display text-2xl text-[#1a1208]">ТИТЭМ CMS</h1>
          <p className="mt-1 font-body text-sm text-[#1a1208] opacity-60">Контент засах</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block font-body text-xs uppercase tracking-wide text-[#1a1208] opacity-60">
                Нууц үг
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
              />
            </label>

            {loginError && (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 font-body text-sm text-red-700">
                {loginError}
              </p>
            )}

            <button type="submit" disabled={loginLoading} className="btn-select w-full !min-h-[48px]">
              {loginLoading ? "Шалгаж байна..." : "Нэвтрэх"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] px-4 py-6 text-[#1a1208] sm:py-8">
      <div className="page-wrap mx-auto max-w-2xl space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl">Контент удирдлага</h1>
            <p className="mt-1 font-body text-sm opacity-60">Вэбсайтын текст засах</p>
          </div>
          <Link href="/admin/dashboard" className="font-body text-sm text-[#c8740a] hover:underline">
            Хяналтын самбар →
          </Link>
        </div>

        {error && (
          <p className="rounded border border-red-200 bg-red-50 px-4 py-2 font-body text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded border border-green-200 bg-green-50 px-4 py-2 font-body text-sm text-green-700">
            {message}
          </p>
        )}

        {loading ? (
          <p className="font-body text-sm opacity-60">Ачааллаж байна...</p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => {
              const label = SITE_CONTENT_FIELDS.find((f) => f.id === row.id)?.label ?? row.id;
              const multiline = row.id === "about_text" || row.id === "delivery_text" || row.id === "footer_text";

              return (
                <div key={row.id} className="product-card space-y-3">
                  <label className="block">
                    <span className="field-label">{label}</span>
                    {multiline ? (
                      <textarea
                        rows={3}
                        value={drafts[row.id] ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                        }
                        className="field-input resize-y"
                      />
                    ) : (
                      <input
                        type="text"
                        value={drafts[row.id] ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                        }
                        className="field-input"
                      />
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSave(row.id)}
                    disabled={savingId === row.id}
                    className="btn-select w-full !min-h-[44px] !px-4 !py-2 !text-xs sm:!w-auto"
                  >
                    {savingId === row.id ? "Хадгалж байна..." : "Хадгалах"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
