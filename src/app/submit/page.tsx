import SubmitTicketForm from "./SubmitTicketForm";
import { Building2 } from "lucide-react";

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">GDV Holdings Help Desk</p>
            <p className="text-slate-400 text-xs">Submit a Support Ticket</p>
          </div>
          <a href="/login" className="ml-auto text-sm text-blue-600 font-medium hover:underline">Staff Login →</a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Submit a Concern or Request</h1>
          <p className="text-slate-500 text-sm mt-1">
            Fill out the form below and our team will respond within the defined SLA timeframe.
          </p>
        </div>
        <SubmitTicketForm />
      </div>
    </div>
  );
}
