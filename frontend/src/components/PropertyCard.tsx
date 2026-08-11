import { BedDouble, Bath, MoveUpRight, Ruler } from "lucide-react";
import { Link } from "react-router-dom";
import type { Property } from "../types";
import { money } from "../utils/finance";
import SafeImage from "./SafeImage";
export default function PropertyCard({ property: p }: { property: Property }) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-soft">
      <div className="relative h-56 overflow-hidden">
        <SafeImage
          src={p.images[0] || "/property-placeholder.svg"}
          alt={p.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold shadow-sm">
          {p.propertyType}
        </span>
      </div>
      <div className="p-5">
        <p className="text-sm text-black/50">
          {p.location}, {p.province}
        </p>
        <h3 className="mt-1 text-xl font-bold">{p.title}</h3>
        <p className="mt-3 text-2xl font-bold text-forest">{money(p.price)}</p>
        <div className="my-4 flex gap-4 border-y border-black/5 py-3 text-sm text-black/60">
          <span className="flex gap-1">
            <BedDouble size={17} />
            {p.bedrooms}
          </span>
          <span className="flex gap-1">
            <Bath size={17} />
            {p.bathrooms}
          </span>
          <span className="flex gap-1">
            <Ruler size={17} />
            {p.areaSqm} m²
          </span>
        </div>
        <div className="flex items-center justify-between">
          {p.estimatedMonthlyPayment != null ? (
            <div>
              <p className="text-xs text-black/40">Est. monthly</p>
              <p className="font-semibold">
                {money(p.estimatedMonthlyPayment)}
              </p>
            </div>
          ) : (
            <span />
          )}
          <Link
            to={`/properties/${p.slug}`}
            aria-label={`View ${p.title}`}
            className="rounded-full bg-mint p-3 text-forest transition hover:bg-forest hover:text-white focus:outline-none focus:ring-2 focus:ring-forest/30"
          >
            <MoveUpRight size={20} />
          </Link>
        </div>
      </div>
    </article>
  );
}
