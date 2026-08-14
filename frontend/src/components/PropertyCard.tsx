import { BedDouble, Bath, Heart, Ruler } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import type { Property } from "../types";
import { money } from "../utils/finance";
import SafeImage from "./SafeImage";
interface PropertyCardProps {
  property: Property;
  favorite?: boolean;
  favoriteBusy?: boolean;
  onToggleFavorite?: (property: Property) => void;
}
export default function PropertyCard({
  property: p,
  favorite = false,
  favoriteBusy = false,
  onToggleFavorite,
}: PropertyCardProps) {
  const { pick } = useLanguage();
  return (
    <article className="group relative overflow-hidden rounded-3xl bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
      <Link
        to={`/properties/${p.slug}`}
        aria-label={`View ${p.title}`}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest"
      >
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
            <span className="flex gap-1"><BedDouble size={17} />{p.bedrooms}</span>
            <span className="flex gap-1"><Bath size={17} />{p.bathrooms}</span>
            <span className="flex gap-1"><Ruler size={17} />{p.areaSqm} m²</span>
          </div>
          <div>
            {p.estimatedMonthlyPayment != null ? (
              <div>
                <p className="text-xs text-black/40">Est. monthly</p>
                <p className="font-semibold">{money(p.estimatedMonthlyPayment)}</p>
              </div>
            ) : <span />}
          </div>
        </div>
      </Link>
      {onToggleFavorite && (
        <button
          type="button"
          disabled={favoriteBusy}
          onClick={() => onToggleFavorite(p)}
          aria-label={
            favorite
              ? pick(`Remove ${p.title} from favorites`, `นำ ${p.title} ออกจากรายการโปรด`)
              : pick(`Add ${p.title} to favorites`, `เพิ่ม ${p.title} ในรายการโปรด`)
          }
          title={pick(
            favorite ? "Remove from favorites" : "Add to favorites",
            favorite ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด",
          )}
          className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-md transition disabled:opacity-50 ${
            favorite
              ? "border-forest bg-forest text-white"
              : "border-white/70 bg-white/90 text-forest hover:bg-mint"
          }`}
        >
          <Heart size={20} fill={favorite ? "currentColor" : "none"} />
        </button>
      )}
    </article>
  );
}
