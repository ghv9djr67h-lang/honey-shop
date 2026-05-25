"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isAdminLoggedIn } from "@/lib/admin/auth";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAdminLoggedIn()) router.replace("/admin/dashboard");
  }, [router]);

  if (isAdminLoggedIn()) {
    return null;
  }

  return <AdminLoginForm />;
}
