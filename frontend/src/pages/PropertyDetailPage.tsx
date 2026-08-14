import {
  Bath,
  BedDouble,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Ruler,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MortgageCalculator from "../components/MortgageCalculator";
import SafeImage from "../components/SafeImage";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import {
  calculatorApi,
  leadApi,
  propertyApi,
  recommendationApi,
} from "../services/api";
import type {
  LoanProfile,
  PreQualificationResult,
  Property,
  Recommendation,
} from "../types";
import { money } from "../utils/finance";

const fitColor = {
  LIKELY_WITHIN_ESTIMATE: "bg-emerald-50 text-emerald-800",
  BORDERLINE: "bg-amber-50 text-amber-800",
  ABOVE_ESTIMATED_BUDGET: "bg-red-50 text-red-700",
};

export default function PropertyDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const { pick } = useLanguage();
  const [property, setProperty] = useState<Property | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [match, setMatch] = useState<Recommendation | null>(null);
  const [profile, setProfile] = useState<LoanProfile | null>(null);
  const [fit, setFit] = useState<PreQualificationResult | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasEnquiry, setHasEnquiry] = useState(false);

  useEffect(() => {
    if (slug) propertyApi.get(slug).then(setProperty).catch((caught) => setError(caught.message));
  }, [slug]);

  useEffect(() => {
    if (token && user?.role === "CUSTOMER" && property) {
      Promise.all([
        recommendationApi.get(token),
        calculatorApi.financialFit(token, property.id).catch(() => null),
      ]).then(([recommendations, financialFit]) => {
        setProfile(recommendations.profile);
        setMatch(
          recommendations.recommendations.find(
            (item) => item.property.id === property.id,
          ) ?? null,
        );
        setFit(financialFit);
      });
    }
  }, [token, user?.role, property?.id]);

  useEffect(() => setImageIndex(0), [property?.id]);

  const interest = async () => {
    if (!user || !token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (user.role !== "CUSTOMER") {
      setMessage(
        pick(
          "Only customer accounts can create property enquiries.",
          "เฉพาะบัญชีลูกค้าเท่านั้นที่สามารถส่งความสนใจได้",
        ),
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const lead = await leadApi.create(token, {
        propertyId: property!.id,
        budget: profile?.estimatedPropertyBudget,
      });
      setMessage(
        pick(
          `Enquiry created. ${lead.assignedAgent.name} has been assigned to help you.`,
          `ส่งความสนใจเรียบร้อยแล้ว ${lead.assignedAgent.name} จะเป็นผู้ดูแลคุณ`,
        ),
      );
      setHasEnquiry(true);
    } catch (caught) {
      const duplicateEnquiry =
        caught instanceof Error &&
        caught.message.includes("already have an active enquiry");
      if (duplicateEnquiry) setHasEnquiry(true);
      setMessage(
        duplicateEnquiry
          ? pick(
              "You already have an active enquiry for this property.",
              "คุณมีรายการแสดงความสนใจที่กำลังดำเนินการสำหรับอสังหาริมทรัพย์นี้อยู่แล้ว",
            )
          : caught instanceof Error
            ? caught.message
          : pick("Could not create enquiry", "ไม่สามารถส่งความสนใจได้"),
      );
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="container-page py-20"><h1>{error}</h1></div>;
  if (!property) {
    return <div className="container-page py-20">{pick("Loading property...", "กำลังโหลดข้อมูล...")}</div>;
  }

  const images = property.images.length
    ? property.images
    : ["/property-placeholder.svg"];
  const showPrevious = () =>
    setImageIndex((current) => (current - 1 + images.length) % images.length);
  const showNext = () =>
    setImageIndex((current) => (current + 1) % images.length);

  return (
    <section className="container-page py-10">
      <div className="relative h-[280px] overflow-hidden rounded-3xl bg-black/5 shadow-soft sm:h-[420px] lg:h-[600px]">
        <SafeImage
          className="h-full w-full object-cover"
          src={images[imageIndex]}
          alt={`${property.title} ${imageIndex + 1}`}
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label={pick("Previous image", "รูปก่อนหน้า")}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/75 text-ink shadow-lg backdrop-blur hover:scale-105 hover:bg-white sm:left-5 sm:h-12 sm:w-12"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label={pick("Next image", "รูปถัดไป")}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/75 text-ink shadow-lg backdrop-blur hover:scale-105 hover:bg-white sm:right-5 sm:h-12 sm:w-12"
            >
              <ChevronRight />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/20 px-3 py-2 backdrop-blur-sm">
              {images.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setImageIndex(index)}
                  aria-label={pick(`View image ${index + 1}`, `ดูรูปที่ ${index + 1}`)}
                  aria-current={index === imageIndex ? "true" : undefined}
                  className={`rounded-full bg-white transition-all ${
                    index === imageIndex
                      ? "h-3.5 w-3.5 opacity-100"
                      : "h-2.5 w-2.5 opacity-60 hover:opacity-90"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid gap-10 py-10 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="flex items-center gap-1 text-black/50">
            <MapPin size={17} /> {property.location}, {property.province}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">{property.title}</h1>
          <p className="mt-4 text-3xl font-bold text-forest">{money(property.price)}</p>
          <div className="mt-6 flex flex-wrap gap-5 rounded-2xl bg-white p-5">
            <span className="flex gap-2"><BedDouble /> {property.bedrooms} {pick("bedrooms", "ห้องนอน")}</span>
            <span className="flex gap-2"><Bath /> {property.bathrooms} {pick("bathrooms", "ห้องน้ำ")}</span>
            <span className="flex gap-2"><Ruler /> {property.areaSqm} {pick("m²", "ตารางเมตร")}</span>
          </div>
          {fit && (
            <div className={`mt-6 rounded-2xl p-5 ${fitColor[fit.status]}`}>
              <p className="eyebrow">{pick("Financial fit", "ความเหมาะสมทางการเงิน")}</p>
              <h2 className="mt-2 text-xl font-bold">{fit.status.replaceAll("_", " ")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <p>{pick("Property price", "ราคาอสังหาริมทรัพย์")}<br /><b>{money(fit.targetPropertyPrice)}</b></p>
                <p>{pick("Estimated loan needed", "วงเงินกู้ที่ต้องใช้โดยประมาณ")}<br /><b>{money(fit.requiredLoanAmount)}</b></p>
                <p>{pick("Estimated monthly payment", "ค่างวดต่อเดือนโดยประมาณ")}<br /><b>{money(fit.estimatedMonthlyPayment)}</b></p>
                <p>{pick("Estimated debt ratio", "สัดส่วนหนี้โดยประมาณ")}<br /><b>{fit.estimatedDti}%</b></p>
              </div>
              {match && <p className="mt-3 font-bold">{pick("Property match", "ความเหมาะสมกับคุณ")}: {match.score}%</p>}
              <p className="mt-3 text-xs">{fit.disclaimer}</p>
              <a href="#loan-estimate" className="mt-4 inline-block font-bold underline">
                {pick("View full loan estimate", "ดูประมาณการสินเชื่อทั้งหมด")}
              </a>
            </div>
          )}
          <h2 className="mt-10 text-2xl font-bold">{pick("About this home", "เกี่ยวกับที่อยู่อาศัยนี้")}</h2>
          <p className="mt-3 max-w-3xl leading-8 text-black/60">{property.description}</p>
          <h2 className="mt-8 text-2xl font-bold">{pick("Amenities", "สิ่งอำนวยความสะดวก")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {property.amenities.map((amenity) => (
              <span key={amenity} className="flex gap-2"><Check className="text-forest" size={20} />{amenity}</span>
            ))}
          </div>
        </div>
        <aside className="panel h-fit lg:sticky lg:top-28">
          <p className="eyebrow">{pick("Take the next step", "ก้าวไปอีกขั้น")}</p>
          <h2 className="mt-3 text-2xl font-bold">{pick("Interested in this property?", "สนใจอสังหาริมทรัพย์นี้หรือไม่?")}</h2>
          <p className="mt-3 text-black/50">
            {pick("Create a verified enquiry and an agent will be assigned automatically.", "ส่งความสนใจ แล้วระบบจะมอบหมายเจ้าหน้าที่ให้คุณโดยอัตโนมัติ")}
          </p>
          <button
            disabled={busy || hasEnquiry || property.status === "SOLD" || property.status === "INACTIVE"}
            onClick={interest}
            className="btn-primary mt-6 w-full disabled:opacity-50"
          >
            {busy
              ? pick("Creating enquiry...", "กำลังส่งข้อมูล...")
              : hasEnquiry
                ? pick("Enquiry sent", "ส่งความสนใจแล้ว")
                : pick("I'm Interested", "ฉันสนใจ")}
          </button>
          {message && <p role="status" className="mt-3 rounded-xl bg-mint p-3 text-sm text-forest">{message}</p>}
        </aside>
      </div>
      <div id="loan-estimate"><MortgageCalculator price={property.price} /></div>
    </section>
  );
}
