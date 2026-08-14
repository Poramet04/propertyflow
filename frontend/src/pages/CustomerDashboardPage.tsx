import { CalendarDays, Heart, Home, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import { ErrorState, LoadingState } from "../components/UiState";
import { useAuth } from "../hooks/useAuth";
import { customerDashboardApi } from "../services/api";
import type { CustomerDashboard } from "../types";
import { money } from "../utils/finance";
export default function CustomerDashboardPage() {
  const { token } = useAuth(),
    [data, setData] = useState<CustomerDashboard | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (token)
      customerDashboardApi
        .get(token)
        .then(setData)
        .catch((e) => setError(e.message));
  }, [token]);
  if (error) return <div className="container-page py-12"><ErrorState message={error}/></div>;
  if (!data) return <div className="container-page py-12"><LoadingState label="Loading your property plan..."/></div>;
  return (
    <section className="container-page py-12">
      <p className="eyebrow">Customer dashboard</p>
      <h1 className="section-title mt-3">Your property plan</h1>
      <div className="mt-7 grid gap-4 md:grid-cols-4">
        <div className="panel">
          <Wallet className="text-forest" />
          <p className="mt-4 text-sm text-black/45">
            Estimated property budget
          </p>
          <b className="text-2xl">
            {data.profile
              ? money(data.profile.estimatedPropertyBudget)
              : "Not calculated"}
          </b>
        </div>
        <div className="panel">
          <Home className="text-forest" />
          <p className="mt-4 text-sm text-black/45">Active leads</p>
          <b className="text-2xl">
            {
              data.leads.filter((l) => !["CLOSED", "LOST"].includes(l.status))
                .length
            }
          </b>
        </div>
        <div className="panel">
          <CalendarDays className="text-forest" />
          <p className="mt-4 text-sm text-black/45">Upcoming viewings</p>
          <b className="text-2xl">{data.upcomingAppointments.length}</b>
        </div>
        <div className="panel">
          <Heart className="text-forest" />
          <p className="mt-4 text-sm text-black/45">Favorites</p>
          <b className="text-2xl">{data.favorites.length}</b>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="btn-primary" to="/affordability">
          Update affordability
        </Link>
        <Link className="btn-light" to="/recommendations">
          Edit preferences
        </Link>
        <Link className="btn-light" to="/my-leads">
          View enquiries
        </Link>
        <Link className="btn-light" to="/favorites">
          View favorites
        </Link>
      </div>
      <div className="mt-12">
        <h2 className="text-3xl font-bold">Top recommendations</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.recommendations.slice(0, 3).map((r) => (
            <div key={r.property.id}>
              <div className="mb-2 inline-block rounded-full bg-forest px-3 py-1 text-sm font-bold text-white">
                {r.score}% match
              </div>
              <PropertyCard
                property={{
                  ...r.property,
                  estimatedMonthlyPayment: r.estimatedMonthlyPayment,
                }}
              />
            </div>
          ))}
        </div>
      </div>
      {data.upcomingAppointments.length > 0 && (
        <div className="panel mt-10">
          <h2 className="text-xl font-bold">Upcoming appointments</h2>
          {data.upcomingAppointments.map((a) => (
            <p className="mt-3" key={a.id}>
              {a.property} · {new Date(a.appointmentDate).toLocaleString()}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
