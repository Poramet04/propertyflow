import { CheckCircle2, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SafeImage from "../components/SafeImage";
import { useAuth } from "../hooks/useAuth";
import { preferenceApi, recommendationApi } from "../services/api";
import type {
  PropertyPreference,
  PropertyType,
  RecommendationResponse,
} from "../types";
import { money } from "../utils/finance";
const empty: PropertyPreference = {
  preferredLocations: [],
  propertyTypes: [],
  minBedrooms: 0,
  minBathrooms: 0,
  minArea: null,
  maxArea: null,
  maxMonthlyPayment: null,
  maxPropertyPrice: null,
};
export default function RecommendationsPage() {
  const { token } = useAuth(),
    [pref, setPref] = useState<PropertyPreference>(empty),
    [data, setData] = useState<RecommendationResponse | null>(null),
    [message, setMessage] = useState(""),
    [minScore, setMinScore] = useState(0);
  useEffect(() => {
    if (!token) return;
    Promise.all([preferenceApi.get(token), recommendationApi.get(token)])
      .then(([p, r]) => {
        if (p) setPref(p);
        setData(r);
      })
      .catch((e) => setMessage(e.message));
  }, [token]);
  const setNumber = (key: keyof PropertyPreference, value: string) =>
    setPref({ ...pref, [key]: value === "" ? null : Number(value) });
  const toggle = (
    key: "preferredLocations" | "propertyTypes",
    value: string,
  ) => {
    const list = pref[key] as string[];
    setPref({
      ...pref,
      [key]: list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value],
    });
  };
  const run = async (save = false) => {
    try {
      if (save) await preferenceApi.put(token!, pref);
      setData(await recommendationApi.calculate(token!, pref));
      setMessage(
        save
          ? "Preferences saved and recommendations refreshed."
          : "Recommendations refreshed.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not calculate");
    }
  };
  const shown = data?.recommendations.filter((r) => r.score >= minScore) ?? [];
  return (
    <section className="container-page py-12">
      <p className="eyebrow">Deterministic property matching</p>
      <h1 className="section-title mt-3">Smart recommendations</h1>
      {message && (
        <p role="status" className="mt-5 rounded-xl bg-mint p-3 text-forest">
          {message}
        </p>
      )}
      {data?.profile && (
        <div className="mt-7 grid gap-4 rounded-3xl bg-forest p-6 text-white sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-white/55">Monthly income</p>
            <b>
              {money(
                data.profile.monthlyIncome +
                  data.profile.additionalMonthlyIncome,
              )}
            </b>
          </div>
          <div>
            <p className="text-sm text-white/55">Existing debt</p>
            <b>{money(data.profile.existingDebt)}</b>
          </div>
          <div>
            <p className="text-sm text-white/55">Estimated loan</p>
            <b>{money(data.profile.estimatedLoanAmount)}</b>
          </div>
          <div>
            <p className="text-sm text-white/55">Property budget</p>
            <b>{money(data.profile.estimatedPropertyBudget)}</b>
          </div>
        </div>
      )}
      <div className="mt-7 grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="panel h-fit">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <SlidersHorizontal />
            Preferences
          </h2>
          <label className="mt-5 block text-sm font-bold">Locations</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Sriracha", "Bangsaen", "Pattaya", "Laem Chabang"].map((x) => (
              <button
                className={`rounded-full border px-3 py-2 text-sm ${pref.preferredLocations.includes(x) ? "bg-forest text-white" : ""}`}
                onClick={() => toggle("preferredLocations", x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
          <label className="mt-5 block text-sm font-bold">Property types</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["CONDO", "HOUSE", "TOWNHOME", "VILLA"] as PropertyType[]).map(
              (x) => (
                <button
                  className={`rounded-full border px-3 py-2 text-sm ${pref.propertyTypes.includes(x) ? "bg-forest text-white" : ""}`}
                  onClick={() => toggle("propertyTypes", x)}
                  key={x}
                >
                  {x}
                </button>
              ),
            )}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="text-sm">
              Min bedrooms
              <input
                type="number"
                min="0"
                value={pref.minBedrooms}
                onChange={(e) =>
                  setPref({ ...pref, minBedrooms: Number(e.target.value) })
                }
              />
            </label>
            <label className="text-sm">
              Min bathrooms
              <input
                type="number"
                min="0"
                value={pref.minBathrooms}
                onChange={(e) =>
                  setPref({ ...pref, minBathrooms: Number(e.target.value) })
                }
              />
            </label>
            <label className="text-sm">
              Min area
              <input
                type="number"
                value={pref.minArea ?? ""}
                onChange={(e) => setNumber("minArea", e.target.value)}
              />
            </label>
            <label className="text-sm">
              Max area
              <input
                type="number"
                value={pref.maxArea ?? ""}
                onChange={(e) => setNumber("maxArea", e.target.value)}
              />
            </label>
          </div>
          <label className="mt-3 block text-sm">
            Maximum property price
            <input
              type="number"
              value={pref.maxPropertyPrice ?? ""}
              onChange={(e) => setNumber("maxPropertyPrice", e.target.value)}
            />
          </label>
          <label className="mt-3 block text-sm">
            Maximum monthly payment
            <input
              type="number"
              value={pref.maxMonthlyPayment ?? ""}
              onChange={(e) => setNumber("maxMonthlyPayment", e.target.value)}
            />
          </label>
          <button className="btn-primary mt-5 w-full" onClick={() => run(true)}>
            Save and rank
          </button>
          <label className="mt-5 block text-sm">
            Minimum match score: {minScore}%
            <input
              className="mt-2"
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
            />
          </label>
        </aside>
        <div className="grid gap-5">
          {shown.map((r) => (
            <article
              className="panel grid gap-5 md:grid-cols-[220px_1fr]"
              key={r.property.id}
            >
              <SafeImage
                className="h-48 w-full rounded-2xl object-cover"
                src={r.property.images[0] || "/property-placeholder.svg"}
                alt={r.property.title}
              />
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-black/45">
                      {r.property.location}
                    </p>
                    <h2 className="text-2xl font-bold">{r.property.title}</h2>
                  </div>
                  <span className="rounded-full bg-forest px-4 py-2 font-bold text-white">
                    {r.score}% match
                  </span>
                </div>
                <p className="mt-2 text-xl font-bold text-forest">
                  {money(r.property.price)}
                </p>
                <p className="text-sm text-black/50">
                  Estimated {money(r.estimatedMonthlyPayment)}/month
                </p>
                <ul className="mt-4 grid gap-1 text-sm">
                  {r.reasons.slice(0, 4).map((x) => (
                    <li className="flex gap-2" key={x}>
                      <CheckCircle2 className="text-forest" size={17} />
                      {x}
                    </li>
                  ))}
                  {r.mismatches.slice(0, 2).map((x) => (
                    <li className="text-amber-700" key={x}>
                      • {x}
                    </li>
                  ))}
                </ul>
                <Link
                  className="btn-light mt-4"
                  to={`/properties/${r.property.slug}`}
                >
                  View Property
                </Link>
              </div>
            </article>
          ))}
          {!shown.length && (
            <div className="panel text-center">
              No properties meet the current score filter.
            </div>
          )}
        </div>
      </div>
      <p className="mt-10 text-sm text-black/45">
        Scores use fixed business rules—not AI: budget 35, location 20, type 10,
        bedrooms 10, bathrooms 5, area 10 and monthly payment 10 points.
      </p>
    </section>
  );
}
