import { Info, Wallet } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NumberField from "../components/NumberField";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { calculatorApi } from "../services/api";
import type {
  AffordabilityInput,
  AffordabilityResult,
  MortgageResult,
} from "../types";
import { money } from "../utils/finance";

export default function AffordabilityPage() {
  const [query] = useSearchParams();
  const { user, token } = useAuth();
  const { pick } = useLanguage();
  const [form, setForm] = useState<AffordabilityInput>({
    monthlyIncome: Number(query.get("income")) || 45000,
    additionalMonthlyIncome: 0,
    existingDebt: Number(query.get("debt")) || 5000,
    downPayment: Number(query.get("down")) || 350000,
    loanYears: Number(query.get("years")) || 30,
    interestRate: 5.5,
    maxDti: 40,
    safetyMin: 85,
    safetyMax: 92,
  });
  const [result, setResult] = useState<AffordabilityResult | null>(null);
  const [requestedLoan, setRequestedLoan] = useState(0);
  const [loanResult, setLoanResult] = useState<MortgageResult | null>(null);
  const [loanError, setLoanError] = useState("");
  const [loanBusy, setLoanBusy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const noMortgageCapacity =
    result !== null &&
    (result.maxMortgagePayment <= 0 || result.maxLoanAmount <= 0);
  const set = (key: keyof AffordabilityInput, value: number) =>
    setForm((current) => ({ ...current, [key]: value }));
  const calculate = async (save = false) => {
    setBusy(true);
    setError("");
    try {
      const calculated =
        save && token
          ? await calculatorApi.saveAffordability(token, form)
          : await calculatorApi.affordability(form);
      setResult(calculated);
      setRequestedLoan(Math.round(calculated.maxLoanAmount));
      setLoanResult(null);
      setLoanError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : pick("Could not calculate", "ไม่สามารถคำนวณได้"),
      );
    } finally {
      setBusy(false);
    }
  };
  const calculateRequestedLoan = async () => {
    if (!result) return;
    setLoanError("");
    setLoanResult(null);
    if (requestedLoan <= 0) {
      setLoanError(
        pick(
          "Enter a loan amount greater than zero.",
          "กรุณากรอกยอดกู้ที่มากกว่า 0 บาท",
        ),
      );
      return;
    }
    if (requestedLoan > result.maxLoanAmount) {
      setLoanError(
        pick(
          "The requested loan is above your estimated maximum. Reduce the amount or recalculate your affordability.",
          "ยอดกู้ที่ต้องการสูงกว่าวงเงินสูงสุดโดยประมาณ กรุณาลดยอดกู้หรือคำนวณความสามารถในการซื้อใหม่",
        ),
      );
      return;
    }
    setLoanBusy(true);
    try {
      setLoanResult(
        await calculatorApi.mortgage({
          propertyPrice: requestedLoan,
          downPayment: 0,
          interestRate: form.interestRate,
          loanYears: form.loanYears,
        }),
      );
    } catch (caught) {
      setLoanError(
        caught instanceof Error
          ? caught.message
          : pick("Could not calculate repayment", "ไม่สามารถคำนวณค่างวดได้"),
      );
    } finally {
      setLoanBusy(false);
    }
  };

  return (
    <section className="container-page py-14">
      <div className="max-w-3xl">
        <p className="eyebrow">
          {pick("Smart affordability", "วางแผนงบประมาณอัจฉริยะ")}
        </p>
        <h1 className="section-title mt-3">
          {pick(
            "Know your range before you browse",
            "รู้ช่วงราคาที่เหมาะกับคุณก่อนเลือกบ้าน",
          )}
        </h1>
        <p className="mt-5 text-lg leading-8 text-black/60">
          {pick(
            "Adjust income, debt, financing and a conservative safety buffer. All formulas run in the PropertyFlow backend.",
            "ปรับรายได้ หนี้สิน เงินดาวน์ และงบประมาณสำรองอย่างรอบคอบ โดยระบบจะคำนวณทั้งหมดผ่าน PropertyFlow",
          )}
        </p>
      </div>
      <div className="mt-10 grid gap-7 lg:grid-cols-[1fr_.9fr]">
        <div className="panel">
          <h2 className="text-2xl font-bold">
            {pick("Your monthly picture", "ภาพรวมการเงินรายเดือนของคุณ")}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <NumberField label={pick("Monthly income", "รายได้ต่อเดือน")} value={form.monthlyIncome} onChange={(value) => set("monthlyIncome", value)} suffix={pick("THB", "บาท")} />
            <NumberField label={pick("Additional monthly income", "รายได้เพิ่มเติมต่อเดือน")} value={form.additionalMonthlyIncome} onChange={(value) => set("additionalMonthlyIncome", value)} suffix={pick("THB", "บาท")} />
            <NumberField label={pick("Existing monthly debt", "หนี้รายเดือนที่มีอยู่")} value={form.existingDebt} onChange={(value) => set("existingDebt", value)} suffix={pick("THB", "บาท")} />
            <NumberField label={pick("Available down payment", "เงินดาวน์ที่พร้อมจ่าย")} value={form.downPayment} onChange={(value) => set("downPayment", value)} suffix={pick("THB", "บาท")} />
            <NumberField label={pick("Preferred loan term", "ระยะเวลาการกู้ที่ต้องการ")} value={form.loanYears} onChange={(value) => set("loanYears", value)} suffix={pick("years", "ปี")} />
            <NumberField label={pick("Estimated annual interest", "อัตราดอกเบี้ยรายปีโดยประมาณ")} value={form.interestRate} onChange={(value) => set("interestRate", value)} step={0.1} suffix="%" />
            <NumberField label={pick("Maximum DTI assumption", "สมมติฐาน DTI สูงสุด")} value={form.maxDti} onChange={(value) => set("maxDti", value)} min={1} max={100} suffix="%" />
            <div className="grid grid-cols-2 gap-2">
              <NumberField label={pick("Safe budget min", "งบปลอดภัยขั้นต่ำ")} value={form.safetyMin} onChange={(value) => set("safetyMin", value)} suffix="%" />
              <NumberField label={pick("Safe budget max", "งบปลอดภัยสูงสุด")} value={form.safetyMax} onChange={(value) => set("safetyMax", value)} suffix="%" />
            </div>
          </div>
          <div className="mt-4 flex gap-2 text-xs leading-5 text-black/45">
            <span className="group relative inline-flex shrink-0 self-start">
              <button
                type="button"
                aria-label={pick("What is DTI?", "DTI คืออะไร?")}
                className="inline-flex rounded-full text-black/45 hover:text-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/30"
              >
                <Info size={18} />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none invisible absolute bottom-full left-0 z-30 mb-2 w-[min(20rem,80vw)] rounded-xl bg-ink px-4 py-3 text-xs font-normal leading-5 text-white opacity-0 shadow-soft transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
              >
                {pick(
                  "DTI (Debt-to-Income ratio) compares all monthly debt payments with total monthly income. Example: THB 50,000 income at 40% DTI allows about THB 20,000 of total monthly debt. Existing debt is included, so the remaining amount is the estimated mortgage capacity. This setting is adjustable and is not a universal bank rule.",
                  "DTI (อัตราส่วนหนี้ต่อรายได้) คือสัดส่วนภาระหนี้ที่ต้องจ่ายต่อเดือนเทียบกับรายได้รวมต่อเดือน ตัวอย่าง: รายได้ 50,000 บาท และตั้ง DTI 40% จะรองรับภาระหนี้รวมประมาณ 20,000 บาทต่อเดือน โดยต้องหักหนี้เดิมออกก่อน ส่วนที่เหลือจึงเป็นค่างวดบ้านโดยประมาณ ค่านี้ปรับได้และไม่ใช่เกณฑ์ตายตัวของทุกธนาคาร",
                )}
              </span>
            </span>
            <p>
              {pick(
                `${form.maxDti}% is your adjustable planning assumption. It limits all monthly debt payments, including existing debt and the new mortgage repayment. It is not a universal bank rule.`,
                `${form.maxDti}% คือสมมติฐานที่คุณตั้งไว้สำหรับจำกัดภาระหนี้ต่อเดือนทั้งหมด ซึ่งรวมทั้งหนี้เดิมและค่างวดบ้านใหม่ ค่านี้ปรับได้และไม่ใช่กฎตายตัวของทุกธนาคาร`,
              )}
            </p>
          </div>
          <div className="mt-3 flex gap-2 text-xs leading-5 text-black/45">
            <Info className="mt-0.5 shrink-0" size={18} />
            <p>
              {pick(
                `The ${form.safetyMin}%–${form.safetyMax}% safety range recommends a property price below your calculated maximum, leaving more room for living costs and unexpected expenses.`,
                `ช่วงงบปลอดภัย ${form.safetyMin}%–${form.safetyMax}% คือช่วงราคาบ้านที่ต่ำกว่างบสูงสุดที่คำนวณได้ เพื่อเหลือพื้นที่สำหรับค่าครองชีพและค่าใช้จ่ายไม่คาดคิด`,
              )}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button disabled={busy} className="btn-primary" onClick={() => calculate(false)}>
              {pick("Calculate budget", "คำนวณงบประมาณ")}
            </button>
            {user?.role === "CUSTOMER" && (
              <button disabled={busy} className="btn-light" onClick={() => calculate(true)}>
                {pick("Save to my profile", "บันทึกในโปรไฟล์")}
              </button>
            )}
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        </div>
        <div className="rounded-3xl bg-forest p-7 text-white shadow-soft">
          <Wallet size={30} />
          {result ? (
            <>
              {noMortgageCapacity && (
                <div
                  role="status"
                  className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900"
                >
                  <p className="text-lg font-extrabold">
                    {pick(
                      "Buying is not recommended right now",
                      "ยังไม่แนะนำให้ซื้อในตอนนี้",
                    )}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-red-800/80">
                    {pick(
                      "Your current income and monthly debt leave no estimated capacity for a mortgage payment. Consider reducing debt, increasing stable income, or building a larger financial buffer before buying.",
                      "จากรายได้และหนี้รายเดือนปัจจุบัน ระบบประเมินว่าคุณยังไม่มีความสามารถรองรับค่างวดสินเชื่อ แนะนำให้ลดหนี้ เพิ่มรายได้ที่มั่นคง หรือสร้างเงินสำรองให้มากขึ้นก่อนซื้อ",
                    )}
                  </p>
                </div>
              )}
              <p className="mt-7 text-sm text-white/60">{pick("Total monthly income", "รายได้รวมต่อเดือน")}</p>
              <p className="text-2xl font-bold">{money(result.totalMonthlyIncome)}</p>
              <p className="mt-6 text-sm text-white/60">{pick("Maximum mortgage payment", "ค่างวดสูงสุดโดยประมาณ")}</p>
              <p className="text-4xl font-bold">{money(result.maxMortgagePayment)}</p>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div><p className="text-sm text-white/60">{pick("Estimated loan amount", "วงเงินกู้โดยประมาณ")}</p><p className="mt-1 text-xl font-bold">{money(result.maxLoanAmount)}</p></div>
                <div>
                  <p className="text-sm text-white/60">{pick("Maximum property budget", "งบซื้ออสังหาริมทรัพย์สูงสุด")}</p>
                  <p className="mt-1 text-xl font-bold">{money(result.maxPropertyPrice)}</p>
                  {noMortgageCapacity && (
                    <p className="mt-1 text-xs leading-5 text-white/55">
                      {pick(
                        "Based on available cash only; no mortgage capacity is included.",
                        "เป็นวงเงินจากเงินสดที่มีเท่านั้น โดยยังไม่รวมความสามารถกู้",
                      )}
                    </p>
                  )}
                </div>
              </div>
              {!noMortgageCapacity && <><div className="mt-7 rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-white/60">{pick("Recommended safer budget", "งบประมาณที่ปลอดภัยกว่า")}</p>
                <p className="mt-1 text-xl font-bold">{money(result.safeBudgetMin)} – {money(result.safeBudgetMax)}</p>
              </div>
              <div className="mt-7 rounded-2xl border border-white/15 bg-white/10 p-5">
                <h3 className="text-lg font-bold">
                  {pick(
                    "Borrow less than the maximum",
                    "คำนวณกรณีกู้ไม่เต็มวงเงิน",
                  )}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  {pick(
                    "Enter the amount you actually want to borrow. The repayment uses the same loan term and estimated interest rate entered on this page.",
                    "กรอกยอดที่ต้องการกู้จริง ระบบจะคำนวณค่างวดโดยใช้ระยะเวลากู้และอัตราดอกเบี้ยโดยประมาณที่กรอกไว้ในหน้านี้",
                  )}
                </p>
                <div className="mt-4 text-ink">
                  <NumberField
                    label={pick("Actual loan amount", "วงเงินที่ต้องการกู้จริง")}
                    value={requestedLoan}
                    onChange={setRequestedLoan}
                    suffix={pick("THB", "บาท")}
                  />
                </div>
                <p className="mt-2 text-xs text-white/55">
                  {pick("Estimated maximum", "วงเงินสูงสุดโดยประมาณ")}: {money(result.maxLoanAmount)}
                </p>
                <button
                  type="button"
                  disabled={loanBusy}
                  className="mt-4 w-full rounded-xl bg-white px-4 py-3 font-bold text-forest transition hover:bg-mint disabled:opacity-60"
                  onClick={calculateRequestedLoan}
                >
                  {loanBusy
                    ? pick("Calculating...", "กำลังคำนวณ...")
                    : pick("Calculate repayment", "คำนวณค่างวด")}
                </button>
                {loanError && (
                  <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-800">
                    {loanError}
                  </p>
                )}
                {loanResult && (
                  <div className="mt-5 border-t border-white/15 pt-5">
                    <p className="text-sm text-white/60">
                      {pick("Estimated monthly repayment", "ค่างวดต่อเดือนโดยประมาณ")}
                    </p>
                    <p className="mt-1 text-3xl font-extrabold">
                      {money(loanResult.monthlyPayment)}
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-white/55">{pick("Total repayment", "ยอดชำระรวม")}</p>
                        <p className="mt-1 font-bold">{money(loanResult.totalPayments)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/55">{pick("Total estimated interest", "ดอกเบี้ยรวมโดยประมาณ")}</p>
                        <p className="mt-1 font-bold">{money(loanResult.totalInterest)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/55">{pick("Below maximum by", "ต่ำกว่าวงเงินสูงสุด")}</p>
                        <p className="mt-1 font-bold">{money(result.maxLoanAmount - loanResult.loanAmount)}</p>
                        <p className="mt-1 text-xs leading-5 text-white/50">
                          {pick(
                            "The unused portion of your estimated borrowing capacity—not interest or extra cash.",
                            "คือวงเงินส่วนที่คุณเลือกไม่กู้ ไม่ใช่ดอกเบี้ยหรือเงินสดที่ได้รับเพิ่ม",
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/55">{pick("Property budget with your down payment", "งบซื้อบ้านเมื่อรวมเงินดาวน์")}</p>
                        <p className="mt-1 font-bold">{money(loanResult.loanAmount + form.downPayment)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link className="mt-5 inline-block font-bold underline" to="/recommendations">
                {pick("View smart recommendations →", "ดูรายการแนะนำ →")}
              </Link>
              </>}
            </>
          ) : (
            <>
              <p className="mt-8 text-2xl font-bold">{pick("Your result will appear here", "ผลลัพธ์ของคุณจะแสดงที่นี่")}</p>
              <p className="mt-3 text-white/60">{pick("Enter your assumptions and calculate when ready.", "กรอกข้อมูลของคุณ แล้วกดคำนวณเมื่อพร้อม")}</p>
            </>
          )}
        </div>
      </div>
      <p className="mt-12 rounded-2xl border border-black/10 p-5 text-sm leading-6 text-black/50">
        {pick("PropertyFlow provides estimated affordability and mortgage calculations for planning purposes only. Actual loan eligibility, approved amount, interest rate and repayment terms depend on each financial institution and the applicant's financial profile.", "PropertyFlow ให้ผลคำนวณความสามารถในการซื้อและสินเชื่อเพื่อการวางแผนเท่านั้น สิทธิ์กู้จริง วงเงินอนุมัติ อัตราดอกเบี้ย และเงื่อนไขการชำระขึ้นอยู่กับสถาบันการเงินและข้อมูลทางการเงินของผู้สมัคร")}
      </p>
    </section>
  );
}
