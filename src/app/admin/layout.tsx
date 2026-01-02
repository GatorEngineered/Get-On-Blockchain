"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminNav from "./components/AdminNav";
import AdminHeader from "./components/AdminHeader";
import "./admin.css";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Skip auth check for login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    const verifyAuth = async () => {
      try {
        const res = await fetch("/api/admin/auth/verify", {
          credentials: "include",
        });

        if (!res.ok) {
          router.push("/admin/login");
          return;
        }

        const data = await res.json();
        setAdmin(data.admin);
      } catch (error) {
        console.error("Auth verification error:", error);
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [router, isLoginPage, pathname]);

  // Show loading state while verifying auth
  if (isLoading) {
    return (
      <div className="admin-loading">
        <p>Loading...</p>
      </div>
    );
  }

  // Login page doesn't need the admin layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Authenticated admin layout
  return (
    <div className="admin-container">
      <AdminNav admin={admin} />
      <div className="admin-main">
        <AdminHeader admin={admin} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
