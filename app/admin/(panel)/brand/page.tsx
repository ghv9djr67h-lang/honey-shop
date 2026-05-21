"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_BRAND_SETTINGS, type BrandSettings } from "@/lib/admin/settings-defaults";
import { uploadImage } from "@/lib/admin/utils";

export default function AdminBrandPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings?key=brand")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => setError("Тохиргоо авахад алдаа гарлаа"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "brand", value: settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Амжилттай хадгалагдлаа");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(file, "product-images");
      setSettings((prev) => ({ ...prev, logo_url: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Лого оруулахад алдаа гарлаа");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (loading) return <p className="text-gray-500">Ачааллаж байна...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Брэндийн тохиргоо</h1>

      {message && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Брэндийн нэр</span>
          <input
            type="text"
            required
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Тайлбар / Tagline</span>
          <input
            type="text"
            required
            value={settings.tagline}
            onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            className={inputClass}
          />
        </label>

        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">Лого</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />

          <div className="flex items-center gap-4">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt="Лого"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-200"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-600">
                T
              </div>
            )}
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-amber-300 hover:text-amber-700"
            >
              {uploading ? "Оруулж байна..." : "Лого солих"}
            </button>
            {settings.logo_url && (
              <button
                type="button"
                onClick={() => setSettings({ ...settings, logo_url: "" })}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Устгах
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
        >
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100";
