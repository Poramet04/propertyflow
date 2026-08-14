import { CalendarPlus, Check, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  appointmentApi,
  calculatorApi,
  dealApi,
  leadApi,
  loanApi,
  recommendationApi,
} from "../../services/api";
import type {
  AppointmentStatus,
  Lead,
  LeadPriority,
  LeadStatus,
  LoanApplicationStatus,
  PreQualificationResult,
  RecommendationResponse,
} from "../../types";
import { money } from "../../utils/finance";
import {
  dayFirstParts,
  formatDayFirstEntry,
  formatDayFirstDateTime,
  parseDayFirstDateTime,
} from "../../utils/dateTime";
import { useLanguage } from "../../hooks/useLanguage";
import { translateKnownText } from "../../i18n/translations";

const stages: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "VIEWING",
  "NEGOTIATION",
  "BOOKING",
  "CLOSED",
  "LOST",
];
const priorities: LeadPriority[] = ["LOW", "MEDIUM", "HIGH", "HOT"];
const appointmentStatuses: AppointmentStatus[] = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];
const loanStatuses: LoanApplicationStatus[] = [
  "NOT_STARTED",
  "DOCUMENT_PREPARATION",
  "SUBMITTED_TO_BANK",
  "UNDER_REVIEW",
  "ADDITIONAL_DOCUMENT_REQUIRED",
  "PRE_APPROVED",
  "APPROVED",
  "DECLINED",
  "CANCELLED",
];
const quarterHourTimes = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});
const timesWithCurrent = (current: string) =>
  current && !quarterHourTimes.includes(current)
    ? [current, ...quarterHourTimes]
    : quarterHourTimes;
const fitStyle = {
  LIKELY_WITHIN_ESTIMATE: "bg-emerald-100 text-emerald-800",
  BORDERLINE: "bg-amber-100 text-amber-800",
  ABOVE_ESTIMATED_BUDGET: "bg-red-100 text-red-700",
};
const activityTypeThai: Record<string, string> = {
  LEAD_CREATED: "สร้างลีด",
  AGENT_ASSIGNED: "มอบหมายเจ้าหน้าที่",
  STATUS_CHANGED: "เปลี่ยนสถานะลีด",
  PRIORITY_CHANGED: "เปลี่ยนระดับความสำคัญ",
  NOTE_ADDED: "เพิ่มบันทึก",
  FOLLOW_UP_SET: "ตั้งเวลาติดตาม",
  FOLLOW_UP_COMPLETED: "ติดตามเสร็จสิ้น",
  APPOINTMENT_CREATED: "สร้างนัดหมาย",
  APPOINTMENT_UPDATED: "อัปเดตนัดหมาย",
  LOAN_APPLICATION_CREATED: "สร้างคำขอสินเชื่อ",
  LOAN_STATUS_CHANGED: "เปลี่ยนสถานะสินเชื่อ",
  DEAL_CREATED: "สร้างดีล",
  PROPERTY_STATUS_CHANGED: "เปลี่ยนสถานะอสังหาริมทรัพย์",
};

