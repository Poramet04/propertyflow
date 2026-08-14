import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import { ErrorState, LoadingState } from "../components/UiState";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { favoriteApi } from "../services/api";
import type { Property } from "../types";

export default function FavoritesPage() {
  const { token } = useAuth();
  const { pick } = useLanguage();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [busy, setBusy] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (token)
      favoriteApi
        .list(token)
        .then(setFavorites)
        .catch((caught) => setError(caught.message))
        .finally(() => setLoading(false));
  }, [token]);
  const remove = async (property: Property) => {
    if (!token) return;
    setError("");
    setBusy((current) => [...current, property.id]);
    setFavorites((current) => current.filter((item) => item.id !== property.id));
    try {
      await favoriteApi.remove(token, property.id);
    } catch (caught) {
      setFavorites((current) => [...current, property]);
      setError(
        caught instanceof Error
          ? caught.message
          : pick("Could not remove favorite", "ไม่สามารถนำรายการโปรดออกได้"),
      );
    } finally {
      setBusy((current) => current.filter((id) => id !== property.id));
    }
  };
  if (loading)
    return (
      <div className="container-page py-12">
        <LoadingState label={pick("Loading favorites...", "กำลังโหลดรายการโปรด...")} />
      </div>
    );
  return (
    <section className="container-page py-12">
      <p className="eyebrow">{pick("Saved homes", "บ้านที่บันทึกไว้")}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">{pick("My favorites", "รายการโปรดของฉัน")}</h1>
          <p className="mt-3 text-black/50">
            {pick(
              "Save properties here without contacting an agent.",
              "บันทึกอสังหาริมทรัพย์ไว้เปรียบเทียบก่อนได้ โดยยังไม่ส่งข้อมูลหาเจ้าหน้าที่",
            )}
          </p>
        </div>
        <span className="rounded-full bg-mint px-4 py-2 font-semibold text-forest">
          {pick(`${favorites.length} favorites`, `${favorites.length} รายการ`)}
        </span>
      </div>
      {error && <div className="mt-6"><ErrorState message={error} /></div>}
      {favorites.length ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              favorite
              favoriteBusy={busy.includes(property.id)}
              onToggleFavorite={remove}
            />
          ))}
        </div>
      ) : (
        <div className="panel mt-8 text-center">
          <Heart className="mx-auto text-forest" size={34} />
          <h2 className="mt-4 text-xl font-bold">
            {pick("No favorites yet", "ยังไม่มีรายการโปรด")}
          </h2>
          <p className="mt-2 text-black/50">
            {pick(
              "Select the heart on a property card to save it here.",
              "กดรูปหัวใจบนการ์ดอสังหาริมทรัพย์เพื่อบันทึกไว้ที่นี่",
            )}
          </p>
          <Link className="btn-primary mt-5" to="/properties">
            {pick("Browse properties", "ดูอสังหาริมทรัพย์")}
          </Link>
        </div>
      )}
    </section>
  );
}
