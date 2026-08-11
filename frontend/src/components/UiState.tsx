import { AlertCircle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="panel flex min-h-40 items-center justify-center"
      role="status"
    >
      <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-forest/20 border-t-forest" />
      <span className="text-black/55">{label}</span>
    </div>
  );
}
export function ErrorState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"
      role="alert"
    >
      <div className="flex gap-3">
        <AlertCircle className="shrink-0" size={20} />
        <div>
          <p className="font-semibold">Something needs attention</p>
          <p className="mt-1 text-sm">{message}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel py-12 text-center">
      <Inbox className="mx-auto text-forest" />
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-black/50">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
