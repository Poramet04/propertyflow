import { Banknote, CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NumberField from "../components/NumberField";
import { useLanguage } from "../hooks/useLanguage";
import { money } from "../utils/finance";

export default function CashPurchasePage() {
  const { pick } = useLanguage();
  const [cash, setCash] = useState(3000000);
  const [reserve, setReserve] = useState(300000);
  const [renovation, setRenovation] = useState(150000);
  const [feeRate, setFeeRate] = useState(2);
  const result = useMemo(() => {
    const usableCash = Math.max(0, cash - reserve - renovation);
    const maximumPrice = usableCash / (1 + Math.max(0, feeRate) / 100);
    const estimatedFees = maximumPrice * (Math.max(0, feeRate) / 100);
    return { usableCash, maximumPrice, estimatedFees };
  }, [cash, reserve, renovation, feeRate]);

  const steps = [
    pick("Set a cash ceiling and keep an emergency reserve", "กำหนดวงเงินสดและกันเงินสำรองฉุกเฉิน"),
    pick("Inspect the property and verify ownership or encumbrances", "ตรวจสภาพทรัพย์ กรรมสิทธิ์ และภาระผูกพัน"),
    pick("Review the reservation and sale agreement before paying", "ตรวจสัญญาจองและสัญญาซื้อขายก่อนชำระเงิน"),
    pick("Confirm transfer fees, taxes and the payment method", "ยืนยันค่าธรรมเนียม ภาษี และวิธีชำระเงิน"),
    pick("Transfer ownership at the Land Office and keep every receipt", "โอนกรรมสิทธิ์ที่สำนักงานที่ดินและเก็บหลักฐานทั้งหมด"),
  ];

  return (
    <section className="container-page py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="eyebrow">{pick("Cash purchase planner", "วางแผนซื้อด้วยเงินสด")}</p>
        <h1 className="section-title mt-3">{pick("How much property can I buy with cash?", "เงินสดที่มีเหมาะกับอสังหาริมทรัพย์ราคาเท่าไร?")}</h1>
        <p className="mt-5 text-lg leading-8 text-black/60">
          {pick("Plan a maximum purchase price after setting aside an emergency reserve, renovation budget and an estimated allowance for transfer-related costs.", "ประเมินราคาซื้อสูงสุดหลังกันเงินสำรองฉุกเฉิน งบปรับปรุง และค่าใช้จ่ายที่เกี่ยวข้องกับการโอนโดยประมาณ")}
        </p>
      </div>

      <div className="mt-10 grid gap-7 lg:grid-cols-[1.05fr_.95fr]">
        <div className="panel">
          <h2 className="text-2xl font-bold">{pick("Your cash plan", "แผนเงินสดของคุณ")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <NumberField label={pick("Cash available", "เงินสดที่มี")} value={cash} onChange={setCash} suffix="THB" />
            <NumberField label={pick("Emergency reserve", "เงินสำรองฉุกเฉิน")} value={reserve} onChange={setReserve} suffix="THB" />
            <NumberField label={pick("Renovation and furnishing", "งบปรับปรุงและเฟอร์นิเจอร์")} value={renovation} onChange={setRenovation} suffix="THB" />
            <NumberField label={pick("Estimated costs", "ค่าใช้จ่ายเผื่อประมาณ")} value={feeRate} onChange={setFeeRate} suffix="%" />
          </div>
          <p className="mt-5 text-xs leading-5 text-black/45">
            {pick("The cost percentage is an adjustable planning allowance, not a fixed Land Office fee or tax quote.", "เปอร์เซ็นต์ค่าใช้จ่ายเป็นสมมติฐานที่ปรับได้ ไม่ใช่อัตราค่าธรรมเนียมหรือภาษีที่ยืนยันโดยสำนักงานที่ดิน")}
          </p>
        </div>

        <div className="rounded-3xl bg-forest p-7 text-white shadow-soft">
          <Banknote size={30} />
          <p className="mt-7 text-sm text-white/65">{pick("Suggested maximum property price", "ราคาอสังหาริมทรัพย์สูงสุดที่แนะนำ")}</p>
          <p className="mt-1 text-4xl font-extrabold">{money(result.maximumPrice)}</p>
          <div className="mt-7 grid gap-4 rounded-2xl bg-white/10 p-5 sm:grid-cols-2">
            <div><p className="text-sm text-white/65">{pick("Cash after reserves", "เงินหลังหักเงินสำรอง")}</p><p className="mt-1 text-xl font-bold">{money(result.usableCash)}</p></div>
            <div><p className="text-sm text-white/65">{pick("Estimated costs", "ค่าใช้จ่ายโดยประมาณ")}</p><p className="mt-1 text-xl font-bold">{money(result.estimatedFees)}</p></div>
          </div>
          <Link to="/properties" className="btn-light mt-6 w-full justify-center">{pick("Browse within this budget", "ดูอสังหาริมทรัพย์ในงบนี้")}</Link>
        </div>
      </div>

      <section className="panel mt-8">
        <div className="flex items-center gap-3"><ShieldCheck className="text-forest" /><h2 className="text-2xl font-bold">{pick("Cash purchase steps", "ขั้นตอนซื้อด้วยเงินสด")}</h2></div>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => <li key={step} className="flex gap-3 rounded-2xl bg-black/[.03] p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest font-bold text-white">{index + 1}</span><span className="pt-1 font-semibold">{step}</span></li>)}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn-primary" to="/buying-documents"><FileCheck2 size={18} />{pick("Open document checklist", "ดูรายการเอกสารที่ต้องเตรียม")}</Link>
          <Link className="btn-light" to="/affordability"><CheckCircle2 size={18} />{pick("Compare with a loan plan", "เปรียบเทียบกับแผนสินเชื่อ")}</Link>
        </div>
      </section>

      <p className="mt-6 text-xs leading-5 text-black/45">
        {pick("Planning estimate only. Confirm ownership, encumbrances, contract terms, taxes and transfer fees with the relevant professionals and Land Office before paying.", "ข้อมูลเพื่อการวางแผนเท่านั้น ควรตรวจกรรมสิทธิ์ ภาระผูกพัน เงื่อนไขสัญญา ภาษี และค่าธรรมเนียมกับผู้เชี่ยวชาญและสำนักงานที่ดินก่อนชำระเงินจริง")}
      </p>
    </section>
  );
}
