import { ArrowRight, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NumberField from "../components/NumberField";
import PropertyCard from "../components/PropertyCard";
import { properties } from "../data/properties";
export default function HomePage() {
  const nav = useNavigate(),
    [income, setIncome] = useState(45000),
    [debt, setDebt] = useState(5000),
    [down, setDown] = useState(350000),
    [years, setYears] = useState(30);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav(
      `/affordability?income=${income}&debt=${debt}&down=${down}&years=${years}`,
    );
  };
  return (
    <>
      <section className="container-page grid min-h-[760px] items-center gap-12 py-14 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="eyebrow">Smarter property decisions</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-extrabold leading-[1.04] tracking-[-.05em] md:text-7xl">
            Find a home that fits your{" "}
            <span className="text-forest">life and budget.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-black/60">
            Explore fictional homes across Chonburi, understand your estimated
            buying power, and move forward with clarity.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn-primary gap-2" to="/properties">
              Explore properties <ArrowRight size={18} />
            </Link>
            <Link className="btn-light" to="/affordability">
              Plan my budget
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap gap-6 text-sm text-black/50">
            <span className="flex gap-2">
              <ShieldCheck size={18} className="text-forest" />
              Transparent estimates
            </span>
            <span className="flex gap-2">
              <Sparkles size={18} className="text-forest" />
              Curated Chonburi homes
            </span>
          </div>
        </div>
        <form onSubmit={submit} className="panel relative overflow-hidden">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-mint" />
          <div className="relative">
            <span className="inline-flex rounded-xl bg-forest p-3 text-white">
              <WalletCards />
            </span>
            <h2 className="mt-5 text-2xl font-bold">
              What could fit your budget?
            </h2>
            <p className="mt-2 text-black/50">
              Get a quick, illustrative estimate.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <NumberField
                label="Monthly income"
                value={income}
                onChange={setIncome}
                suffix="THB"
              />
              <NumberField
                label="Existing monthly debt"
                value={debt}
                onChange={setDebt}
                suffix="THB"
              />
              <NumberField
                label="Available down payment"
                value={down}
                onChange={setDown}
                suffix="THB"
              />
              <label>
                <span className="mb-2 block text-sm font-semibold">
                  Preferred loan term
                </span>
                <select
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                >
                  <option value="15">15 years</option>
                  <option value="20">20 years</option>
                  <option value="25">25 years</option>
                  <option value="30">30 years</option>
                </select>
              </label>
            </div>
            <button className="btn-primary mt-6 w-full" type="submit">
              Calculate My Budget
            </button>
            <p className="mt-3 text-center text-xs text-black/40">
              Estimate only — not a bank approval or offer.
            </p>
          </div>
        </form>
      </section>
      <section className="bg-mint/60 py-20">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Recommended for you</p>
              <h2 className="section-title mt-3">A better place to begin</h2>
            </div>
            <Link
              to="/properties"
              className="hidden font-semibold text-forest sm:block"
            >
              View all →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {properties
              .filter((p) => p.featured)
              .map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
