"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
} | null;

const navLinks = [
  { href: "/admin/merchants", label: "Merchants", roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/admin/blog", label: "Blog Posts", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { href: "/admin/staff", label: "Staff", roles: ["SUPER_ADMIN"] },
  { href: "/admin/password-reset", label: "Password Reset", roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/admin/audit-logs", label: "Audit Logs", roles: ["SUPER_ADMIN"] },
];

export default function AdminNav({ admin }: { admin: AdminUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Filter nav links based on admin role
  const visibleLinks = navLinks.filter((link) =>
    admin ? link.roles.includes(admin.role) : false
  );

  return (
    <nav className="admin-nav">
      <div className="admin-nav-brand">
        Admin Dashboard
      </div>

      <ul className="admin-nav-list">
        {visibleLinks.map((link) => {
          const isActive = pathname?.startsWith(link.href);
          return (
            <li key={link.href} className="admin-nav-item">
              <Link
                href={link.href}
                className={`admin-nav-link${isActive ? " active" : ""}`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="admin-nav-footer">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="admin-logout-btn"
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </nav>
  );
}
