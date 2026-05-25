"use client";

import { useEffect, useState } from "react";
import { SITE_CONTENT_FIELDS, type SiteContent } from "@/lib/site-content-types";

type ContentRow = {
  id: keyof SiteContent;
  value: string;
};

export default function AdminContentPage() {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const ordered = SITE_CONTENT_FIELDS.map((field) => {
          const row = data.find((item: ContentRow) => item.id === field.id);
          return {
            id: field.id,
            value: row?.value ?? "",
          };
        });
        setRows(ordered);
        setDrafts(Object.fromEntries(ordered.map((row) => [row.id, row.value])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ачааллахад алдаа гарлаа"))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Контент удирдлага</h1>
        <p className="mt-1 text-sm text-gray-500">Вэбсайтын текст засах</p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Ачааллаж байна...</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const label = SITE_CONTENT_FIELDS.find((f) => f.id === row.id)?.label ?? row.id;
            const multiline =
              row.id === "about_text" || row.id === "delivery_text" || row.id === "footer_text";

            return (
              <div
                key={row.id}
                className="space-y-3 rounded-xl border border-gray-200 bg-white p-5"
              >
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
                  {multiline ? (
                    <textarea
                      rows={3}
                      value={drafts[row.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      className={inputClass}
                    />
                  ) : (
                    <input
                      type="text"
                      value={drafts[row.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      className={inputClass}
                    />
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => handleSave(row.id)}
                  disabled={savingId === row.id}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                >
                  {savingId === row.id ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100";
