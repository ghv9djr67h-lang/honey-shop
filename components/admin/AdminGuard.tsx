"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/admin/auth";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
    } else {
      setReady(true);
    }
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Ачааллаж байна...</p>
      </div>
    );
  }

  return <>{children}</>;
}
