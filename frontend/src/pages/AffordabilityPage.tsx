import { Info, Wallet } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NumberField from "../components/NumberField";
import { useAuth } from "../hooks/useAuth";
import { calculatorApi } from "../services/api";
import type { AffordabilityInput, AffordabilityResult } from "../types";
import { money } from "../utils/finance";
export default function AffordabilityPage() {
  const [q] = useSearchParams(),
    { user, token } = useAuth(),
    [form, setForm] = useState<AffordabilityInput>({
      monthlyIncome: Number(q.get("income")) || 45000,
      additionalMonthlyIncome: 0,
      existingDebt: Number(q.get("debt")) || 5000,
      downPayment: Number(q.get("down")) || 350000,
      loanYears: Number(q.get("years")) || 30,
      interestRate: 5.5,
      maxDti: 40,
      safetyMin: 85,
      safetyMax: 92,
    }),
    [result, setResult] = useState<AffordabilityResult | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = (key: keyof AffordabilityInput, value: number) =>
    setForm({ ...form, [key]: value });
  const calculate = async (save = false) => {
    setBusy(true);
    setError("");
    try {
      setResult(
        save && token
          ? await calculatorApi.saveAffordability(token, form)
          : await calculatorApi.affordability(form),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not calculate");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="container-page py-14">
      <div className="max-w-3xl">
        <p className="eyebrow">Smart affordability</p>
        <h1 className="section-title mt-3">
          Know your range before you browse
        </h1>
        <p className="mt-5 text-lg leading-8 text-black/60">
          Adjust income, debt, financing and a conservative safety buffer. All
          formulas run in the PropertyFlow backend.
        </p>
      </div>
      <div className="mt-10 grid gap-7 lg:grid-cols-[1fr_.9fr]">
        <div className="panel">
          <h2 className="text-2xl font-bold">Your monthly picture</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <NumberField
              label="Monthly income"
              value={form.monthlyIncome}
              onChange={(v) => set("monthlyIncome", v)}
              suffix="THB"
            />
            <NumberField
              label="Additional monthly income"
              value={form.additionalMonthlyIncome}
              onChange={(v) => set("additionalMonthlyIncome", v)}
              suffix="THB"
            />
            <NumberField
              label="Existing monthly debt"
              value={form.existingDebt}
              onChange={(v) => set("existingDebt", v)}
              suffix="THB"
            />
            <NumberField
              label="Available down payment"
              value={form.downPayment}
              onChange={(v) => set("downPayment", v)}
              suffix="THB"
            />
            <NumberField
              label="Preferred loan term"
              value={form.loanYears}
              onChange={(v) => set("loanYears", v)}
              suffix="years"
            />
            <NumberField
              label="Estimated annual interest"
              value={form.interestRate}
              onChange={(v) => set("interestRate", v)}
              step={0.1}
              suffix="%"
            />
            <NumberField
              label="Maximum DTI assumption"
              value={form.maxDti}
              onChange={(v) => set("maxDti", v)}
              min={1}
              max={100}
              suffix="%"
            />
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Safe budget min"
                value={form.safetyMin}
                onChange={(v) => set("safetyMin", v)}
                suffix="%"
              />
              <NumberField
                label="Safe budget max"
                value={form.safetyMax}
                onChange={(v) => set("safetyMax", v)}
                suffix="%"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2 text-xs leading-5 text-black/45">
            <Info size={18} className="shrink-0" />
            <p>
              40% is an adjustable planning assumption, not a universal bank
              rule.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              disabled={busy}
              className="btn-primary"
              onClick={() => calculate(false)}
            >
              Calculate budget
            </button>
            {user?.role === "CUSTOMER" && (
              <button
                disabled={busy}
                className="btn-light"
                onClick={() => calculate(true)}
              >
                Save to my profile
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
        <div className="rounded-3xl bg-forest p-7 text-white shadow-soft">
          <Wallet size={30} />
          {result ? (
            <>
              <p className="mt-7 text-sm text-white/60">Total monthly income</p>
              <p className="text-2xl font-bold">
                {money(result.totalMonthlyIncome)}
              </p>
              <p className="mt-6 text-sm text-white/60">
                Maximum mortgage payment
              </p>
              <p className="text-4xl font-bold">
                {money(result.maxMortgagePayment)}
              </p>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-white/60">Estimated loan amount</p>
                  <p className="mt-1 text-xl font-bold">
                    {money(result.maxLoanAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/60">
                    Maximum property budget
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {money(result.maxPropertyPrice)}
                  </p>
                </div>
              </div>
              <div className="mt-7 rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-white/60">
                  Recommended safer budget
                </p>
                <p className="mt-1 text-xl font-bold">
                  {money(result.safeBudgetMin)} – {money(result.safeBudgetMax)}
                </p>
              </div>
              <Link
                className="mt-5 inline-block font-bold underline"
                to="/recommendations"
              >
                View smart recommendations →
              </Link>
            </>
          ) : (
            <>
              <p className="mt-8 text-2xl font-bold">
                Your result will appear here
              </p>
              <p className="mt-3 text-white/60">
                Enter your assumptions and calculate when ready.
              </p>
            </>
          )}
        </div>
      </div>
      <p className="mt-12 rounded-2xl border border-black/10 p-5 text-sm leading-6 text-black/50">
        PropertyFlow provides estimated affordability and mortgage calculations
        for planning purposes only. Actual loan eligibility, approved amount,
        interest rate and repayment terms depend on each financial institution
        and the applicant's financial profile.
      </p>
    </section>
  );
}