export default function LeadDetailPage() {
  const { id } = useParams(),
    { token, user } = useAuth(),
    { isThai, pick } = useLanguage();
  const [lead, setLead] = useState<Lead | null>(null),
    [insights, setInsights] = useState<RecommendationResponse | null>(null),
    [fit, setFit] = useState<PreQualificationResult | null>(null),
    [notes, setNotes] = useState(""),
    [message, setMessage] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(""),
    [appointmentTime, setAppointmentTime] = useState(""),
    [appointmentNote, setAppointmentNote] = useState(""),
    [followUpDate, setFollowUpDate] = useState(""),
    [followUpTime, setFollowUpTime] = useState("");
  const [salePrice, setSalePrice] = useState(0),
    [commission, setCommission] = useState(3);
  const [bankName, setBankName] = useState(""),
    [loanAmount, setLoanAmount] = useState(0),
    [loanNote, setLoanNote] = useState("");
  const load = () =>
    token &&
    id &&
    Promise.all([leadApi.get(token, id), recommendationApi.forLead(token, id)])
      .then(async ([l, r]) => {
        setLead(l);
        setInsights(r);
        setNotes(l.notes);
        setSalePrice(l.property.price);
        setLoanAmount(
          Math.max(
            0,
            l.property.price - (l.customer.loanProfile?.downPayment || 0),
          ),
        );
        const followUpParts = l.nextFollowUpAt
          ? dayFirstParts(l.nextFollowUpAt)
          : { date: "", time: "" };
        setFollowUpDate(followUpParts.date);
        setFollowUpTime(followUpParts.time);
        const p = l.customer.loanProfile;
        if (p)
          setFit(
            await calculatorApi.preQualification({
              monthlyIncome: p.monthlyIncome,
              additionalIncome: p.additionalMonthlyIncome,
              existingDebt: p.existingDebt,
              creditCardMonthlyPayment: p.creditCardMonthlyPayment,
              carLoanMonthlyPayment: p.carLoanMonthlyPayment,
              personalLoanMonthlyPayment: p.personalLoanMonthlyPayment,
              otherMonthlyDebt: p.otherMonthlyDebt,
              downPayment: p.downPayment,
              interestRate: p.interestRate,
              loanYears: p.loanYears,
              maxDti: p.maxDti,
              targetPropertyPrice: l.property.price,
            }),
          );
      })
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    load();
  }, [token, id]);
  if (!lead) return <p>{message || "Loading lead…"}</p>;
  const canManage =
    user?.role === "ADMIN" || lead.assignedAgentId === user?.id;
  const act = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      setMessage(success);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Action failed");
    }
  };
  const addAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const date = parseDayFirstDateTime(appointmentDate, appointmentTime);
    if (!date) {
      setMessage("Enter a valid date as DD/MM/YYYY and select a time.");
      return;
    }
    act(
      () =>
        appointmentApi.create(token!, lead.id, {
          appointmentDate: date.toISOString(),
          status: "SCHEDULED",
          note: appointmentNote,
        }),
      "Viewing scheduled.",
    );
    setAppointmentDate("");
    setAppointmentTime("");
    setAppointmentNote("");
  };
  const closeDeal = (e: React.FormEvent) => {
    e.preventDefault();
    act(
      () =>
        dealApi.create(token!, lead.id, {
          salePrice,
          commissionRate: commission / 100,
          markPropertySold: true,
        }),
      "Deal recorded and property marked SOLD.",
    );
  };
  const createLoan = (e: React.FormEvent) => {
    e.preventDefault();
    act(
      () =>
        loanApi.create(token!, lead.id, {
          bankName,
          requestedLoanAmount: loanAmount,
          status: "NOT_STARTED",
          note: loanNote,
        }),
      "Loan application recorded.",
    );
    setBankName("");
    setLoanNote("");
  };
  return (
    <>
      <p className="eyebrow">{pick("Lead detail", "รายละเอียดลีด")}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">{lead.customer.name}</h1>
          <p className="mt-2 text-sm text-black/45">
            {pick("Assigned to", "ผู้รับผิดชอบ")}: {lead.assignedAgent.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-bold uppercase tracking-wide text-black/45">
            {pick("Lead controls", "การควบคุมลีด")}
          </span>
          <label className="text-xs font-semibold text-black/55">
            {pick("Lead priority", "ระดับความสำคัญ")}
          <select
            aria-label="Lead priority"
            disabled={!canManage}
            value={lead.priority}
            onChange={(e) =>
              act(
                () =>
                  leadApi.priority(
                    token!,
                    lead.id,
                    e.target.value as LeadPriority,
                  ),
                "Priority updated.",
              )
            }
            className={
              lead.priority === "HOT"
                ? "mt-1 border-red-300 bg-red-50 font-bold text-red-700"
                : "mt-1 max-w-44"
            }
          >
            {priorities.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          </label>
          <label className="text-xs font-semibold text-black/55">
            {pick("Lead status", "สถานะลีด")}
          <select
            className="mt-1"
            aria-label="Lead status"
            disabled={!canManage}
            value={lead.status}
            onChange={(e) =>
              act(
                () =>
                  leadApi.status(token!, lead.id, e.target.value as LeadStatus),
                "Status updated.",
              )
            }
          >
            {stages.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          </label>
        </div>
      </div>
      {message && (
        <p role="status" className="mt-4 rounded-xl bg-mint p-3 text-forest">
          {message}
        </p>
      )}
      {!canManage && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">{pick("Team-visible lead · read only", "ลีดของทีม · ดูได้อย่างเดียว")}</p>
          <p className="mt-1">
            {pick(
              `This lead is assigned to ${lead.assignedAgent.name}. If there is no progress for 7 days, return to Pipeline and select Take over this lead before updating customer information.`,
              `ลีดนี้มอบหมายให้ ${lead.assignedAgent.name} หากไม่มีความคืบหน้าเป็นเวลา 7 วัน ให้กลับไปที่ไปป์ไลน์และเลือกรับช่วงลีดก่อนแก้ไขข้อมูลลูกค้า`,
            )}
          </p>
        </div>
      )}
      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        <section className="panel">
          <h2 className="text-xl font-bold">{pick("Customer", "ลูกค้า")}</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-black/40">{pick("Email / Phone", "อีเมล / โทรศัพท์")}</dt>
              <dd>
                {lead.email}
                <br />
                {lead.phone || pick("Not provided", "ไม่ได้ระบุ")}
              </dd>
            </div>
            <div>
              <dt className="text-black/40">{pick("Estimated budget", "งบประมาณโดยประมาณ")}</dt>
              <dd>{lead.budget ? money(lead.budget) : pick("Not provided", "ไม่ได้ระบุ")}</dd>
            </div>
          </dl>
        </section>
        <section className="panel">
          <h2 className="text-xl font-bold">{pick("Property", "อสังหาริมทรัพย์")}</h2>
          <p className="mt-4 text-lg font-bold">{lead.property.title}</p>
          <p className="text-black/50">
            {lead.property.location}, {lead.property.province}
          </p>
          <p className="mt-3 text-2xl font-bold text-forest">
            {money(lead.property.price)}
          </p>
        </section>
        <section className="panel">
          <h2 className="text-xl font-bold">{pick("Sales notes", "บันทึกการขาย")}</h2>
          <textarea
            className="mt-4 min-h-32 w-full rounded-xl border border-black/10 p-3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            className="btn-primary mt-3 w-full"
            onClick={() =>
              act(
                () => leadApi.update(token!, lead.id, { notes }),
                "Notes saved.",
              )
            }
          >
            <Save size={17} />
            {pick("Save notes", "บันทึกข้อความ")}
          </button>
        </section>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <h2 className="text-xl font-bold">{pick("Follow-up", "การติดตาม")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_auto]">
            <label className="text-sm font-semibold">
              {pick("Day / Month / Year", "วัน / เดือน / ปี")}
              <input
                className="mt-1"
                aria-label="Follow-up date, day month year"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                value={followUpDate}
                onChange={(e) =>
                  setFollowUpDate(formatDayFirstEntry(e.target.value))
                }
              />
            </label>
            <label className="text-sm font-semibold">
              {pick("Time", "เวลา")}
              <select
                className="mt-1"
                aria-label="Follow-up time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
              >
                <option value="">{pick("Select time", "เลือกเวลา")}</option>
                {timesWithCurrent(followUpTime).map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </label>
            <button
              className="btn-light self-end"
              disabled={!followUpDate || !followUpTime}
              onClick={() => {
                const date = parseDayFirstDateTime(
                  followUpDate,
                  followUpTime,
                );
                if (!date) {
                  setMessage(
                    "Enter a valid date as DD/MM/YYYY and select a time.",
                  );
                  return;
                }
                act(
                  () => leadApi.followUp(token!, lead.id, date.toISOString()),
                  "Follow-up scheduled.",
                );
              }}
            >
              {pick("Set follow-up", "ตั้งเวลาติดตาม")}
            </button>
            {lead.nextFollowUpAt && !lead.followUpCompletedAt && (
              <button
                className="btn-primary"
                onClick={() =>
                  act(
                    () => leadApi.completeFollowUp(token!, lead.id),
                    "Follow-up completed.",
                  )
                }
              >
                <Check size={17} />
                {pick("Complete", "ทำเสร็จแล้ว")}
              </button>
            )}
          </div>
          {lead.nextFollowUpAt && (
            <p
              className={`mt-3 text-sm ${!lead.followUpCompletedAt && new Date(lead.nextFollowUpAt) < new Date() ? "font-bold text-red-600" : "text-black/50"}`}
            >
              {lead.followUpCompletedAt ? pick("Completed", "เสร็จสิ้น") : pick("Due", "กำหนดติดตาม")}:{" "}
              {formatDayFirstDateTime(lead.nextFollowUpAt)}
            </p>
          )}
        </section>
        <section className="panel">
          <h2 className="text-xl font-bold">{pick("Financial snapshot", "ภาพรวมการเงิน")}</h2>
          {fit ? (
            <>
              <span
                className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${fitStyle[fit.status]}`}
              >
                {fit.status.replaceAll("_", " ")}
              </span>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-black/40">{pick("Total income", "รายได้รวม")}</dt>
                  <dd>{money(fit.totalMonthlyIncome)}</dd>
                </div>
                <div>
                  <dt className="text-black/40">{pick("Existing debt", "หนี้สินเดิม")}</dt>
                  <dd>{money(fit.totalExistingMonthlyDebt)}</dd>
                </div>
                <div>
                  <dt className="text-black/40">{pick("Estimated loan", "วงเงินกู้โดยประมาณ")}</dt>
                  <dd>{money(fit.requiredLoanAmount)}</dd>
                </div>
                <div>
                  <dt className="text-black/40">{pick("Monthly installment", "ค่างวดต่อเดือน")}</dt>
                  <dd>{money(fit.estimatedMonthlyPayment)}</dd>
                </div>
                <div>
                  <dt className="text-black/40">{pick("Estimated DTI", "DTI โดยประมาณ")}</dt>
                  <dd>{fit.estimatedDti}%</dd>
                </div>
                <div>
                  <dt className="text-black/40">{pick("Estimated property budget", "งบซื้ออสังหาริมทรัพย์โดยประมาณ")}</dt>
                  <dd>{money(fit.estimatedMaximumPropertyPrice)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-black/45">{fit.disclaimer}</p>
            </>
          ) : (
            <p className="mt-4 text-black/50">
              {pick("Customer has no saved affordability profile.", "ลูกค้ายังไม่มีข้อมูลความสามารถในการซื้อที่บันทึกไว้")}
            </p>
          )}
        </section>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <h2 className="text-xl font-bold">{pick("Appointments", "นัดหมาย")}</h2>
          <p className="mt-2 text-sm text-black/50">
            {pick(
              "Appointment status is separate from lead status. Completing a viewing moves an early-stage lead to VIEWING.",
              "สถานะนัดหมายแยกจากสถานะลีด เมื่อนัดชมเสร็จ ระบบจะเลื่อนลีดระยะแรกไปเป็น นัดชม โดยอัตโนมัติ",
            )}
          </p>
          <div className="mt-4 grid gap-2">
            {lead.appointments.map((a) => (
              <div
                className="grid gap-3 rounded-xl bg-black/[.03] p-3 sm:grid-cols-[1fr_170px]"
                key={a.id}
              >
                <div>
                  <b>{new Date(a.appointmentDate).toLocaleString()}</b>
                  <p className="text-sm text-black/50">{a.note || pick("No note", "ไม่มีหมายเหตุ")}</p>
                </div>
                <label className="text-xs font-semibold text-black/55">
                  {pick("Appointment status", "สถานะนัดหมาย")}
                <select
                  className="mt-1"
                  aria-label="Appointment status"
                  disabled={!canManage}
                  value={a.status}
                  onChange={(e) =>
                    act(
                      () =>
                        appointmentApi.update(token!, a.id, {
                          status: e.target.value as AppointmentStatus,
                        }),
                      "Appointment updated.",
                    )
                  }
                >
                  {appointmentStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                </label>
              </div>
            ))}
          </div>
          <form onSubmit={addAppointment} className="mt-5 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                {pick("Day / Month / Year", "วัน / เดือน / ปี")}
                <input
                  className="mt-1"
                  required
                  inputMode="numeric"
                  placeholder="DD/MM/YYYY"
                  value={appointmentDate}
                  onChange={(e) =>
                    setAppointmentDate(formatDayFirstEntry(e.target.value))
                  }
                />
              </label>
              <label className="text-sm font-semibold">
                {pick("Time", "เวลา")}
                <select
                  className="mt-1"
                  required
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                >
                  <option value="">{pick("Select time", "เลือกเวลา")}</option>
                  {quarterHourTimes.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
            </div>
            <input
              placeholder={pick("Viewing note", "หมายเหตุนัดชม")}
              value={appointmentNote}
              onChange={(e) => setAppointmentNote(e.target.value)}
            />
            <button className="btn-light">
              <CalendarPlus size={17} />
              {pick("Schedule viewing", "สร้างนัดชม")}
            </button>
          </form>
        </section>
        <section className="panel">
          <h2 className="text-xl font-bold">{pick("Deal", "ดีล")}</h2>
          {lead.deal ? (
            <div className="mt-5 rounded-2xl bg-mint p-5">
              <p className="text-3xl font-bold text-forest">
                {money(lead.deal.salePrice)}
              </p>
              <p className="mt-2">
                Commission {lead.deal.commissionRate * 100}% ·{" "}
                {money(lead.deal.commissionAmount)}
              </p>
            </div>
          ) : lead.status === "CLOSED" ? (
            <form onSubmit={closeDeal} className="mt-5 grid gap-3">
              <label>
                Sale price
                <input
                  type="number"
                  min="1"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                />
              </label>
              <label>
                Commission rate (%)
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                />
              </label>
              <p className="text-sm text-black/50">
                Backend calculation: {money((salePrice * commission) / 100)}
              </p>
              <button className="btn-primary">Record closed deal</button>
            </form>
          ) : (
            <p className="mt-4 text-black/50">
              Move this lead to CLOSED before recording a deal.
            </p>
          )}
        </section>
      </div>
      <section className="panel mt-6">
        <h2 className="text-2xl font-bold">{pick("Loan applications", "คำขอสินเชื่อ")}</h2>
        <p className="mt-2 text-sm text-black/50">
          {pick(
            "Loan statuses are recorded manually by the assigned Agent or Admin and are never inferred from the estimate.",
            "สถานะสินเชื่อบันทึกด้วยตนเองโดยเจ้าหน้าที่ผู้รับผิดชอบหรือผู้ดูแลระบบ และไม่ได้นำผลประมาณการมาเปลี่ยนสถานะอัตโนมัติ",
          )}
        </p>
        <div className="mt-4 grid gap-3">
          {lead.loanApplications.map((a) => (
            <div
              className="grid gap-3 rounded-xl bg-black/[.03] p-4 md:grid-cols-[1fr_180px]"
              key={a.id}
            >
              <div>
                <b>{a.bankName}</b>
                <p className="text-sm text-black/50">
                  {pick("Requested", "วงเงินที่ขอ")} {money(a.requestedLoanAmount)} ·{" "}
                  {a.note || pick("No note", "ไม่มีหมายเหตุ")}
                </p>
              </div>
              <label className="text-xs font-semibold text-black/55">
                {pick("Loan status", "สถานะสินเชื่อ")}
              <select
                className="mt-1"
                aria-label={`Loan status for ${a.bankName}`}
                disabled={!canManage}
                value={a.status}
                onChange={(e) =>
                  act(
                    () =>
                      loanApi.update(token!, lead.id, a.id, {
                        status: e.target.value as LoanApplicationStatus,
                      }),
                    "Loan status updated.",
                  )
                }
              >
                {loanStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              </label>
            </div>
          ))}
          {!lead.loanApplications.length && (
            <p className="text-black/45">{pick("No bank workflow recorded yet.", "ยังไม่มีขั้นตอนสินเชื่อที่บันทึกไว้")}</p>
          )}
        </div>
        <form onSubmit={createLoan} className="mt-5 grid gap-3 md:grid-cols-3">
          <input
            required
            placeholder={pick("Bank name", "ชื่อธนาคาร")}
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
          <input
            required
            type="number"
            min="1"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
          />
          <input
            placeholder={pick("Note", "หมายเหตุ")}
            value={loanNote}
            onChange={(e) => setLoanNote(e.target.value)}
          />
          <button className="btn-light md:col-span-3">
            {pick("Create loan application", "สร้างคำขอสินเชื่อ")}
          </button>
        </form>
      </section>
      <section className="panel mt-6">
        <h2 className="text-2xl font-bold">{pick("Activity timeline", "ประวัติกิจกรรม")}</h2>
        <div className="mt-5 grid gap-4">
          {lead.activities.map((a) => (
            <div className="border-l-2 border-forest/20 pl-4" key={a.id}>
              <p className="font-semibold">{isThai ? translateKnownText(a.description) : a.description}</p>
              <p className="text-xs text-black/45">
                {isThai ? activityTypeThai[a.type] || a.type.replaceAll("_", " ") : a.type.replaceAll("_", " ")} · {a.actor?.name || pick("System", "ระบบ")} ·{" "}
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {!lead.activities.length && (
            <p className="text-black/45">{pick("No activity recorded yet.", "ยังไม่มีกิจกรรมที่บันทึกไว้")}</p>
          )}
        </div>
      </section>
      {insights && (
        <section className="panel mt-6">
          <h2 className="text-2xl font-bold">
            {pick("Recommended properties for this customer", "อสังหาริมทรัพย์แนะนำสำหรับลูกค้ารายนี้")}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {insights.recommendations.slice(0, 5).map((r) => (
              <div
                className="rounded-2xl border border-black/10 p-4"
                key={r.property.id}
              >
                <span className="rounded-full bg-forest px-3 py-1 text-sm font-bold text-white">
                  {r.score}% match
                </span>
                <h3 className="mt-3 font-bold">{r.property.title}</h3>
                <p className="text-sm text-black/50">
                  {r.property.location} · {money(r.property.price)}
                </p>
                <p className="mt-2 text-xs text-black/55">
                  {r.reasons[0] || r.mismatches[0]}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
