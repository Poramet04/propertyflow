import { Info, Wallet } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NumberField from "../components/NumberField";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { calculatorApi } from "../services/api";
import type { AffordabilityInput, AffordabilityResult } from "../types";
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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key: keyof AffordabilityInput, value: number) =>
    setForm((current) => ({ ...current, [key]: value }));
  const calculate = async (save = false) => {
    setBusy(true);
    setError("");
    try {
      setResult(
        save && token
          ? await calculatorApi.saveAffordability(token, form)
          : await calculatorApi.affordability(form),
      );
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
            <Info size={18} className="shrink-0" />
            <p>{pick("40% is an adjustable planning assumption, not a universal bank rule.", "40% เป็นเพียงสมมติฐานสำหรับวางแผนที่ปรับเปลี่ยนได้ ไม่ใช่กฎตายตัวของทุกธนาคาร")}</p>
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
              <p className="mt-7 text-sm text-white/60">{pick("Total monthly income", "รายได้รวมต่อเดือน")}</p>
              <p className="text-2xl font-bold">{money(result.totalMonthlyIncome)}</p>
              <p className="mt-6 text-sm text-white/60">{pick("Maximum mortgage payment", "ค่างวดสูงสุดโดยประมาณ")}</p>
              <p className="text-4xl font-bold">{money(result.maxMortgagePayment)}</p>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div><p className="text-sm text-white/60">{pick("Estimated loan amount", "วงเงินกู้โดยประมาณ")}</p><p className="mt-1 text-xl font-bold">{money(result.maxLoanAmount)}</p></div>
                <div><p className="text-sm text-white/60">{pick("Maximum property budget", "งบซื้ออสังหาริมทรัพย์สูงสุด")}</p><p className="mt-1 text-xl font-bold">{money(result.maxPropertyPrice)}</p></div>
              </div>
              <div className="mt-7 rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-white/60">{pick("Recommended safer budget", "งบประมาณที่ปลอดภัยกว่า")}</p>
                <p className="mt-1 text-xl font-bold">{money(result.safeBudgetMin)} – {money(result.safeBudgetMax)}</p>
              </div>
              <Link className="mt-5 inline-block font-bold underline" to="/recommendations">
                {pick("View smart recommendations →", "ดูรายการแนะนำ →")}
              </Link>
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
