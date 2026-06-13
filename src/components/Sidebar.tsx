"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Building2,
  Users,
  FileDown,
  Bell,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

interface NavUser {
  name: string;
  email: string;
  role: string;
}

interface Props {
  user: NavUser;
  unreadCount?: number;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  DEPT_HEAD: "Department Head",
  MEMBER: "Staff Member",
};

export default function Sidebar({ user, unreadCount = 0 }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const canManageUsers = user.role === "SUPER_ADMIN" || user.role === "DEPT_HEAD";
  const canDownloadReports = user.role === "SUPER_ADMIN" || user.role === "DEPT_HEAD";

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/tickets", icon: Ticket, label: "Tickets" },
    { href: "/tickets/new", icon: PlusCircle, label: "New Ticket" },
    ...(canManageUsers ? [{ href: "/users", icon: Users, label: "Team Members" }] : []),
    ...(canDownloadReports ? [{ href: "/reports", icon: FileDown, label: "Reports" }] : []),
    { href: "/notifications", icon: Bell, label: "Notifications", badge: unreadCount },
  ];

  return (
    <aside className="w-60 min-h-screen bg-slate-900 text-white flex flex-col shrink-0">
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate">GDV Holdings</p>
            <p className="text-slate-400 text-xs">Help Desk</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label, badge }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(href)
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge != null && badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700 space-y-1">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-400 truncate">{ROLE_LABELS[user.role] ?? user.role}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
