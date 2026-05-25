"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminLogout } from "@/lib/admin/auth";

const NAV = [
  { href: "/admin/dashboard", label: "Хяналтын самбар" },
  { href: "/admin/orders", label: "Захиалгууд" },
  { href: "/admin/products", label: "Бүтээгдэхүүн" },
  { href: "/admin/brand", label: "Брэнд" },
  { href: "/admin/content", label: "Контент" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
  if (href === "/admin/content") return pathname === "/admin/content";
  return pathname.startsWith(href);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    adminLogout();
    router.replace("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="relative hidden min-h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="border-b border-gray-100 px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-600">Админ</p>
          <p className="text-lg font-bold text-gray-900">ТИТЭМ</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-amber-50 text-amber-800"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
          >
            Гарах
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <p className="font-bold text-gray-900">ТИТЭМ Админ</p>
          <button type="button" onClick={handleLogout} className="text-sm text-gray-500">
            Гарах
          </button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-2 py-2 md:hidden">
          {NAV.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-amber-100 text-amber-800" : "text-gray-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
