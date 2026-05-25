"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/admin/auth";
import { SITE_CONTENT_FIELDS, type SiteContent } from "@/lib/site-content";

type ContentRow = {
  id: keyof SiteContent;
  value: string;
  updated_at?: string;
};

export default function AdminContentPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;

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
  }, [ready]);

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

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f4]">
        <p className="font-body text-sm text-[#1a1208] opacity-60">Ачааллаж байна...</p>
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
