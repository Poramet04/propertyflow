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
const fitStyle = {
  LIKELY_WITHIN_ESTIMATE: "bg-emerald-100 text-emerald-800",
  BORDERLINE: "bg-amber-100 text-amber-800",
  ABOVE_ESTIMATED_BUDGET: "bg-red-100 text-red-700",
};

export default function LeadDetailPage() {
  const { id } = useParams(),
    { token } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null),
    [insights, setInsights] = useState<RecommendationResponse | null>(null),
    [fit, setFit] = useState<PreQualificationResult | null>(null),
    [notes, setNotes] = useState(""),
    [message, setMessage] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(""),
    [appointmentNote, setAppointmentNote] = useState(""),
    [followUp, setFollowUp] = useState("");
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
        setFollowUp(
          l.nextFollowUpAt
            ? new Date(l.nextFollowUpAt).toISOString().slice(0, 16)
            : "",
        );
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
    act(
      () =>
        appointmentApi.create(token!, lead.id, {
          appointmentDate,
          status: "SCHEDULED",
          note: appointmentNote,
        }),
      "Viewing scheduled.",
    );
    setAppointmentDate("");
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
      <p className="eyebrow">Lead detail</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">{lead.customer.name}</h1>
          <p className="mt-2 text-sm text-black/45">
            Assigned to {lead.assignedAgent.name}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Lead priority"
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
                ? "border-red-300 bg-red-50 font-bold text-red-700"
                : "max-w-44"
            }
          >
            {priorities.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            aria-label="Lead status"
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
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      {message && (
        <p role="status" className="mt-4 rounded-xl bg-mint p-3 text-forest">
          {message}
        </p>
      )}
      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        <section className="panel">
          <h2 className="text-xl font-bold">Customer</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-black/40">Email / Phone</dt>
              <dd>
                {lead.email}
                <br />
                {lead.phone || "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-black/40">Estimated budget</dt>
              <dd>{lead.budget ? money(lead.budget) : "Not provided"}</dd>
            </div>
          </dl>
        </section>
        <section className="panel">
          <h2 className="text-xl font-bold">Property</h2>
          <p className="mt-4 text-lg font-bold">{lead.property.title}</p>
          <p className="text-black/50">
            {lead.property.location}, {lead.property.province}
          </p>
          <p className="mt-3 text-2xl font-bold text-forest">
            {money(lead.property.price)}
          </p>
        </section>
        <section className="panel">
          <h2 className="text-xl font-bold">Sales notes</h2>
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
            Save notes
          </button>
        </section>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <h2 className="text-xl font-bold">Follow-up</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              aria-label="Next follow-up"
              type="datetime-local"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
            />
            <button
              className="btn-light"
              disabled={!followUp}
              onClick={() =>
                act(
                  () =>
                    leadApi.followUp(
                      token!,
                      lead.id,
                      new Date(followUp).toISOString(),
                    ),
                  "Follow-up scheduled.",
                )
              }
            >
              Set follow-up
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
                Complete
              </button>
            )}
          </div>
          {lead.nextFollowUpAt && (
            <p
              className={`mt-3 text-sm ${!lead.followUpCompletedAt && new Date(lead.nextFollowUpAt) < new Date() ? "font-bold text-red-600" : "text-black/50"}`}
            >
              {lead.followUpCompletedAt ? "Completed" : "Due"}:{" "}
              {new Date(lead.nextFollowUpAt).toLocaleString()}
            </p>
          )}
        </section>
        <section className="panel">
          <h2 className="text-xl font-bold">Financial snapshot</h2>
          {fit ? (
            <>
              <span
                className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${fitStyle[fit.status]}`}
              >
                {fit.status.replaceAll("_", " ")}
              </span>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-black/40">Total income</dt>
                  <dd>{money(fit.totalMonthlyIncome)}</dd>
                </div>
                <div>
                  <dt className="text-black/40">Existing debt</dt>
                  <dd>{money(fit.totalExistingMonthlyDebt)}</dd>
                </div>
                <div>
                  <dt className="text-black/40">Estimated loan</dt>
                  <dd>{money(fit.requiredLoanAmount)}</dd>
                </div>
                <div>
                  <dt className="text-black/40">Monthly installment</dt>
                  <dd>{money(fit.estimatedMonthlyPayment)}</dd>
                </div>
                <div>
                  <dt className="text-black/40">Estimated DTI</dt>
                  <dd>{fit.estimatedDti}%</dd>
                </div>
                <div>
                  <dt className="text-black/40">Estimated property budget</dt>
                  <dd>{money(fit.estimatedMaximumPropertyPrice)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-black/45">{fit.disclaimer}</p>
            </>
          ) : (
            <p className="mt-4 text-black/50">
              Customer has no saved affordability profile.
            </p>
          )}
        </section>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <h2 className="text-xl font-bold">Appointments</h2>
          <div className="mt-4 grid gap-2">
            {lead.appointments.map((a) => (
              <div
                className="grid gap-3 rounded-xl bg-black/[.03] p-3 sm:grid-cols-[1fr_170px]"
                key={a.id}
              >
                <div>
                  <b>{new Date(a.appointmentDate).toLocaleString()}</b>
                  <p className="text-sm text-black/50">{a.note || "No note"}</p>
                </div>
                <select
                  aria-label="Appointment status"
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
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <form onSubmit={addAppointment} className="mt-5 grid gap-3">
            <input
              type="datetime-local"
              required
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
            <input
              placeholder="Viewing note"
              value={appointmentNote}
              onChange={(e) => setAppointmentNote(e.target.value)}
            />
            <button className="btn-light">
              <CalendarPlus size={17} />
              Schedule viewing
            </button>
          </form>
        </section>
        <section className="panel">
          <h2 className="text-xl font-bold">Deal</h2>
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
        <h2 className="text-2xl font-bold">Loan applications</h2>
        <p className="mt-2 text-sm text-black/50">
          Statuses are recorded manually by Agent/Admin and are never inferred
          from the estimate.
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
                  Requested {money(a.requestedLoanAmount)} ·{" "}
                  {a.note || "No note"}
                </p>
              </div>
              <select
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
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          ))}
          {!lead.loanApplications.length && (
            <p className="text-black/45">No bank workflow recorded yet.</p>
          )}
        </div>
        <form onSubmit={createLoan} className="mt-5 grid gap-3 md:grid-cols-3">
          <input
            required
            placeholder="Bank name"
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
            placeholder="Note"
            value={loanNote}
            onChange={(e) => setLoanNote(e.target.value)}
          />
          <button className="btn-light md:col-span-3">
            Create loan application
          </button>
        </form>
      </section>
      <section className="panel mt-6">
        <h2 className="text-2xl font-bold">Activity timeline</h2>
        <div className="mt-5 grid gap-4">
          {lead.activities.map((a) => (
            <div className="border-l-2 border-forest/20 pl-4" key={a.id}>
              <p className="font-semibold">{a.description}</p>
              <p className="text-xs text-black/45">
                {a.type.replaceAll("_", " ")} · {a.actor?.name || "System"} ·{" "}
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {!lead.activities.length && (
            <p className="text-black/45">No activity recorded yet.</p>
          )}
        </div>
      </section>
      {insights && (
        <section className="panel mt-6">
          <h2 className="text-2xl font-bold">
            Recommended properties for this customer
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
