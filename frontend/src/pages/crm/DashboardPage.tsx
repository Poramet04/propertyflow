import {
  Banknote,
  CalendarClock,
  CircleDollarSign,
  Handshake,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { analyticsApi, dashboardApi } from "../../services/api";
import type {
  DashboardData,
  LeadAnalytics,
  PropertyAnalytics,
  SalesAnalytics,
} from "../../types";
import { money } from "../../utils/finance";
import { ErrorState, LoadingState } from "../../components/UiState";
export default function DashboardPage() {
  const { token, user } = useAuth(),
    [data, setData] = useState<DashboardData | null>(null),
    [leads, setLeads] = useState<LeadAnalytics | null>(null),
    [sales, setSales] = useState<SalesAnalytics | null>(null),
    [properties, setProperties] = useState<PropertyAnalytics | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (token)
      Promise.all([
        dashboardApi.get(token),
        analyticsApi.leads(token),
        analyticsApi.sales(token),
        analyticsApi.properties(token),
      ])
        .then(([d, l, s, p]) => {
          setData(d);
          setLeads(l);
          setSales(s);
          setProperties(p);
        })
        .catch((e) => setError(e.message));
  }, [token]);
  if (error) return <ErrorState message={error} />;
  if (!data || !leads || !sales || !properties)
    return <LoadingState label="Loading live CRM dashboard…" />;
  const cards = [
    ["Total Leads", data.kpis.totalLeads, Users],
    ["New Leads", data.kpis.newLeads, Users],
    ["Active Leads", data.kpis.activeLeads, Users],
    ["Lost Leads", data.kpis.lostLeads, Users],
    ["Upcoming Viewings", data.kpis.upcomingViewings, CalendarClock],
    ["Closed Deals", sales.closedDeals, Handshake],
    ["Sales Value", money(data.kpis.monthlySalesValue), Banknote],
    [
      "Commission Value",
      money(data.kpis.estimatedCommission),
      CircleDollarSign,
    ],
    ["Overdue Follow-ups", data.kpis.overdueFollowUps, CalendarClock],
  ] as const;
  const stages = [
    "NEW",
    "CONTACTED",
    "VIEWING",
    "NEGOTIATION",
    "BOOKING",
    "CLOSED",
  ] as const;
  return (
    <>
      <p className="eyebrow">Live CRM analytics</p>
      <h1 className="mt-2 text-4xl font-bold">
        {user?.role === "ADMIN" ? "Admin" : "Agent"} dashboard
      </h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, Icon]) => (
          <div className="panel flex items-center gap-4" key={label}>
            <span className="rounded-2xl bg-mint p-3 text-forest">
              <Icon />
            </span>
            <div>
              <p className="text-sm text-black/45">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>
      {data.admin && (
        <section className="panel mt-7">
          <h2 className="text-2xl font-bold">Admin overview</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">
            {Object.entries(data.admin).map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-black/45">
                  {k.replace(/([A-Z])/g, " $1")}
                </p>
                <p className="text-xl font-bold">
                  {k.toLowerCase().includes("value") ||
                  k.toLowerCase().includes("commission")
                    ? money(v)
                    : v}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="panel mt-7">
        <h2 className="text-2xl font-bold">Lead funnel</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-6">
          {stages.map((s, i) => (
            <div className="rounded-2xl bg-black/[.03] p-4" key={s}>
              <p className="text-xs text-black/45">{s}</p>
              <p className="text-3xl font-bold">{leads.funnel[s]}</p>
              {i < stages.length - 1 && (
                <div className="mt-2 h-2 rounded-full bg-mint">
                  <div
                    className="h-2 rounded-full bg-forest"
                    style={{
                      width: `${Math.min(100, ((leads.funnel[stages[i + 1]] || 0) / Math.max(1, leads.funnel[s])) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
          <p>
            Lead → Viewing <b>{leads.conversions.leadToViewing}%</b>
          </p>
          <p>
            Viewing → Booking <b>{leads.conversions.viewingToBooking}%</b>
          </p>
          <p>
            Booking → Closed <b>{leads.conversions.bookingToClose}%</b>
          </p>
          <p>
            Overall close <b>{leads.conversions.leadToClose}%</b>
          </p>
        </div>
      </section>
      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        {(["overdue", "today", "upcoming"] as const).map((group) => (
          <section className="panel" key={group}>
            <h2
              className={`text-xl font-bold ${group === "overdue" ? "text-red-700" : ""}`}
            >
              {group[0].toUpperCase() + group.slice(1)} follow-ups
            </h2>
            <div className="mt-4 grid gap-3">
              {data.followUps[group].slice(0, 6).map((f) => (
                <Link
                  className={`rounded-xl p-3 ${group === "overdue" ? "bg-red-50" : "bg-black/[.03]"}`}
                  key={f.id}
                  to={`/crm/leads/${f.id}`}
                >
                  <p className="font-semibold">
                    {f.customer} · {f.priority}
                  </p>
                  <p className="text-sm text-black/55">{f.property}</p>
                  <p className="text-xs text-black/40">
                    {new Date(f.nextFollowUpAt).toLocaleString()}
                  </p>
                </Link>
              ))}
              {!data.followUps[group].length && (
                <p className="text-black/45">No {group} follow-ups.</p>
              )}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <h2 className="text-xl font-bold">Recent activities</h2>
          <div className="mt-4 grid gap-3">
            {data.recentActivities.map((a) => (
              <Link
                to={`/crm/leads/${a.lead.id}`}
                className="border-l-2 border-forest/20 pl-3"
                key={a.id}
              >
                <p className="font-semibold">{a.description}</p>
                <p className="text-xs text-black/45">
                  {a.lead.customer.name} · {a.actor?.name || "System"} ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </Link>
            ))}
            {!data.recentActivities.length && (
              <p className="text-black/45">No activities recorded yet.</p>
            )}
          </div>
        </section>
        <section className="panel">
          <h2 className="text-xl font-bold">Property interest</h2>
          <div className="mt-4 grid gap-3">
            {properties.topInterested.slice(0, 6).map((p) => (
              <div key={p.id}>
                <div className="flex justify-between">
                  <b>{p.title}</b>
                  <span>{p.leads} leads</span>
                </div>
                <p className="text-sm text-black/45">{p.activeLeads} active</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
