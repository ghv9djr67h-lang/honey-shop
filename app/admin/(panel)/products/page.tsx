"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_PRODUCT_SETTINGS, type ProductSettings } from "@/lib/admin/settings-defaults";
import { formatMNT, uploadImage } from "@/lib/admin/utils";

export default function AdminProductsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<ProductSettings>(DEFAULT_PRODUCT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings?key=product")
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
        body: JSON.stringify({ key: "product", value: settings }),
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadImage(file, "product-images");
        urls.push(url);
      }
      setSettings((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Зураг оруулахад алдаа гарлаа");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setSettings((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  if (loading) return <p className="text-gray-500">Ачааллаж байна...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Бүтээгдэхүүний тохиргоо</h1>

      {message && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Бүтээгдэхүүний нэр</span>
          <input
            type="text"
            required
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Тайлбар</span>
          <textarea
            required
            rows={3}
            value={settings.description}
            onChange={(e) => setSettings({ ...settings, description: e.target.value })}
            className={`${inputClass} resize-none`}
          />
        </label>

        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">Үнэ</p>
          <div className="grid grid-cols-3 gap-3">
            {(["1", "2", "3"] as const).map((kg) => (
              <label key={kg} className="block">
                <span className="mb-1 block text-xs text-gray-500">{kg}кг (₮)</span>
                <input
                  type="number"
                  required
                  min={0}
                  value={settings.prices[kg]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      prices: { ...settings.prices, [kg]: Number(e.target.value) },
                    })
                  }
                  className={inputClass}
                />
                <span className="mt-0.5 block text-xs text-amber-600">
                  {formatMNT(settings.prices[kg])}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">Зургууд</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border-2 border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 transition hover:border-amber-300 hover:text-amber-700 w-full"
          >
            {uploading ? "Оруулж байна..." : "+ Зураг нэмэх"}
          </button>

          {settings.images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {settings.images.map((url, i) => (
                <div key={url} className="group relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
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
