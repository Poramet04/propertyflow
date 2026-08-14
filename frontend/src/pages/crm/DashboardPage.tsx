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
import { useLanguage } from "../../hooks/useLanguage";
import { translateKnownText } from "../../i18n/translations";
export default function DashboardPage() {
  const { token, user } = useAuth(),
    { isThai, pick } = useLanguage(),
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
    return <LoadingState label={pick("Loading live CRM dashboard...", "กำลังโหลดแดชบอร์ด CRM...")} />;
  const cards = [
    [pick("Total Leads", "ลีดทั้งหมด"), data.kpis.totalLeads, Users],
    [pick("New Leads", "ลีดใหม่"), data.kpis.newLeads, Users],
    [pick("Active Leads", "ลีดที่กำลังดำเนินการ"), data.kpis.activeLeads, Users],
    [pick("Lost Leads", "ลีดที่ไม่สำเร็จ"), data.kpis.lostLeads, Users],
    [pick("Upcoming Viewings", "นัดชมที่กำลังจะถึง"), data.kpis.upcomingViewings, CalendarClock],
    [pick("Closed Deals", "ดีลที่ปิดแล้ว"), sales.closedDeals, Handshake],
    [pick("Sales Value", "มูลค่าการขาย"), money(data.kpis.monthlySalesValue), Banknote],
    [
      pick("Commission Value", "มูลค่าคอมมิชชัน"),
      money(data.kpis.estimatedCommission),
      CircleDollarSign,
    ],
    [pick("Overdue Follow-ups", "ติดตามเกินกำหนด"), data.kpis.overdueFollowUps, CalendarClock],
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
      <p className="eyebrow">{pick("Live CRM analytics", "การวิเคราะห์ CRM แบบเรียลไทม์")}</p>
      <h1 className="mt-2 text-4xl font-bold">
        {user?.role === "ADMIN"
          ? pick("Admin dashboard", "แดชบอร์ดผู้ดูแลระบบ")
          : pick("Agent dashboard", "แดชบอร์ดเจ้าหน้าที่ขาย")}
      </h1>
      <section className="mt-7 rounded-3xl border border-forest/15 bg-mint/70 p-6">
        <h2 className="text-xl font-bold">
          {pick("How to add follow-ups and activities", "วิธีเพิ่มการติดตามและกิจกรรม")}
        </h2>
        <ol className="mt-4 grid gap-3 text-sm leading-6 md:grid-cols-3">
          <li><b>1.</b> {pick("Open Pipeline and select a customer lead.", "เปิดไปป์ไลน์แล้วเลือกลีดของลูกค้า")}</li>
          <li><b>2.</b> {pick("Enter the follow-up date and time, then select Set follow-up.", "กรอกวันและเวลาในช่องติดตาม แล้วกดตั้งเวลาติดตาม")}</li>
          <li><b>3.</b> {pick("Activities are recorded automatically when status, notes, appointments, follow-ups, loans or deals change.", "กิจกรรมจะบันทึกอัตโนมัติเมื่อเปลี่ยนสถานะ โน้ต นัดหมาย การติดตาม สินเชื่อ หรือดีล")}</li>
        </ol>
        <Link className="btn-light mt-5" to="/crm/pipeline">
          {pick("Open Pipeline", "เปิดไปป์ไลน์")}
        </Link>
      </section>
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
          <h2 className="text-2xl font-bold">{pick("Admin overview", "ภาพรวมผู้ดูแลระบบ")}</h2>
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
        <h2 className="text-2xl font-bold">{pick("Lead funnel", "กรวยการขาย")}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-6">
          {stages.map((s, i) => (
            <div className="rounded-2xl bg-black/[.03] p-4" key={s}>
              <p className="text-xs text-black/45">{isThai ? translateKnownText(s) : s}</p>
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
            {pick("Lead → Viewing", "ลีด → นัดชม")} <b>{leads.conversions.leadToViewing}%</b>
          </p>
          <p>
            {pick("Viewing → Booking", "นัดชม → จอง")} <b>{leads.conversions.viewingToBooking}%</b>
          </p>
          <p>
            {pick("Booking → Closed", "จอง → ปิดการขาย")} <b>{leads.conversions.bookingToClose}%</b>
          </p>
          <p>
            {pick("Overall close", "อัตราปิดการขายรวม")} <b>{leads.conversions.leadToClose}%</b>
          </p>
        </div>
      </section>
      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        {(["overdue", "today", "upcoming"] as const).map((group) => (
          <section className="panel" key={group}>
            <h2
              className={`text-xl font-bold ${group === "overdue" ? "text-red-700" : ""}`}
            >
              {pick(
                `${group[0].toUpperCase() + group.slice(1)} follow-ups`,
                group === "overdue" ? "การติดตามเกินกำหนด" : group === "today" ? "การติดตามวันนี้" : "การติดตามที่กำลังจะถึง",
              )}
            </h2>
            <div className="mt-4 grid gap-3">
              {data.followUps[group].slice(0, 6).map((f) => (
                <Link
                  className={`rounded-xl p-3 ${group === "overdue" ? "bg-red-50" : "bg-black/[.03]"}`}
                  key={f.id}
                  to={`/crm/leads/${f.id}`}
                >
                  <p className="font-semibold">
                    {f.customer} · {isThai ? translateKnownText(f.priority) : f.priority}
                  </p>
                  <p className="text-sm text-black/55">{f.property}</p>
                  <p className="text-xs text-black/40">
                    {new Date(f.nextFollowUpAt).toLocaleString()}
                  </p>
                </Link>
              ))}
              {!data.followUps[group].length && (
                <p className="text-black/45">
                  {pick(
                    `No ${group} follow-ups.`,
                    group === "overdue" ? "ไม่มีรายการติดตามเกินกำหนด" : group === "today" ? "ไม่มีรายการติดตามวันนี้" : "ไม่มีรายการติดตามที่กำลังจะถึง",
                  )}
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <h2 className="text-xl font-bold">{pick("Recent activities", "กิจกรรมล่าสุด")}</h2>
          <div className="mt-4 grid gap-3">
            {data.recentActivities.map((a) => (
              <Link
                to={`/crm/leads/${a.lead.id}`}
                className="border-l-2 border-forest/20 pl-3"
                key={a.id}
              >
                <p className="font-semibold">{isThai ? translateKnownText(a.description) : a.description}</p>
                <p className="text-xs text-black/45">
                  {a.lead.customer.name} · {a.actor?.name || pick("System", "ระบบ")} ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </Link>
            ))}
            {!data.recentActivities.length && (
              <p className="text-black/45">{pick("No activities recorded yet.", "ยังไม่มีกิจกรรมที่บันทึกไว้")}</p>
            )}
          </div>
        </section>
        <section className="panel">
          <h2 className="text-xl font-bold">{pick("Property interest", "ความสนใจในอสังหาริมทรัพย์")}</h2>
          <div className="mt-4 grid gap-3">
            {properties.topInterested.slice(0, 6).map((p) => (
              <div key={p.id}>
                <div className="flex justify-between">
                  <b>{p.title}</b>
                  <span>{pick(`${p.leads} leads`, `${p.leads} ลีด`)}</span>
                </div>
                <p className="text-sm text-black/45">{pick(`${p.activeLeads} active`, `กำลังดำเนินการ ${p.activeLeads}`)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
