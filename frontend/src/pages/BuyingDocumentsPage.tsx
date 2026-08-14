import {
  BadgeCheck,
  Banknote,
  ExternalLink,
  FileCheck2,
  Globe2,
  Landmark,
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

type ChecklistProps = {
  title: string;
  items: string[];
};

function Checklist({ title, items }: ChecklistProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-5">
      <h3 className="text-lg font-bold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-black/65">
            <BadgeCheck size={18} className="mt-1 shrink-0 text-forest" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BuyingDocumentsPage() {
  const { pick } = useLanguage();

  return (
    <section className="container-page py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="eyebrow">{pick("Buyer preparation guide", "คู่มือเตรียมตัวสำหรับผู้ซื้อ")}</p>
        <h1 className="section-title mt-3">
          {pick("Documents to prepare before buying", "เอกสารที่ควรเตรียมก่อนซื้ออสังหาริมทรัพย์")}
        </h1>
        <p className="mt-5 text-lg leading-8 text-black/60">
          {pick(
            "Use these checklists as a starting point for a cash purchase, a home-loan application, or a foreign condominium purchase in Thailand.",
            "ใช้เช็กลิสต์นี้เป็นจุดเริ่มต้นสำหรับการซื้อเงินสด การยื่นสินเชื่อที่อยู่อาศัย หรือการซื้อห้องชุดในไทยโดยชาวต่างชาติ",
          )}
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <article className="panel border border-black/5">
          <Banknote className="text-forest" size={30} />
          <h2 className="mt-5 text-2xl font-bold">{pick("Cash purchase", "ซื้อด้วยเงินสด")}</h2>
          <p className="mt-3 text-sm leading-6 text-black/55">
            {pick("Prepare identity, transaction, property and payment records before transfer day.", "เตรียมหลักฐานตัวบุคคล เอกสารซื้อขาย เอกสารทรัพย์ และหลักฐานการชำระเงินก่อนวันโอน")}
          </p>
        </article>
        <article className="panel border border-black/5">
          <Landmark className="text-forest" size={30} />
          <h2 className="mt-5 text-2xl font-bold">{pick("Home-loan application", "ยื่นกู้สินเชื่อบ้าน")}</h2>
          <p className="mt-3 text-sm leading-6 text-black/55">
            {pick("The bank normally reviews identity, income, existing debt and the property being financed.", "ธนาคารมักตรวจตัวตน รายได้ ภาระหนี้เดิม และอสังหาริมทรัพย์ที่จะใช้ประกอบการขอสินเชื่อ")}
          </p>
        </article>
        <article className="panel border border-black/5">
          <Globe2 className="text-forest" size={30} />
          <h2 className="mt-5 text-2xl font-bold">{pick("Foreign condominium buyer", "ชาวต่างชาติซื้อห้องชุด")}</h2>
          <p className="mt-3 text-sm leading-6 text-black/55">
            {pick("Confirm eligibility, the building's foreign quota and acceptable foreign-exchange evidence before paying.", "ตรวจสิทธิ โควตาต่างชาติของอาคาร และหลักฐานเงินตราต่างประเทศที่ใช้ได้ก่อนชำระเงิน")}
          </p>
        </article>
      </div>

      <div className="mt-8 space-y-7">
        <section className="panel">
          <div className="flex items-center gap-3"><Banknote className="text-forest" /><h2 className="text-2xl font-bold">{pick("1. Cash purchase checklist", "1. เช็กลิสต์ซื้อด้วยเงินสด")}</h2></div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Checklist title={pick("Buyer identity", "เอกสารผู้ซื้อ")} items={[
              pick("Original national ID card and a copy", "บัตรประชาชนตัวจริงและสำเนา"),
              pick("House registration copy", "สำเนาทะเบียนบ้าน"),
              pick("Name-change, marriage or divorce documents, if applicable", "เอกสารเปลี่ยนชื่อ ทะเบียนสมรส หรือทะเบียนหย่า ถ้ามี"),
              pick("Spousal consent or official power of attorney, when required", "หนังสือยินยอมคู่สมรสหรือหนังสือมอบอำนาจตามแบบทางการ เมื่อจำเป็น"),
            ]} />
            <Checklist title={pick("Property and transaction", "เอกสารทรัพย์และการซื้อขาย")} items={[
              pick("Reservation and sale-and-purchase agreement", "ใบจองและสัญญาจะซื้อจะขาย"),
              pick("Copy of the title deed or condominium title document", "สำเนาโฉนดที่ดินหรือหนังสือกรรมสิทธิ์ห้องชุด"),
              pick("Payment and transfer evidence, with receipts", "หลักฐานการชำระเงินและการโอน พร้อมใบเสร็จ"),
              pick("For a condominium: juristic-person debt-free certificate and transfer documents", "กรณีห้องชุด: หนังสือรับรองปลอดหนี้และเอกสารโอนจากนิติบุคคลอาคารชุด"),
            ]} />
          </div>
        </section>

        <section className="panel">
          <div className="flex items-center gap-3"><Landmark className="text-forest" /><h2 className="text-2xl font-bold">{pick("2. Home-loan checklist", "2. เช็กลิสต์ยื่นกู้สินเชื่อบ้าน")}</h2></div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Checklist title={pick("Identity and income", "ตัวตนและรายได้")} items={[
              pick("ID card, house registration and marital/name-change documents", "บัตรประชาชน ทะเบียนบ้าน และเอกสารสมรสหรือเปลี่ยนชื่อ"),
              pick("Employees: recent payslips or employment certificate", "ผู้มีรายได้ประจำ: สลิปเงินเดือนล่าสุดหรือหนังสือรับรองการทำงาน"),
              pick("Bank statements showing income, commonly 6 months or more", "รายการเดินบัญชีที่แสดงรายได้ โดยทั่วไปย้อนหลัง 6 เดือนขึ้นไป"),
              pick("Tax documents and evidence of additional income, when requested", "เอกสารภาษีและหลักฐานรายได้เพิ่มเติม เมื่อธนาคารร้องขอ"),
              pick("Self-employed: business registration, statements, tax filings and business evidence", "อาชีพอิสระหรือเจ้าของกิจการ: ทะเบียนธุรกิจ รายการเดินบัญชี เอกสารภาษี และหลักฐานประกอบกิจการ"),
            ]} />
            <Checklist title={pick("Loan and property", "สินเชื่อและทรัพย์")} items={[
              pick("Reservation or sale-and-purchase agreement", "ใบจองหรือสัญญาจะซื้อจะขาย"),
              pick("Title deed/condominium title copy and property details", "สำเนาโฉนดหรือหนังสือกรรมสิทธิ์ห้องชุด พร้อมรายละเอียดทรัพย์"),
              pick("Existing loan statements and monthly debt details", "รายการสินเชื่อเดิมและรายละเอียดภาระหนี้ต่อเดือน"),
              pick("Complete documents for every co-borrower, if any", "เอกสารของผู้กู้ร่วมทุกคน ถ้ามี"),
              pick("Ask the bank whether the application is for a new/used home, construction, refinance or another purpose", "แจ้งวัตถุประสงค์ให้ชัดว่าเป็นบ้านใหม่/มือสอง ปลูกสร้าง รีไฟแนนซ์ หรือประเภทอื่น และขอรายการเอกสารจากธนาคาร"),
            ]} />
          </div>
        </section>

        <section className="panel">
          <div className="flex items-center gap-3"><Globe2 className="text-forest" /><h2 className="text-2xl font-bold">{pick("3. Foreign buyer checklist", "3. เช็กลิสต์สำหรับผู้ซื้อต่างชาติ")}</h2></div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Checklist title={pick("Personal and ownership eligibility", "ตัวบุคคลและสิทธิการถือครอง")} items={[
              pick("Passport and current visa/entry records", "หนังสือเดินทางและหลักฐานวีซ่าหรือการเข้าเมืองปัจจุบัน"),
              pick("Name-change or marriage documents, if relevant", "เอกสารเปลี่ยนชื่อหรือสมรส ถ้าเกี่ยวข้อง"),
              pick("Sale-and-purchase agreement identifying the purchaser and condominium unit", "สัญญาจะซื้อจะขายที่ระบุชื่อผู้ซื้อและห้องชุดชัดเจน"),
              pick("Condominium juristic-person certificate confirming the foreign ownership quota", "หนังสือรับรองจากนิติบุคคลอาคารชุดเกี่ยวกับโควตาการถือครองของชาวต่างชาติ"),
            ]} />
            <Checklist title={pick("Funds and transfer", "เงินและการโอนกรรมสิทธิ์")} items={[
              pick("Bank evidence for foreign currency brought into Thailand to purchase the condominium, in the form accepted for the transaction", "หลักฐานจากธนาคารสำหรับเงินตราต่างประเทศที่นำเข้ามาเพื่อซื้อห้องชุด ในรูปแบบที่ใช้กับรายการนั้นได้"),
              pick("Payment receipts and transfer records matching the purchaser and purchase purpose", "ใบเสร็จและหลักฐานโอนเงินที่ตรงกับชื่อผู้ซื้อและวัตถุประสงค์การซื้อ"),
              pick("Debt-free certificate and transfer papers from the condominium juristic person", "หนังสือรับรองปลอดหนี้และเอกสารโอนจากนิติบุคคลอาคารชุด"),
              pick("Official condominium power of attorney if the buyer cannot attend; translations/legalisation may be requested", "หนังสือมอบอำนาจสำหรับห้องชุดหากมาไม่ได้ และอาจต้องมีคำแปลหรือการรับรองเอกสาร"),
            ]} />
          </div>
          <div className="mt-5 rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            {pick(
              "Important: this checklist focuses on condominium ownership. Foreign ownership of land in Thailand is generally restricted and only narrow legal exceptions may apply. Confirm the exact case with the responsible Land Office and an appropriately qualified adviser before committing funds.",
              "สำคัญ: เช็กลิสต์นี้เน้นการถือกรรมสิทธิ์ห้องชุด การถือครองที่ดินของชาวต่างชาติในไทยมีข้อจำกัดและมีข้อยกเว้นเฉพาะบางกรณี ควรตรวจกรณีจริงกับสำนักงานที่ดินที่รับผิดชอบและผู้เชี่ยวชาญที่มีคุณสมบัติก่อนชำระเงิน",
            )}
          </div>
        </section>
      </div>

      <aside className="mt-8 rounded-3xl bg-forest p-6 text-white sm:p-8">
        <div className="flex items-start gap-3"><FileCheck2 className="mt-1 shrink-0" /><div><h2 className="text-xl font-bold">{pick("Check the final list before you act", "ตรวจรายการล่าสุดก่อนดำเนินการจริง")}</h2><p className="mt-2 text-sm leading-6 text-white/75">{pick("Requirements vary by bank, property type, marital status, nationality and Land Office. Ask for a case-specific checklist before signing or transferring funds.", "รายการเอกสารอาจต่างกันตามธนาคาร ประเภททรัพย์ สถานภาพสมรส สัญชาติ และสำนักงานที่ดิน ควรขอเช็กลิสต์เฉพาะกรณีก่อนเซ็นสัญญาหรือโอนเงิน")}</p></div></div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="btn-light" href="https://www.dol.go.th/dol-services/citizen-services/" target="_blank" rel="noreferrer">{pick("Department of Lands", "กรมที่ดิน")}<ExternalLink size={16} /></a>
          <a className="btn-light" href="https://www.bot.or.th/th/our-roles/financial-markets/foreign-exchange-regulations/foreign-exchange-laws.html" target="_blank" rel="noreferrer">{pick("Bank of Thailand FX guidance", "ข้อมูลเงินตราต่างประเทศ ธปท.")}<ExternalLink size={16} /></a>
        </div>
      </aside>

      <p className="mt-6 text-xs leading-5 text-black/45">
        {pick("General planning information only; not legal, tax, credit or bank-approval advice. Requirements can change.", "ข้อมูลทั่วไปเพื่อการเตรียมตัวเท่านั้น ไม่ใช่คำแนะนำทางกฎหมาย ภาษี สินเชื่อ หรือการรับรองผลอนุมัติจากธนาคาร และข้อกำหนดอาจเปลี่ยนแปลงได้")}
      </p>
    </section>
  );
}
