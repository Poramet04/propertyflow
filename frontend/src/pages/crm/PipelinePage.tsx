import { CalendarClock, GripVertical, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { leadApi } from "../../services/api";
import type { Lead, LeadPriority, LeadStatus } from "../../types";
import { money } from "../../utils/finance";
import { LoadingState } from "../../components/UiState";

const stages: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "VIEWING",
  "NEGOTIATION",
  "BOOKING",
  "CLOSED",
  "LOST",
];
const priorityStyle: Record<LeadPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH: "bg-amber-100 text-amber-800",
  HOT: "bg-red-100 text-red-700 ring-1 ring-red-200",
};

export default function PipelinePage() {
  const { token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  useEffect(() => {
    if (token)
      leadApi
        .list(token)
        .then(setLeads)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, [token]);
  const move = async (id: string, status: LeadStatus) => {
    if (!token) return;
    const before = leads.find((l) => l.id === id);
    if (!before || before.status === status) return;
    setError("");
    setUpdating((x) => [...x, id]);
    setLeads((x) => x.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      const updated = await leadApi.status(token, id, status);
      setLeads((x) => x.map((l) => (l.id === id ? updated : l)));
    } catch (e) {
      setLeads((x) => x.map((l) => (l.id === id ? before : l)));
      setError(
        e instanceof Error
          ? `${e.message}. The card was returned to ${before.status}.`
          : "Could not update status",
      );
    } finally {
      setUpdating((x) => x.filter((v) => v !== id));
      setDragging(null);
    }
  };
  if (loading) return <LoadingState label="Loading sales pipeline..." />;
  return (
    <>
      <p className="eyebrow">Sales workflow</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mt-2 text-4xl font-bold">Pipeline</h1>
          <p className="mt-2 text-sm text-black/45">
            Drag cards between stages. Every successful move is saved to
            PostgreSQL.
          </p>
        </div>
        <span className="text-sm text-black/45">{leads.length} leads</span>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      <div className="mt-7 flex gap-4 overflow-x-auto pb-6">
        {stages.map((stage) => (
          <section
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragging && move(dragging, stage)}
            key={stage}
            className={`w-[310px] shrink-0 rounded-2xl p-3 ${dragging ? "bg-forest/[.06]" : "bg-black/[.035]"}`}
          >
            <div className="flex justify-between px-1 py-2">
              <h2 className="font-bold">{stage}</h2>
              <span className="rounded-full bg-white px-2 text-sm">
                {leads.filter((l) => l.status === stage).length}
              </span>
            </div>
            <div className="grid gap-3">
              {leads
                .filter((l) => l.status === stage)
                .map((l) => (
                  <article
                    draggable={!updating.includes(l.id)}
                    onDragStart={() => setDragging(l.id)}
                    onDragEnd={() => setDragging(null)}
                    className={`rounded-2xl bg-white p-4 shadow-sm transition ${dragging === l.id ? "opacity-50" : updating.includes(l.id) ? "opacity-65" : ""}`}
                    key={l.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        className="font-bold hover:text-forest"
                        to={`/crm/leads/${l.id}`}
                      >
                        {l.customer.name}
                      </Link>
                      <GripVertical
                        size={17}
                        className="cursor-grab text-black/25"
                      />
                    </div>
                    <p className="mt-1 text-sm text-black/50">
                      {l.property.title}
                    </p>
                    <p className="mt-1 text-xs text-black/40">
                      {money(l.property.price)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-bold ${priorityStyle[l.priority]}`}
                      >
                        {l.priority}
                      </span>
                      <span className="rounded-full bg-black/[.04] px-2 py-1 text-[11px]">
                        {l.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold">
                      Budget {l.budget ? money(l.budget) : "Not provided"}
                    </p>
                    <p className="mt-2 text-xs text-black/45">
                      Agent: {l.assignedAgent.name}
                    </p>
                    {l.nextFollowUpAt && !l.followUpCompletedAt && (
                      <p
                        className={`mt-2 flex items-center gap-1 text-xs ${new Date(l.nextFollowUpAt) < new Date() ? "font-bold text-red-600" : "text-black/50"}`}
                      >
                        <CalendarClock size={13} />
                        {new Date(l.nextFollowUpAt).toLocaleString()}
                      </p>
                    )}
                    <p className="mt-2 flex items-center gap-1 text-xs text-black/45">
                      <Phone size={13} />
                      {l.phone || "No phone"}
                    </p>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-black/45">
                      <Mail size={13} />
                      {l.email}
                    </p>
                    <p className="mt-3 text-[11px] text-black/35">
                      Latest activity:{" "}
                      {new Date(
                        l.activities?.[0]?.createdAt || l.updatedAt,
                      ).toLocaleString()}
                    </p>
                    {updating.includes(l.id) && (
                      <p className="mt-2 text-xs font-semibold text-forest">
                        Saving stage…
                      </p>
                    )}
                    <select
                      aria-label={`Status for ${l.customer.name}`}
                      className="mt-3 !py-2 text-sm"
                      value={l.status}
                      onChange={(e) => move(l.id, e.target.value as LeadStatus)}
                    >
                      {stages.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </article>
                ))}
              {!leads.some((l) => l.status === stage) && (
                <p className="rounded-xl border border-dashed border-black/10 p-5 text-center text-sm text-black/35">
                  Drop a lead here
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
