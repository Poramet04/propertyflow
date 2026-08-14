import { CalendarClock, ChevronLeft, ChevronRight, GripVertical, Mail, Phone, UserRoundCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { leadApi } from "../../services/api";
import type { Lead, LeadPriority, LeadStatus } from "../../types";
import { money } from "../../utils/finance";
import { LoadingState } from "../../components/UiState";
import { useLanguage } from "../../hooks/useLanguage";

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
  const { token, user } = useAuth();
  const { pick } = useLanguage();
  const boardRef = useRef<HTMLDivElement>(null);
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
  const claim = async (id: string) => {
    if (!token) return;
    setError("");
    setUpdating((current) => [...current, id]);
    try {
      const updated = await leadApi.claim(token, id);
      setLeads((current) =>
        current.map((lead) => (lead.id === id ? updated : lead)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not take over lead");
    } finally {
      setUpdating((current) => current.filter((value) => value !== id));
    }
  };
  const scrollBoard = (direction: -1 | 1) =>
    boardRef.current?.scrollBy({ left: direction * 650, behavior: "smooth" });
  const isStale = (lead: Lead) =>
    !["CLOSED", "LOST"].includes(lead.status) &&
    new Date(lead.updatedAt).getTime() <= Date.now() - 7 * 24 * 60 * 60 * 1000;
  const stageLabel = (stage: LeadStatus) =>
    pick(
      stage,
      ({ NEW: "ใหม่", CONTACTED: "ติดต่อแล้ว", VIEWING: "นัดชม", NEGOTIATION: "เจรจา", BOOKING: "จอง", CLOSED: "ปิดการขาย", LOST: "ไม่สำเร็จ" } as Record<LeadStatus, string>)[stage],
    );
  const priorityLabel = (priority: LeadPriority) =>
    pick(
      priority,
      ({ LOW: "ต่ำ", MEDIUM: "ปานกลาง", HIGH: "สูง", HOT: "เร่งด่วน" } as Record<LeadPriority, string>)[priority],
    );
  if (loading)
    return <LoadingState label={pick("Loading sales pipeline...", "กำลังโหลดไปป์ไลน์การขาย...")} />;
  return (
    <>
      <p className="eyebrow">{pick("Sales workflow", "กระบวนการขาย")}</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mt-2 text-4xl font-bold">{pick("Pipeline", "ไปป์ไลน์")}</h1>
          <p className="mt-2 text-sm text-black/45">
            {pick(
              "Drag a card or select a status to move it. All team leads are visible; assigned agents remain responsible until a stale lead is taken over.",
              "ลากการ์ดหรือเลือกสถานะเพื่อย้ายลีด เจ้าหน้าที่ทุกคนมองเห็นลีดของทีมได้ แต่มีเพียงผู้รับผิดชอบหรือผู้ดูแลระบบที่แก้ไขได้ จนกว่าลีดที่ไม่มีความคืบหน้าจะถูกรับช่วง",
            )}
          </p>
        </div>
        <span className="text-sm text-black/45">{pick(`${leads.length} leads`, `${leads.length} ลีด`)}</span>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      <div className="relative mt-7">
        <button
          type="button"
          aria-label="Scroll pipeline left"
          onClick={() => scrollBoard(-1)}
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-black/10 bg-white/95 p-3 text-forest shadow-lg hover:bg-mint"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          aria-label="Scroll pipeline right"
          onClick={() => scrollBoard(1)}
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-black/10 bg-white/95 p-3 text-forest shadow-lg hover:bg-mint"
        >
          <ChevronRight />
        </button>
      <div ref={boardRef} className="flex gap-4 overflow-x-auto px-1 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stages.map((stage) => (
          <section
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragging && move(dragging, stage)}
            key={stage}
            className={`w-[310px] shrink-0 rounded-2xl p-3 ${dragging ? "bg-forest/[.06]" : "bg-black/[.035]"}`}
          >
            <div className="flex justify-between px-1 py-2">
              <h2 className="font-bold">{stageLabel(stage)}</h2>
              <span className="rounded-full bg-white px-2 text-sm">
                {leads.filter((l) => l.status === stage).length}
              </span>
            </div>
            <div className="grid gap-3">
              {leads
                .filter((l) => l.status === stage)
                .map((l) => {
                  const canManage =
                    user?.role === "ADMIN" || l.assignedAgentId === user?.id;
                  const canClaim =
                    user?.role === "AGENT" && !canManage && isStale(l);
                  return (
                  <article
                    draggable={canManage && !updating.includes(l.id)}
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
                        className={canManage ? "cursor-grab text-black/25" : "text-black/10"}
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
                        {priorityLabel(l.priority)}
                      </span>
                      <span className="rounded-full bg-black/[.04] px-2 py-1 text-[11px]">
                        {stageLabel(l.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold">
                      {pick("Budget", "งบประมาณ")} {l.budget ? money(l.budget) : pick("Not provided", "ไม่ได้ระบุ")}
                    </p>
                    <p className="mt-2 text-xs text-black/45">
                      {pick("Agent", "เจ้าหน้าที่")}: {l.assignedAgent.name}
                    </p>
                    {!canManage && (
                      <p className="mt-2 rounded-lg bg-black/[.035] px-2 py-1 text-xs text-black/55">
                        {pick("Team lead · read only", "ลีดของทีม · ดูได้อย่างเดียว")}
                      </p>
                    )}
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
                      {l.phone || pick("No phone", "ไม่มีเบอร์โทร")}
                    </p>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-black/45">
                      <Mail size={13} />
                      {l.email}
                    </p>
                    <p className="mt-3 text-[11px] text-black/35">
                      {pick("Latest activity", "กิจกรรมล่าสุด")}:{" "}
                      {new Date(
                        l.activities?.[0]?.createdAt || l.updatedAt,
                      ).toLocaleString()}
                    </p>
                    {updating.includes(l.id) && (
                      <p className="mt-2 text-xs font-semibold text-forest">
                        {pick("Saving stage...", "กำลังบันทึกสถานะ...")}
                      </p>
                    )}
                    <select
                      aria-label={`Status for ${l.customer.name}`}
                      className="mt-3 !py-2 text-sm"
                      value={l.status}
                      disabled={!canManage || updating.includes(l.id)}
                      onChange={(e) => move(l.id, e.target.value as LeadStatus)}
                    >
                      {stages.map((s) => (
                        <option key={s} value={s}>{stageLabel(s)}</option>
                      ))}
                    </select>
                    {canClaim && (
                      <button
                        type="button"
                        className="btn-light mt-3 w-full justify-center !py-2 text-sm"
                        disabled={updating.includes(l.id)}
                        onClick={() => claim(l.id)}
                      >
                        <UserRoundCheck size={16} />
                        {pick("Take over this lead", "รับช่วงลีดนี้")}
                      </button>
                    )}
                  </article>
                  );
                })}
              {!leads.some((l) => l.status === stage) && (
                <p className="rounded-xl border border-dashed border-black/10 p-5 text-center text-sm text-black/35">
                  {pick("Drop a lead here", "วางลีดที่นี่")}
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
      </div>
    </>
  );
}
