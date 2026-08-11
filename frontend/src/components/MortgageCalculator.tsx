import { useEffect, useState } from "react";
import NumberField from "./NumberField";
import { calculatorApi } from "../services/api";
import type { MortgageComparison, MortgageResult } from "../types";
import { money } from "../utils/finance";
export default function MortgageCalculator({ price }: { price: number }) {
  const [down, setDown] = useState(price * 0.2),
    [rate, setRate] = useState(5.5),
    [years, setYears] = useState(30),
    [result, setResult] = useState<MortgageResult | null>(null),
    [comparison, setComparison] = useState<MortgageComparison | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    calculatorApi
      .mortgage({
        propertyPrice: price,
        downPayment: down,
        interestRate: rate,
        loanYears: years,
      })
      .then(setResult)
      .catch((e) => setError(e.message));
  }, [price, down, rate, years]);
  const compare = async () => {
    try {
      setComparison(
        await calculatorApi.compare({
          propertyPrice: price,
          scenarios: [
            { downPayment: price * 0.1, interestRate: rate, loanYears: 30 },
            { downPayment: price * 0.2, interestRate: rate, loanYears: 30 },
            { downPayment: price * 0.2, interestRate: rate, loanYears: 20 },
          ],
          stressRates: [rate, rate + 1, rate + 2],
        }),
      );
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not compare scenarios");
    }
  };
  return (
    <div className="panel">
      <h2 className="text-2xl font-bold">Mortgage estimate</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <NumberField
          label="Down payment"
          value={down}
          onChange={setDown}
          suffix="THB"
        />
        <NumberField
          label="Interest rate"
          value={rate}
          onChange={setRate}
          step={0.1}
          suffix="%"
        />
        <NumberField
          label="Loan term"
          value={years}
          onChange={setYears}
          min={1}
          suffix="years"
        />
      </div>
      {result && (
        <div className="mt-6 grid gap-3 rounded-2xl bg-mint p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-black/50">Loan amount</p>
            <p className="font-bold">{money(result.loanAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-black/50">Monthly payment</p>
            <p className="text-xl font-bold text-forest">
              {money(result.monthlyPayment)}
            </p>
          </div>
          <div>
            <p className="text-xs text-black/50">Total interest</p>
            <p className="font-bold">{money(result.totalInterest)}</p>
          </div>
          <div>
            <p className="text-xs text-black/50">Down payment</p>
            <p className="font-bold">{money(result.downPayment)}</p>
          </div>
          <div>
            <p className="text-xs text-black/50">Total repayment</p>
            <p className="font-bold">{money(result.totalPayments)}</p>
          </div>
        </div>
      )}
      <button onClick={compare} className="btn-light mt-5">
        Compare common scenarios
      </button>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {comparison && (
        <>
          <div className="mt-7 overflow-x-auto">
            <h3 className="text-xl font-bold">Loan scenario comparison</h3>
            <table className="mt-3 w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr>
                  {[
                    "Scenario",
                    "Down payment",
                    "Term",
                    "Rate",
                    "Monthly",
                    "Total interest",
                    "Total repayment",
                  ].map((x) => (
                    <th className="border-b p-3" key={x}>
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.scenarios.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-bold">{s.id}</td>
                    <td className="p-3">{money(s.downPayment)}</td>
                    <td className="p-3">{s.loanYears} years</td>
                    <td className="p-3">{s.interestRate}%</td>
                    <td className="p-3">
                      {money(s.monthlyPayment)}{" "}
                      {comparison.highlights.lowestMonthlyPayment === s.id && (
                        <b className="text-forest">↓ lowest</b>
                      )}
                    </td>
                    <td className="p-3">
                      {money(s.totalInterest)}{" "}
                      {comparison.highlights.lowestTotalInterest === s.id && (
                        <b className="text-forest">↓ lowest</b>
                      )}
                    </td>
                    <td className="p-3">{money(s.totalPayments)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-7">
            <h3 className="text-xl font-bold">Interest-rate stress test</h3>
            <p className="mt-1 text-sm text-black/50">
              Hypothetical comparison using Scenario A's down payment and term.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {comparison.stressTest.map((s) => (
                <div
                  className="rounded-2xl border border-black/10 p-4"
                  key={s.interestRate}
                >
                  <p className="text-sm text-black/45">
                    {s.interestRate}% interest
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {money(s.monthlyPayment)}/month
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <p className="mt-5 text-xs leading-5 text-black/50">
        PropertyFlow provides estimated calculations for planning only. Actual
        eligibility, approved amount, interest rate and terms depend on each
        financial institution and the applicant's profile.
      </p>
    </div>
  );
}
