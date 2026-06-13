import { redirect } from "next/navigation";
import { getSession, canDownloadReports } from "@/lib/auth";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session || !canDownloadReports(session)) redirect("/dashboard");

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Download consolidated ticket reports as CSV</p>
        </div>
        <ReportsClient session={session} />
      </div>
    </div>
  );
}
