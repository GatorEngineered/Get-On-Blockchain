"use client";

import { usePathname } from "next/navigation";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
} | null;

// Map pathnames to page titles
const pageTitles: Record<string, string> = {
  "/admin/merchants": "Merchants",
  "/admin/blog": "Blog Posts",
  "/admin/password-reset": "Password Reset",
  "/admin/audit-logs": "Audit Logs",
};

export default function AdminHeader({ admin }: { admin: AdminUser }) {
  const pathname = usePathname();

  // Get page title from pathname
  const pageTitle = pathname ? (pageTitles[pathname] || "Dashboard") : "Dashboard";

  // Format role for display
  const roleDisplay = admin?.role.replace("_", " ") || "";

  return (
    <header className="admin-header">
      <h1 className="admin-header-title">{pageTitle}</h1>

      {admin && (
        <div className="admin-header-user">
          <span>{admin.fullName}</span>
          <span className="admin-role-badge">{roleDisplay}</span>
        </div>
      )}
    </header>
  );
}
