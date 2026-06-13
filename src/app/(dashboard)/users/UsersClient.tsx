"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Pencil, UserX, UserCheck, X } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";
import { getDeptLabel } from "@/lib/utils";

interface User {
  id: string; name: string; email: string; role: string;
  department: string | null; mobile: string | null; isActive: boolean; createdAt: Date | string;
}
interface Session { id: string; role: string; department: string | null; }

const ROLE_LABELS: Record<string, string> = { SUPER_ADMIN: "Super Admin", DEPT_HEAD: "Dept Head", MEMBER: "Member" };
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  DEPT_HEAD: "bg-blue-100 text-blue-800",
  MEMBER: "bg-slate-100 text-slate-700",
};

export default function UsersClient({ users: initial, session }: { users: User[]; session: Session }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget;
    const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "";

    const body: Record<string, string> = {
      name: get("name"), email: get("email"),
      password: get("password") || "GDV@2026!",
      mobile: get("mobile"),
    };
    if (session.role === "SUPER_ADMIN") { body.role = get("role"); body.department = get("department"); }

    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
    setShowForm(false);
    router.refresh();
    setLoading(false);
  }

  async function toggleActive(user: User) {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    router.refresh();
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    if (!editUser) return;
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "";
    const body: Record<string, string> = { name: get("editName"), mobile: get("editMobile") };
    const pw = get("editPassword");
    if (pw) body.password = pw;
    await fetch(`/api/users/${editUser.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setEditUser(null);
    router.refresh();
    setLoading(false);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">{users.length} user{users.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Add New Member</h2>
              <button onClick={() => { setShowForm(false); setError(""); }}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <input name="name" required placeholder="Full Name *" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="email" type="email" required placeholder="Email *" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="mobile" type="tel" placeholder="Mobile (optional)" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="password" type="password" placeholder="Password (default: GDV@2026!)" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {session.role === "SUPER_ADMIN" && (
                <>
                  <select name="role" defaultValue="MEMBER" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="MEMBER">Member</option>
                    <option value="DEPT_HEAD">Department Head</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                  <select name="department" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">No Department</option>
                    {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </>
              )}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Creating..." : "Create Member"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Edit {editUser.name}</h2>
              <button onClick={() => setEditUser(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <input name="editName" required defaultValue={editUser.name} placeholder="Full Name *" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="editMobile" defaultValue={editUser.mobile ?? ""} placeholder="Mobile" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="editPassword" type="password" placeholder="New password (leave blank to keep current)" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Name", "Email", "Role", "Department", "Status", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className={`${!user.isActive ? "opacity-50" : ""}`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      {user.mobile && <p className="text-xs text-slate-400">{user.mobile}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-600 text-xs">{user.email}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-600 text-xs">{user.department ? getDeptLabel(user.department) : "—"}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${user.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {user.id !== session.id && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditUser(user)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleActive(user)} className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                        {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No members yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
