import Sidebar from "@/components/Sidebar";
import NewTicketForm from "./NewTicketForm";

export default function NewTicketPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Create New Ticket</h1>
            <p className="text-slate-500 text-sm mt-1">Submit a support request or report an issue</p>
          </div>
          <NewTicketForm />
        </div>
      </main>
    </div>
  );
}
