import { Calendar, Home, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { leadApi } from "../services/api";
import type { Lead } from "../types";
import { money } from "../utils/finance";
import { EmptyState, ErrorState, LoadingState } from "../components/UiState";
export default function MyLeadsPage() {
  const { token } = useAuth(),
    [leads, setLeads] = useState<Lead[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    if (token)
      leadApi
        .mine(token)
        .then(setLeads)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, [token]);
  return (
    <section className="container-page py-14">
      <p className="eyebrow">My enquiries</p>
      <h1 className="section-title mt-3">Your property journey</h1>
      {error && <div className="mt-6"><ErrorState message={error}/></div>}
      {loading && <div className="mt-8"><LoadingState label="Loading your enquiries..."/></div>}
      <div className="mt-8 grid gap-5">
        {leads.map((l) => (
          <article
            className="panel grid gap-5 md:grid-cols-[1fr_auto]"
            key={l.id}
          >
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-forest">
                  {l.status}
                </span>
                <span className="text-sm text-black/40">
                  {new Date(l.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-bold">{l.property.title}</h2>
              <p className="mt-1 text-black/55">
                <Home className="mr-1 inline" size={16} />
                {l.property.location} · {money(l.property.price)}
              </p>
              <p className="mt-3 text-sm text-black/55">
                <UserRound className="mr-1 inline" size={16} />
                Agent: {l.assignedAgent.name}
              </p>
              {l.appointments.length > 0 && (
                <p className="mt-2 text-sm text-black/55">
                  <Calendar className="mr-1 inline" size={16} />
                  Next viewing:{" "}
                  {new Date(l.appointments[0].appointmentDate).toLocaleString()}
                </p>
              )}
            </div>
            <Link
              className="btn-light self-center"
              to={`/properties/${l.property.slug}`}
            >
              View property
            </Link>
          </article>
        ))}
        {!loading&&!leads.length&&!error&&<EmptyState title="No enquiries yet" description="Browse a property and select I'm Interested when you find a match." action={<Link to="/properties" className="btn-primary">Browse properties</Link>}/>} 
      </div>
    </section>
  );
}
