import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useProperties } from "../hooks/useProperties";
import { favoriteApi } from "../services/api";
import type { Property } from "../types";

export default function PropertiesPage() {
  const { properties, status } = useProperties();
  const { token, user } = useAuth();
  const { pick } = useLanguage();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [location, setLocation] = useState(""),
    [min, setMin] = useState(0),
    [max, setMax] = useState(10000000),
    [beds, setBeds] = useState(0),
    [baths, setBaths] = useState(0),
    [type, setType] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteBusy, setFavoriteBusy] = useState<string[]>([]);
  const [favoriteError, setFavoriteError] = useState("");
  useEffect(() => {
    if (token && user?.role === "CUSTOMER")
      favoriteApi
        .list(token)
        .then((items) => setFavoriteIds(new Set(items.map((item) => item.id))))
        .catch((caught) => setFavoriteError(caught.message));
    else setFavoriteIds(new Set());
  }, [token, user?.role]);
  const toggleFavorite = async (property: Property) => {
    if (!token || !user) {
      navigate("/login", { state: { from: routeLocation.pathname } });
      return;
    }
    if (user.role !== "CUSTOMER") return;
    const removing = favoriteIds.has(property.id);
    setFavoriteError("");
    setFavoriteBusy((current) => [...current, property.id]);
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (removing) next.delete(property.id);
      else next.add(property.id);
      return next;
    });
    try {
      if (removing) await favoriteApi.remove(token, property.id);
      else await favoriteApi.add(token, property.id);
    } catch (caught) {
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (removing) next.add(property.id);
        else next.delete(property.id);
        return next;
      });
      setFavoriteError(
        caught instanceof Error
          ? caught.message
          : pick("Could not update favorites", "ไม่สามารถอัปเดตรายการโปรดได้"),
      );
    } finally {
      setFavoriteBusy((current) => current.filter((id) => id !== property.id));
    }
  };
  const shown = useMemo(
    () =>
      properties.filter(
        (p) =>
          (!location || p.location === location) &&
          p.price >= min &&
          p.price <= max &&
          p.bedrooms >= beds &&
          p.bathrooms >= baths &&
          (!type || p.propertyType === type),
      ),
    [properties, location, min, max, beds, baths, type],
  );
  return (
    <section className="container-page py-14">
      <p className="eyebrow">Browse Chonburi</p>
      <h1 className="section-title mt-3">Find your kind of home</h1>
      <div className="panel mt-9">
        <div className="mb-5 flex items-center gap-2 font-bold">
          <SlidersHorizontal size={19} /> Filter properties
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <select
            aria-label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">All locations</option>
            {["Sriracha", "Laem Chabang", "Bangsaen", "Pattaya"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <input
            aria-label="Minimum price"
            type="number"
            min="0"
            placeholder="Min price"
            onChange={(e) => setMin(Number(e.target.value) || 0)}
          />
          <input
            aria-label="Maximum price"
            type="number"
            min="0"
            placeholder="Max price"
            onChange={(e) => setMax(Number(e.target.value) || 1e9)}
          />
          <select
            aria-label="Bedrooms"
            value={beds}
            onChange={(e) => setBeds(Number(e.target.value))}
          >
            <option value="0">Any beds</option>
            <option value="1">{pick("1 bedroom", "1 ห้องนอน")}</option>
            <option value="2">{pick("2 bedrooms", "2 ห้องนอน")}</option>
            <option value="3">{pick("3 bedrooms", "3 ห้องนอน")}</option>
          </select>
          <select
            aria-label="Bathrooms"
            value={baths}
            onChange={(e) => setBaths(Number(e.target.value))}
          >
            <option value="0">Any baths</option>
            <option value="1">{pick("1 bathroom", "1 ห้องน้ำ")}</option>
            <option value="2">{pick("2 bathrooms", "2 ห้องน้ำ")}</option>
            <option value="3">{pick("3 bathrooms", "3 ห้องน้ำ")}</option>
          </select>
          <select
            aria-label="Property type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All types</option>
            {["CONDO", "HOUSE", "TOWNHOME", "VILLA"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </div>
      {status === "fallback" && (
        <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          The live property service is unavailable. Showing bundled demo
          listings.
        </p>
      )}
      {status === "loading" && (
        <p className="mt-5 text-sm text-black/45" role="status">
          {pick("Refreshing the latest property data...", "กำลังอัปเดตข้อมูลอสังหาริมทรัพย์ล่าสุด...")}
        </p>
      )}
      {favoriteError && (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {favoriteError}
        </p>
      )}
      <>
          <p className="mt-8 text-sm text-black/50">
            {shown.length} fictional properties found
          </p>
          <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                favorite={favoriteIds.has(p.id)}
                favoriteBusy={favoriteBusy.includes(p.id)}
                onToggleFavorite={
                  !user || user.role === "CUSTOMER" ? toggleFavorite : undefined
                }
              />
            ))}
          </div>
          {!shown.length && (
            <div className="panel mt-6 text-center">
              <h2 className="text-xl font-bold">No exact matches</h2>
              <p className="mt-2 text-black/50">
                Try widening your budget or changing a filter.
              </p>
            </div>
          )}
      </>
    </section>
  );
}
