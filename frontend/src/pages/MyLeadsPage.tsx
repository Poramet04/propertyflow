import { Calendar, Home, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { leadApi } from "../services/api";
import type { Lead } from "../types";
import { money } from "../utils/finance";
import { EmptyState, ErrorState, LoadingState } from "../components/UiState";
import { useLanguage } from "../hooks/useLanguage";
import { formatGregorianDate, formatGregorianDateTime } from "../utils/dateTime";
export default function MyLeadsPage() {
  const { token } = useAuth(),
    { pick } = useLanguage(),
    [leads, setLeads] = useState<Lead[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [removingId, setRemovingId] = useState("");
  useEffect(() => {
    if (token)
      leadApi
        .mine(token)
        .then(setLeads)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, [token]);
  const removeEnquiry = async (id: string, propertyTitle: string) => {
    if (
      !window.confirm(
        pick(
          `Remove your enquiry for ${propertyTitle}?`,
          `นำ ${propertyTitle} ออกจากรายการที่สนใจใช่ไหม?`,
        ),
      )
    )
      return;
    setRemovingId(id);
    setError("");
    try {
      await leadApi.withdraw(token!, id);
      setLeads((current) => current.filter((lead) => lead.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove enquiry");
    } finally {
      setRemovingId("");
    }
  };
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
                  {formatGregorianDate(l.createdAt)}
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
                  {formatGregorianDateTime(l.appointments[0].appointmentDate)}
                </p>
              )}
            </div>
            <div className="flex self-center gap-2">
              <Link
                className="btn-light"
                to={`/properties/${l.property.slug}`}
              >
                {pick("View property", "ดูอสังหาริมทรัพย์")}
              </Link>
              <button
                type="button"
                className="btn-light border-red-200 text-red-700 hover:bg-red-50"
                disabled={removingId === l.id}
                onClick={() => removeEnquiry(l.id, l.property.title)}
              >
                <Trash2 size={17} />
                {removingId === l.id
                  ? pick("Removing...", "กำลังนำออก...")
                  : pick("Remove", "นำออก")}
              </button>
            </div>
          </article>
        ))}
        {!loading&&!leads.length&&!error&&<EmptyState title="No enquiries yet" description="Browse a property and select I'm Interested when you find a match." action={<Link to="/properties" className="btn-primary">Browse properties</Link>}/>} 
      </div>
    </section>
  );
}
