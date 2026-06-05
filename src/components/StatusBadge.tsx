import { getStatusConfig, getPriorityConfig } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config = getPriorityConfig(priority);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
