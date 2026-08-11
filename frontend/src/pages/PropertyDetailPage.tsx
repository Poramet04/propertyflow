import { Bath, BedDouble, Check, MapPin, Ruler } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MortgageCalculator from "../components/MortgageCalculator";
import SafeImage from "../components/SafeImage";
import { useAuth } from "../hooks/useAuth";
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
  const { slug } = useParams(),
    nav = useNavigate(),
    location = useLocation(),
    { user, token } = useAuth(),
    [p, setP] = useState<Property | null>(null),
    [match, setMatch] = useState<Recommendation | null>(null),
    [profile, setProfile] = useState<LoanProfile | null>(null),
    [fit, setFit] = useState<PreQualificationResult | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (slug)
      propertyApi
        .get(slug)
        .then(setP)
        .catch((e) => setError(e.message));
  }, [slug]);
  useEffect(() => {
    if (token && user?.role === "CUSTOMER" && p)
      Promise.all([
        recommendationApi.get(token),
        calculatorApi.financialFit(token, p.id).catch(() => null),
      ]).then(([r, f]) => {
        setProfile(r.profile);
        setMatch(r.recommendations.find((x) => x.property.id === p.id) ?? null);
        setFit(f);
      });
  }, [token, user?.role, p?.id]);
  const interest = async () => {
    if (!user || !token) {
      nav("/login", { state: { from: location.pathname } });
      return;
    }
    if (user.role !== "CUSTOMER") {
      setMessage("Only customer accounts can create property enquiries.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const lead = await leadApi.create(token, {
        propertyId: p!.id,
        budget: profile?.estimatedPropertyBudget,
      });
      setMessage(
        `Enquiry created. ${lead.assignedAgent.name} has been assigned to help you.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not create enquiry");
    } finally {
      setBusy(false);
    }
  };
  if (error)
    return (
      <div className="container-page py-20">
        <h1>{error}</h1>
      </div>
    );
  if (!p) return <div className="container-page py-20">Loading property…</div>;
  return (
    <section className="container-page py-10">
      <div className="grid h-[500px] gap-3 overflow-hidden rounded-3xl md:grid-cols-2">
        <SafeImage
          className="h-full w-full object-cover"
          src={p.images[0] || "/property-placeholder.svg"}
          alt={p.title}
        />
        <div className="hidden grid-rows-2 gap-3 md:grid">
          {p.images.slice(1).map((x) => (
            <SafeImage
              key={x}
              className="h-full w-full object-cover"
              src={x}
              alt="Property interior"
            />
          ))}
        </div>
      </div>
      <div className="grid gap-10 py-10 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="flex items-center gap-1 text-black/50">
            <MapPin size={17} />
            {p.location}, {p.province}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">
            {p.title}
          </h1>
          <p className="mt-4 text-3xl font-bold text-forest">
            {money(p.price)}
          </p>
          <div className="mt-6 flex flex-wrap gap-5 rounded-2xl bg-white p-5">
            <span className="flex gap-2">
              <BedDouble /> {p.bedrooms} bedrooms
            </span>
            <span className="flex gap-2">
              <Bath /> {p.bathrooms} bathrooms
            </span>
            <span className="flex gap-2">
              <Ruler /> {p.areaSqm} m²
            </span>
          </div>
          {fit && (
            <div className={`mt-6 rounded-2xl p-5 ${fitColor[fit.status]}`}>
              <p className="eyebrow">Financial fit</p>
              <h2 className="mt-2 text-xl font-bold">
                {fit.status.replaceAll("_", " ")}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <p>
                  Property price
                  <br />
                  <b>{money(fit.targetPropertyPrice)}</b>
                </p>
                <p>
                  Estimated loan needed
                  <br />
                  <b>{money(fit.requiredLoanAmount)}</b>
                </p>
                <p>
                  Estimated monthly payment
                  <br />
                  <b>{money(fit.estimatedMonthlyPayment)}</b>
                </p>
                <p>
                  Estimated debt ratio
                  <br />
                  <b>{fit.estimatedDti}%</b>
                </p>
              </div>
              {match && (
                <p className="mt-3 font-bold">Property match: {match.score}%</p>
              )}
              <p className="mt-3 text-xs">{fit.disclaimer}</p>
              <a
                href="#loan-estimate"
                className="mt-4 inline-block font-bold underline"
              >
                View full loan estimate
              </a>
            </div>
          )}
          <h2 className="mt-10 text-2xl font-bold">About this home</h2>
          <p className="mt-3 max-w-3xl leading-8 text-black/60">
            {p.description}
          </p>
          <h2 className="mt-8 text-2xl font-bold">Amenities</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {p.amenities.map((a) => (
              <span key={a} className="flex gap-2">
                <Check className="text-forest" size={20} />
                {a}
              </span>
            ))}
          </div>
        </div>
        <aside className="panel h-fit lg:sticky lg:top-28">
          <p className="eyebrow">Take the next step</p>
          <h2 className="mt-3 text-2xl font-bold">
            Interested in this property?
          </h2>
          <p className="mt-3 text-black/50">
            Create a verified enquiry and an agent will be assigned
            automatically.
          </p>
          <button
            disabled={busy || p.status === "SOLD" || p.status === "INACTIVE"}
            onClick={interest}
            className="btn-primary mt-6 w-full disabled:opacity-50"
          >
            {busy ? "Creating enquiry…" : "I'm Interested"}
          </button>
          {message && (
            <p
              role="status"
              className="mt-3 rounded-xl bg-mint p-3 text-sm text-forest"
            >
              {message}
            </p>
          )}
        </aside>
      </div>
      <div id="loan-estimate">
        <MortgageCalculator price={p.price} />
      </div>
    </section>
  );
}
